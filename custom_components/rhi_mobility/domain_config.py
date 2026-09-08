from __future__ import annotations
from copy import deepcopy
import re
from typing import Any, Callable

CONFIG_KEY = "domain_semantic_configuration"
REVISION_KEY = "domain_semantic_configuration_revision"
LEGACY_CONFIG_KEY = "domain_config_overrides"
GUEST_VEHICLES_KEY = "guest_vehicles"


def _guest_asset_id(name: str, existing: set[str]) -> str:
    """Create a readable, stable local id without inventing a technical HA device."""
    slug = re.sub(r"[^a-z0-9]+", "_", str(name).strip().lower()).strip("_") or "guest"
    base = f"vehicle_guest_{slug[:32]}"
    candidate = base
    suffix = 2
    while candidate in existing:
        candidate = f"{base}_{suffix}"
        suffix += 1
    return candidate

class MobilityDomainConfiguration:
    """Revisioned Mobility-owned semantic product configuration.

    Foundation remains authority for technical integration/device/candidate selection and
    SelectedDomainBuildInput revisions. This store contains only Mobility semantics that
    never mutate AcceptedSourceBinding or technical source identity.
    """
    def __init__(self, hass, entry) -> None:
        self.hass = hass
        self.entry = entry
        options = dict(getattr(entry, "options", {}) or {})
        raw = options.get(CONFIG_KEY, options.get(LEGACY_CONFIG_KEY, {}))
        self._data: dict[str, dict[str, Any]] = deepcopy(raw) if isinstance(raw, dict) else {}
        try:
            self._revision = max(0, int(options.get(REVISION_KEY, 0)))
        except (TypeError, ValueError):
            self._revision = 0
        self._legacy_migration_required = LEGACY_CONFIG_KEY in options and CONFIG_KEY not in options
        self._listeners: list[Callable[[str, str], None]] = []

    def guest_vehicles(self) -> dict[str, dict[str, Any]]:
        raw = (getattr(self.entry, "options", {}) or {}).get(GUEST_VEHICLES_KEY, {})
        return deepcopy(raw) if isinstance(raw, dict) else {}

    def is_guest_vehicle(self, asset_id: str) -> bool:
        return asset_id in self.guest_vehicles()

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
        await self._async_store_guests(
            guests, asset_id, "guest_vehicle_removed", semantic_data=updated
        )

    @staticmethod
    def _validate_guest_vehicle(values: dict[str, Any]) -> dict[str, Any]:
        name = str(values.get("name") or "").strip()
        profile_id = str(values.get("profile_id") or "").strip()
        if not name:
            raise ValueError("guest vehicle name is required")
        if profile_id not in {"guest_phev_1phase", "guest_ev_3phase"}:
            raise ValueError("unsupported guest vehicle profile")
        capacity = float(values.get("battery_capacity_kwh"))
        soc = float(values.get("soc_pct", 0))
        energy_raw = values.get("battery_energy_kwh")
        energy = capacity * soc / 100.0 if energy_raw in (None, "") else float(energy_raw)
        if capacity <= 0 or not 0 <= soc <= 100 or not 0 <= energy <= capacity:
            raise ValueError("invalid guest vehicle battery values")
        selected = str(values.get("selected_charger") or "").strip() or None
        return {
            "name": name,
            "profile_id": profile_id,
            "battery_capacity_kwh": round(capacity, 3),
            "soc_pct": round(soc, 3),
            "battery_energy_kwh": round(energy, 3),
            "present": bool(values.get("present", True)),
            "selected_charger": selected,
            "lifecycle_status": "disabled" if values.get("lifecycle_status") == "disabled" else "active",
        }

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
