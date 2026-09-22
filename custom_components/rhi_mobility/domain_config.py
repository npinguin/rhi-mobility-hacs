from __future__ import annotations
from copy import deepcopy
import re
from typing import Any, Callable

CONFIG_KEY = "domain_semantic_configuration"
REVISION_KEY = "domain_semantic_configuration_revision"
LEGACY_CONFIG_KEY = "domain_config_overrides"
GUEST_VEHICLES_KEY = "guest_vehicles"
PROFILES_KEY = "mobility_profiles"
PROFILE_TYPES = {"vehicle", "charger"}


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value).strip().lower()).strip("_")


def _guest_asset_id(name: str, existing: set[str]) -> str:
    """Create a readable, stable local id without inventing a technical HA device."""
    slug = _slug(name) or "guest"
    base = f"vehicle_guest_{slug[:32]}"
    candidate = base
    suffix = 2
    while candidate in existing:
        candidate = f"{base}_{suffix}"
        suffix += 1
    return candidate


def _profile_id(profile_type: str, name: str, existing: set[str]) -> str:
    """Create a stable Mobility-owned logical profile id."""
    prefix = "vehicle_profile" if profile_type == "vehicle" else "charger_profile"
    base = f"{prefix}_{(_slug(name) or 'custom')[:40]}"
    candidate = base
    suffix = 2
    while candidate in existing:
        candidate = f"{base}_{suffix}"
        suffix += 1
    return candidate


class MobilityDomainConfiguration:
    """Revisioned Mobility-owned semantic product configuration."""

    def __init__(self, hass, entry) -> None:
        self.hass = hass
        self.entry = entry
        options = dict(getattr(entry, "options", {}) or {})
        raw = options.get(CONFIG_KEY, options.get(LEGACY_CONFIG_KEY, {}))
        self._data: dict[str, dict[str, Any]] = deepcopy(raw) if isinstance(raw, dict) else {}
        raw_profiles = options.get(PROFILES_KEY, {})
        self._profiles: dict[str, dict[str, Any]] = deepcopy(raw_profiles) if isinstance(raw_profiles, dict) else {}
        try:
            self._revision = max(0, int(options.get(REVISION_KEY, 0)))
        except (TypeError, ValueError):
            self._revision = 0
        self._legacy_migration_required = LEGACY_CONFIG_KEY in options and CONFIG_KEY not in options
        self._listeners: list[Callable[[str, str], None]] = []
        # Normal package loading binds the registry overlay. Direct module unit tests do
        # not have a package context and therefore intentionally skip this convenience.
        try:
            from .model_registry import set_profile_overlay_provider
        except ImportError:
            set_profile_overlay_provider = None
        if callable(set_profile_overlay_provider):
            set_profile_overlay_provider(self)

    def guest_vehicles(self) -> dict[str, dict[str, Any]]:
        raw = (getattr(self.entry, "options", {}) or {}).get(GUEST_VEHICLES_KEY, {})
        return deepcopy(raw) if isinstance(raw, dict) else {}

    def is_guest_vehicle(self, asset_id: str) -> bool:
        return asset_id in self.guest_vehicles()

    def profiles(self) -> dict[str, dict[str, Any]]:
        """Return Mobility-authored profiles; packaged catalog profiles remain immutable."""
        return deepcopy(self._profiles)

    def profile(self, profile_id: str | None) -> dict[str, Any] | None:
        if not profile_id:
            return None
        row = self._profiles.get(str(profile_id))
        return dict(row) if isinstance(row, dict) else None

    def profiles_for_type(self, profile_type: str) -> list[dict[str, Any]]:
        return [dict(row) for row in self._profiles.values() if row.get("profile_type") == profile_type]

    async def async_add_profile(self, values: dict[str, Any]) -> str:
        profiles = self.profiles()
        validated = self._validate_profile(values)
        profile_id = _profile_id(validated["profile_type"], validated["display_name"], set(profiles))
        validated["profile_id"] = profile_id
        profiles[profile_id] = validated
        await self._async_store_profiles(profiles, profile_id, "profile_added")
        return profile_id

    async def async_update_profile(self, profile_id: str, values: dict[str, Any]) -> None:
        profiles = self.profiles()
        current = profiles.get(profile_id)
        if not isinstance(current, dict):
            raise ValueError(f"unknown Mobility-authored profile: {profile_id}")
        validated = self._validate_profile(values)
        if validated["profile_type"] != current.get("profile_type"):
            raise ValueError("profile type cannot be changed")
        validated["profile_id"] = profile_id
        profiles[profile_id] = validated
        await self._async_store_profiles(profiles, profile_id, "profile_updated")

    async def async_remove_profile(self, profile_id: str) -> None:
        profiles = self.profiles()
        if profile_id not in profiles:
            raise ValueError(f"unknown Mobility-authored profile: {profile_id}")
        assigned = [
            asset_id for asset_id, row in self._data.items()
            if isinstance(row, dict) and row.get("asset.profile_id") == profile_id
        ]
        assigned.extend(
            asset_id for asset_id, row in self.guest_vehicles().items()
            if isinstance(row, dict) and row.get("profile_id") == profile_id
        )
        if assigned:
            raise ValueError(f"profile is assigned to Mobility assets: {', '.join(sorted(set(assigned)))}")
        profiles.pop(profile_id)
        await self._async_store_profiles(profiles, profile_id, "profile_removed")

    @staticmethod
    def _validate_profile(values: dict[str, Any]) -> dict[str, Any]:
        profile_type = str(values.get("profile_type") or "").strip().lower()
        if profile_type not in PROFILE_TYPES:
            raise ValueError("profile_type must be vehicle or charger")
        display_name = str(values.get("display_name") or "").strip()
        if not display_name:
            raise ValueError("profile display_name is required")
        short_name = str(values.get("short_name") or display_name).strip()
        image_key = str(values.get("image_key") or "").strip() or None
        brand = str(values.get("brand") or values.get("manufacturer") or values.get("vendor") or "").strip() or None
        model = str(values.get("model") or "").strip() or None
        variant = str(values.get("variant") or "").strip() or None
        year_raw = values.get("model_year")
        model_year = None if year_raw in (None, "") else int(year_raw)
        if model_year is not None and not 1900 <= model_year <= 2200:
            raise ValueError("model_year must be between 1900 and 2200")
        row: dict[str, Any] = {
            "profile_type": profile_type,
            "display_name": display_name,
            "short_name": short_name,
            "brand": brand,
            "model": model,
            "variant": variant,
            "model_year": model_year,
            "auto_resolve": bool(brand and model and variant and model_year),
            "catalog_role": "user_product",
            "image_key": image_key,
        }
        if profile_type == "vehicle":
            row.update({
                "manufacturer": brand,
                "vehicle_kind": str(values.get("vehicle_kind") or "").strip() or None,
                "battery_capacity_kwh": _optional_positive_float(values.get("battery_capacity_kwh")),
                "nominal_range_km": _optional_positive_float(values.get("nominal_range_km")),
                "max_ac_power_kw": _optional_positive_float(values.get("max_ac_power_kw")),
                "phase_capability": _optional_phase_count(values.get("phase_capability")),
                "default_target_soc_pct": _optional_percentage(values.get("default_target_soc_pct")),
            })
        else:
            min_current = _optional_nonnegative_float(values.get("min_current_a"))
            max_current = _optional_positive_float(values.get("max_current_a"))
            if min_current is not None and max_current is not None and min_current > max_current:
                raise ValueError("charger min_current_a cannot exceed max_current_a")
            row.update({
                "vendor": brand,
                "max_current_a": max_current,
                "min_current_a": min_current,
                "max_power_kw": _optional_positive_float(values.get("max_power_kw")),
                "phase_capability": _optional_phase_count(values.get("phase_capability")),
                "nominal_voltage_v": _optional_positive_float(values.get("nominal_voltage_v")),
                "supports_current_control": bool(values.get("supports_current_control", False)),
                "supports_remote_start_stop": bool(values.get("supports_remote_start_stop", False)),
                "current_step_a": _optional_positive_float(values.get("current_step_a")),
            })
        return {key: value for key, value in row.items() if value is not None}

    async def _async_store_profiles(self, profiles: dict[str, dict[str, Any]], profile_id: str, change: str) -> None:
        options = dict(getattr(self.entry, "options", {}) or {})
        options[PROFILES_KEY] = deepcopy(profiles)
        options.pop(LEGACY_CONFIG_KEY, None)
        self._revision += 1
        options[REVISION_KEY] = self._revision
        self._profiles = deepcopy(profiles)
        self.hass.config_entries.async_update_entry(self.entry, options=options)
        for callback in tuple(self._listeners):
            callback(profile_id, change)

    async def async_add_guest_vehicle(self, values: dict[str, Any]) -> str:
        guests = self.guest_vehicles()
        asset_id = _guest_asset_id(str(values.get("name") or "Guest vehicle"), set(guests))
        guests[asset_id] = self._validate_guest_vehicle(values)
        await self._async_store_guests(guests, asset_id, "guest_vehicle_added")
        return asset_id

    async def async_update_guest_vehicle(self, asset_id: str, values: dict[str, Any]) -> None:
        guests = self.guest_vehicles()
        if asset_id not in guests:
            raise ValueError(f"unknown guest vehicle: {asset_id}")
        guests[asset_id] = self._validate_guest_vehicle(values)
        await self._async_store_guests(guests, asset_id, "guest_vehicle_updated")

    async def async_remove_guest_vehicle(self, asset_id: str) -> None:
        guests = self.guest_vehicles()
        if asset_id not in guests:
            raise ValueError(f"unknown guest vehicle: {asset_id}")
        guests.pop(asset_id)
        updated = deepcopy(self._data)
        updated.pop(asset_id, None)
        self._data = updated
        await self._async_store_guests(guests, asset_id, "guest_vehicle_removed", semantic_data=updated)

    @staticmethod
    def _validate_guest_vehicle(values: dict[str, Any], allowed_profile_ids: set[str] | None = None) -> dict[str, Any]:
        name = str(values.get("name") or "").strip()
        if not name:
            raise ValueError("guest vehicle name is required")
        profile_id = str(values.get("profile_id") or "").strip() or None
        if profile_id and allowed_profile_ids is not None and profile_id not in allowed_profile_ids:
            raise ValueError("unsupported guest vehicle profile")
        brand = str(values.get("brand") or "").strip() or None
        model = str(values.get("model") or "").strip() or None
        variant = str(values.get("variant") or "").strip() or None
        year_raw = values.get("model_year")
        model_year = None if year_raw in (None, "") else int(year_raw)
        if model_year is not None and not 1900 <= model_year <= 2200:
            raise ValueError("invalid guest vehicle model_year")
        if profile_id is None and not (brand and model):
            raise ValueError("guest vehicle requires a profile or free-format brand and model")
        capacity_raw = values.get("battery_capacity_kwh")
        capacity = None if capacity_raw in (None, "") else float(capacity_raw)
        soc_raw = values.get("soc_pct")
        soc = None if soc_raw in (None, "") else float(soc_raw)
        energy_raw = values.get("battery_energy_kwh")
        energy = None if energy_raw in (None, "") else float(energy_raw)
        if capacity is not None and capacity <= 0:
            raise ValueError("invalid guest vehicle battery capacity")
        if soc is not None and not 0 <= soc <= 100:
            raise ValueError("invalid guest vehicle soc")
        if energy is not None and (energy < 0 or (capacity is not None and energy > capacity)):
            raise ValueError("invalid guest vehicle battery energy")
        if energy is None and capacity is not None and soc is not None:
            energy = capacity * soc / 100.0
        selected = str(values.get("selected_charger") or "").strip() or None
        row = {
            "name": name,
            "profile_id": profile_id,
            "brand": brand,
            "model": model,
            "variant": variant,
            "model_year": model_year,
            "color": str(values.get("color") or "").strip() or None,
            "image_key": str(values.get("image_key") or "").strip() or None,
            "battery_capacity_kwh": None if capacity is None else round(capacity, 3),
            "soc_pct": None if soc is None else round(soc, 3),
            "battery_energy_kwh": None if energy is None else round(energy, 3),
            "present": bool(values.get("present", True)),
            "selected_charger": selected,
            "lifecycle_status": "disabled" if values.get("lifecycle_status") == "disabled" else "active",
        }
        return {key: value for key, value in row.items() if value is not None}

    async def _async_store_guests(
        self,
        guests: dict[str, dict[str, Any]],
        asset_id: str,
        change: str,
        *,
        semantic_data: dict[str, dict[str, Any]] | None = None,
    ) -> None:
        options = dict(getattr(self.entry, "options", {}) or {})
        options[GUEST_VEHICLES_KEY] = deepcopy(guests)
        options.pop(LEGACY_CONFIG_KEY, None)
        if semantic_data is not None:
            options[CONFIG_KEY] = deepcopy(semantic_data)
        self._revision += 1
        options[REVISION_KEY] = self._revision
        self.hass.config_entries.async_update_entry(self.entry, options=options)
        for callback in tuple(self._listeners):
            callback(asset_id, change)

    @property
    def revision(self) -> int:
        return self._revision

    async def async_initialize(self) -> None:
        """Migrate the M0.3.1/0.3.2 storage key without changing semantic values."""
        if not self._legacy_migration_required:
            return
        options = dict(getattr(self.entry, "options", {}) or {})
        options.pop(LEGACY_CONFIG_KEY, None)
        options[CONFIG_KEY] = deepcopy(self._data)
        self._revision = max(1, self._revision)
        options[REVISION_KEY] = self._revision
        self.hass.config_entries.async_update_entry(self.entry, options=options)
        self._legacy_migration_required = False

    def get(self, asset_id: str, property_key: str, default: Any = None) -> Any:
        row = self._data.get(asset_id, {})
        if isinstance(row, dict) and property_key in row:
            return row[property_key]
        guest = self.guest_vehicles().get(asset_id, {})
        guest_fields = {
            "asset.display_name": "name",
            "asset.profile_id": "profile_id",
            "asset.lifecycle_status": "lifecycle_status",
            "vehicle.battery_capacity_kwh": "battery_capacity_kwh",
            "vehicle.soc_pct": "soc_pct",
            "vehicle.battery_energy_kwh": "battery_energy_kwh",
            "vehicle.present": "present",
            "vehicle.selected_charger": "selected_charger",
            "vehicle.brand": "brand",
            "vehicle.model": "model",
            "vehicle.variant": "variant",
            "vehicle.model_year": "model_year",
            "vehicle.color": "color",
            "vehicle.image_key": "image_key",
        }
        field = guest_fields.get(property_key)
        return guest.get(field, default) if field else default

    def asset_values(self, asset_id: str) -> dict[str, Any]:
        row = self._data.get(asset_id, {})
        return dict(row) if isinstance(row, dict) else {}

    def snapshot(self) -> dict[str, dict[str, Any]]:
        return deepcopy(self._data)

    def add_listener(self, callback: Callable[[str, str], None]) -> Callable[[], None]:
        self._listeners.append(callback)
        def remove() -> None:
            if callback in self._listeners:
                self._listeners.remove(callback)
        return remove

    async def async_set(self, asset_id: str, property_key: str, value: Any) -> None:
        if not asset_id or not property_key:
            raise ValueError("asset_id and property_key are required")
        updated = deepcopy(self._data)
        row = dict(updated.get(asset_id, {}))
        if value is None:
            row.pop(property_key, None)
        else:
            row[property_key] = value
        if row:
            updated[asset_id] = row
        else:
            updated.pop(asset_id, None)
        options = dict(getattr(self.entry, "options", {}) or {})
        options.pop(LEGACY_CONFIG_KEY, None)
        options[CONFIG_KEY] = updated
        self._revision += 1
        options[REVISION_KEY] = self._revision
        self.hass.config_entries.async_update_entry(self.entry, options=options)
        self._data = updated
        self._legacy_migration_required = False
        for callback in tuple(self._listeners):
            callback(asset_id, property_key)


def _optional_positive_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    parsed = float(value)
    if parsed <= 0:
        raise ValueError("value must be positive")
    return parsed


def _optional_nonnegative_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    parsed = float(value)
    if parsed < 0:
        raise ValueError("value must be non-negative")
    return parsed


def _optional_phase_count(value: Any) -> int | None:
    if value in (None, ""):
        return None
    parsed = int(value)
    if parsed not in {1, 2, 3}:
        raise ValueError("phase_capability must be 1, 2 or 3")
    return parsed


def _optional_percentage(value: Any) -> float | None:
    if value in (None, ""):
        return None
    parsed = float(value)
    if not 0 <= parsed <= 100:
        raise ValueError("percentage must be between 0 and 100")
    return parsed
