from __future__ import annotations
from copy import deepcopy
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)
from .const import DOMAIN, NAME
from .domain_config import (
    GUEST_VEHICLES_KEY,
    PROFILES_KEY,
    DISABLED_PROFILES_KEY,
    REVISION_KEY,
    MobilityDomainConfiguration,
    _guest_asset_id,
)


class RhiMobilityConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    @staticmethod
    def async_get_options_flow(config_entry):
        # Home Assistant owns OptionsFlow.config_entry and injects it before the
        # first step. Passing/assigning the entry ourselves is no longer supported.
        return RhiMobilityOptionsFlow()

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title=NAME, data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))


class RhiMobilityOptionsFlow(getattr(config_entries, "OptionsFlow", object)):
    """Mobility-owned product configuration.

    Foundation owns technical selection. This flow edits only canonical Mobility product
    semantics. VehicleProfile and ChargerProfile are first-class Mobility-owned logical
    entities and are managed here without Foundation reconfiguration.
    """

    _PRODUCT_WRITE_KINDS = {"configuration", "profile", "selected_charger", "lifecycle_status_alias"}
    _PRODUCT_FIELD_ORDER = {
        "asset.profile_id": 10,
        "asset.display_name": 20,
        "asset.short_name": 30,
        "asset.owner_label": 40,
        "asset.location_label": 40,
        "vehicle.brand": 50,
        "charger.brand": 50,
        "vehicle.model": 60,
        "charger.model": 60,
        "vehicle.variant": 70,
        "charger.variant": 70,
        "vehicle.model_year": 80,
        "charger.model_year": 80,
        "vehicle.color": 90,
        "charger.color": 90,
        "vehicle.battery_capacity_kwh": 100,
        "vehicle.max_ac_power_kw": 110,
        "vehicle.phase_capability": 120,
        "charger.min_current_a": 100,
        "charger.max_current_a": 110,
        "charger.max_power_kw": 120,
        "charger.phase_capability": 130,
        "charger.nominal_voltage_v": 140,
        "charger.current_step_a": 150,
        "vehicle.selected_charger": 160,
        "vehicle.target_soc_pct": 170,
        "vehicle.ready_by": 180,
        "vehicle.mobility_charge_policy": 190,
        "vehicle.present": 200,
        "lifecycle_status": 210,
    }

    _target_guest: str | None = None
    _target_product_asset: str | None = None
    _target_profile: str | None = None
    _pending_guest: dict | None = None
    _pending_profile_type: str | None = None

    def _entry(self):
        return self.config_entry

    def _options(self) -> dict:
        return deepcopy(dict(getattr(self._entry(), "options", {}) or {}))

    def _domain_data(self) -> dict:
        hass = getattr(self, "hass", None)
        if hass is None:
            return {}
        return (getattr(hass, "data", {}).get(DOMAIN, {}) or {}).get(self._entry().entry_id) or {}

    def _runtime(self):
        return self._domain_data().get("runtime")

    def _registry(self):
        return self._domain_data().get("registry")

    def _domain_config(self):
        return self._domain_data().get("domain_config")

    def _guests(self) -> dict[str, dict]:
        rows = self._options().get(GUEST_VEHICLES_KEY, {})
        return deepcopy(rows) if isinstance(rows, dict) else {}

    def _authored_profiles(self) -> dict[str, dict]:
        rows = self._options().get(PROFILES_KEY, {})
        return deepcopy(rows) if isinstance(rows, dict) else {}

    def _disabled_profiles(self) -> set[str]:
        """Return persisted disabled profile ids, including packaged profiles."""
        rows = self._options().get(DISABLED_PROFILES_KEY, [])
        return {str(value) for value in rows or [] if str(value).strip()}

    def _manageable_profiles(self) -> dict[str, dict]:
        """Return every profile the options UI may edit/remove/restore.

        The effective registry deliberately hides disabled packaged profiles, but the
        management UI still needs them so they can be labelled and restored. Local
        authored/override rows win over packaged defaults with the same stable id.
        """
        rows: dict[str, dict] = {}
        registry = self._registry()
        if registry is not None:
            for row in getattr(registry, "profiles", ()) or ():
                if not isinstance(row, dict) or not row.get("profile_id"):
                    continue
                rows[str(row["profile_id"])] = dict(row)
        for profile_id, row in self._authored_profiles().items():
            if not isinstance(row, dict):
                continue
            value = dict(row)
            value.setdefault("profile_id", str(profile_id))
            rows[str(profile_id)] = value
        return rows

    @staticmethod
    def _profile_label(profile: dict, *, disabled: bool = False) -> str:
        brand = str(profile.get("brand") or profile.get("manufacturer") or profile.get("vendor") or "").strip()
        model = str(profile.get("model") or "").strip()
        variant = str(profile.get("variant") or "").strip()
        year = str(profile.get("model_year") or "").strip()
        rest = [part for part in (model, variant, year) if part]
        if brand and rest:
            label = f"{brand} — {' · '.join(rest)}"
        elif brand:
            label = brand
        else:
            label = " · ".join(rest) or str(profile.get("display_name") or profile.get("profile_id") or "Profile")
        return f"{label} · disabled" if disabled else label

    def _profile_selector(self, profiles: dict[str, dict] | None = None, *, include_disabled: bool = True):
        rows = profiles if profiles is not None else self._manageable_profiles()
        disabled = self._disabled_profiles()
        options = [
            SelectOptionDict(
                value=profile_id,
                label=self._profile_label(row, disabled=include_disabled and profile_id in disabled),
            )
            for profile_id, row in sorted(
                rows.items(),
                key=lambda item: self._profile_label(item[1]).casefold(),
            )
        ]
        return SelectSelector(
            SelectSelectorConfig(options=options, mode=SelectSelectorMode.DROPDOWN)
        )

    @staticmethod
    def _profile_action_selector(profile_type: str):
        noun = "vehicle" if profile_type == "vehicle" else "charger"
        return SelectSelector(
            SelectSelectorConfig(
                options=[
                    SelectOptionDict(value="edit", label=f"Edit an existing {noun} profile"),
                    SelectOptionDict(value="add", label=f"Add a custom {noun} profile"),
                    SelectOptionDict(value="remove", label=f"Remove or disable a {noun} profile"),
                    SelectOptionDict(value="restore", label=f"Restore a disabled packaged {noun} profile"),
                ],
                mode=SelectSelectorMode.DROPDOWN,
            )
        )

    @staticmethod
    def _guest_action_selector():
        return SelectSelector(
            SelectSelectorConfig(
                options=[
                    SelectOptionDict(value="edit", label="Edit an existing guest vehicle"),
                    SelectOptionDict(value="add", label="Add a guest vehicle"),
                    SelectOptionDict(value="remove", label="Remove a guest vehicle"),
                ],
                mode=SelectSelectorMode.DROPDOWN,
            )
        )

    def _charger_options(self) -> dict[str, str]:
        runtime = self._runtime()
        rows = {"": "No charger assigned"}
        for asset_id, asset in sorted(getattr(runtime, "assets", {}).items()):
            if getattr(asset, "concept_id", None) == "charger":
                rows[asset_id] = getattr(asset, "display_name", None) or asset_id
        return rows

    def _charger_selector(self):
        return SelectSelector(
            SelectSelectorConfig(
                options=[
                    SelectOptionDict(value=value, label=label)
                    for value, label in self._charger_options().items()
                ],
                mode=SelectSelectorMode.DROPDOWN,
            )
        )

    def _profile_options_for_type(self, profile_type: str, *, include_empty: bool = False) -> dict[str, str]:
        rows = {"": "Not configured"} if include_empty else {}
        registry = self._registry()
        if registry is None:
            return rows
        for profile in registry.profiles_for_type(profile_type):
            if not isinstance(profile, dict) or not profile.get("profile_id"):
                continue
            profile_id = str(profile["profile_id"])
            rows[profile_id] = str(profile.get("display_name") or profile_id)
        return rows

    def _guest_profiles(self) -> dict[str, str]:
        return self._profile_options_for_type("vehicle")

    def _vehicle_schema(self, current: dict | None = None):
        row = current or {}
        profiles = {"": "Custom / free format", **self._guest_profiles()}
        default_profile = str(row.get("profile_id") or "")
        if default_profile not in profiles:
            default_profile = ""
        return vol.Schema({
            vol.Required("name", default=row.get("name", "Guest vehicle")): str,
            vol.Optional("profile_id", default=default_profile): vol.In(profiles),
            vol.Optional("brand", default=row.get("brand", "")): str,
            vol.Optional("model", default=row.get("model", "")): str,
            vol.Optional("variant", default=row.get("variant", "")): str,
            vol.Optional("model_year", default=row.get("model_year")): vol.Any(None, "", vol.All(vol.Coerce(int), vol.Range(min=1900, max=2200))),
            vol.Optional("color", default=row.get("color", "")): str,
            vol.Required("present", default=row.get("present", True)): bool,
            vol.Optional("selected_charger", default=row.get("selected_charger") or ""): vol.In(self._charger_options()),
            vol.Required("lifecycle_status", default=row.get("lifecycle_status", "active")): vol.In({"active": "Active", "disabled": "Disabled"}),
        })

    def _validated_vehicle(self, user_input: dict) -> dict:
        values = dict(user_input)
        values["selected_charger"] = values.get("selected_charger") or None
        # Preserve existing manual runtime values on edit, but never ask for them in setup.
        return MobilityDomainConfiguration._validate_guest_vehicle(values, set(self._guest_profiles()))

    def _result(self, guests: dict[str, dict]):
        options = self._options()
        options[GUEST_VEHICLES_KEY] = guests
        options[REVISION_KEY] = int(options.get(REVISION_KEY, 0) or 0) + 1
        return self.async_create_entry(title="", data=options)

    def _vehicle_form(self, step_id: str, current: dict | None = None, *, error: str | None = None):
        return self.async_show_form(
            step_id=step_id,
            data_schema=self._vehicle_schema(current),
            errors={"base": error} if error else {},
        )

    def _product_assets(self) -> dict[str, object]:
        runtime = self._runtime()
        guests = set(self._guests())
        return {
            asset_id: asset
            for asset_id, asset in sorted(getattr(runtime, "assets", {}).items())
            if getattr(asset, "concept_id", None) in {"vehicle", "charger"} and asset_id not in guests
        }

    def _product_assets_for_type(self, asset_type: str) -> dict[str, object]:
        return {
            asset_id: asset
            for asset_id, asset in self._product_assets().items()
            if str(getattr(asset, "concept_id", "")) == asset_type
        }

    def _product_asset_options_for_type(self, asset_type: str) -> dict[str, str]:
        rows: dict[str, str] = {}
        for asset_id, asset in self._product_assets_for_type(asset_type).items():
            display = str(getattr(asset, "display_name", None) or asset_id)
            integration = str(getattr(asset, "source_integration_domain", None) or "local")
            rows[asset_id] = f"{display} · {integration}"
        return rows

    def _profiles_for_type(self, profile_type: str) -> dict[str, dict]:
        return {
            profile_id: row
            for profile_id, row in self._manageable_profiles().items()
            if str(row.get("profile_type") or "") == profile_type
        }

    def _product_asset_options(self) -> dict[str, str]:
        rows: dict[str, str] = {}
        for asset_id, asset in self._product_assets().items():
            concept = str(getattr(asset, "concept_id", "asset")).title()
            display = str(getattr(asset, "display_name", None) or asset_id)
            integration = str(getattr(asset, "source_integration_domain", None) or "local")
            rows[asset_id] = f"{concept} · {display} · {integration}"
        return rows

    def _product_editables(self, asset_id: str) -> list[tuple[str, dict]]:
        assets = self._product_assets()
        asset = assets.get(asset_id)
        registry = self._registry()
        if asset is None or registry is None:
            return []
        properties = dict((getattr(registry, "semantic_catalog", {}) or {}).get("properties") or {})
        rows: list[tuple[str, dict]] = []
        asset_type = str(getattr(asset, "concept_id", ""))
        for property_key, definition in properties.items():
            if not isinstance(definition, dict):
                continue
            if property_key in {"vehicle.image_key", "charger.image_key"}:
                continue
            editable = definition.get("editable")
            if not isinstance(editable, dict):
                continue
            if editable.get("write_kind") not in self._PRODUCT_WRITE_KINDS:
                continue
            if asset_type not in set(editable.get("asset_types") or []):
                continue
            if editable.get("requires_binding_role") == "manual_profile":
                continue
            if editable.get("platform") not in {"text", "number", "select", "switch"}:
                continue
            rows.append((str(property_key), dict(editable)))
        return sorted(
            rows,
            key=lambda row: (self._PRODUCT_FIELD_ORDER.get(row[0], 999), row[0]),
        )

    def _profile_options(self, asset_id: str) -> dict[str, str]:
        asset = self._product_assets().get(asset_id)
        if asset is None:
            return {"": "Not configured"}
        return self._profile_options_for_type(str(getattr(asset, "concept_id", "")), include_empty=True)

    def _resolved_product_value(self, asset_id: str, property_key: str):
        runtime = self._runtime()
        if runtime is None:
            return None
        configured = runtime.configuration_value(asset_id, property_key, None)
        if configured is not None:
            return configured
        if property_key == "asset.profile_id":
            getter = getattr(runtime, "effective_profile_id", None)
            return getter(asset_id) if callable(getter) else None
        snapshot = getattr(runtime, "snapshots", {}).get(asset_id)
        return None if snapshot is None else snapshot.values.get(property_key)

    def _product_schema(self, asset_id: str):
        runtime = self._runtime()
        fields: dict = {}
        if runtime is None:
            return vol.Schema(fields)
        for property_key, editable in self._product_editables(asset_id):
            current = self._resolved_product_value(asset_id, property_key)
            platform = editable.get("platform")
            write_kind = editable.get("write_kind")
            if platform == "text":
                fields[vol.Optional(property_key, default="" if current is None else str(current))] = str
            elif platform == "number":
                marker = (
                    vol.Optional(property_key)
                    if current is None
                    else vol.Optional(property_key, default=float(current))
                )
                fields[marker] = NumberSelector(
                    NumberSelectorConfig(
                        min=float(editable.get("min", 0)),
                        max=float(editable.get("max", 1000000)),
                        step=float(editable.get("step", 1)),
                    )
                )
            elif platform == "select":
                if write_kind == "profile":
                    asset = self._product_assets().get(asset_id)
                    profile_type = str(getattr(asset, "concept_id", "")) if asset is not None else ""
                    profiles = {
                        profile_id: row
                        for profile_id, row in self._manageable_profiles().items()
                        if str(row.get("profile_type") or "") == profile_type
                        and profile_id not in self._disabled_profiles()
                    }
                    selector = SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value="", label="Automatic / not explicitly selected"),
                                *[
                                    SelectOptionDict(
                                        value=profile_id,
                                        label=self._profile_label(row),
                                    )
                                    for profile_id, row in sorted(
                                        profiles.items(),
                                        key=lambda item: self._profile_label(item[1]).casefold(),
                                    )
                                ],
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    )
                elif write_kind == "selected_charger":
                    selector = SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value=value, label=label)
                                for value, label in self._charger_options().items()
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    )
                else:
                    selector = SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value=str(value), label=str(value))
                                for value in editable.get("options") or []
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    )
                fields[vol.Optional(property_key, default="" if current is None else str(current))] = selector
            elif platform == "switch":
                fields[vol.Optional(property_key, default=bool(current) if current is not None else False)] = bool
        return vol.Schema(fields)

    def _product_form(self, asset_id: str, *, user_input: dict | None = None, error: str | None = None):
        asset = self._product_assets().get(asset_id)
        display = asset_id if asset is None else str(getattr(asset, "display_name", None) or asset_id)
        return self.async_show_form(
            step_id="edit_product_asset",
            data_schema=self._product_schema(asset_id),
            errors={"base": error} if error else {},
            description_placeholders={"asset": display},
        )

    @staticmethod
    def _normalized_product_value(editable: dict, value):
        platform = editable.get("platform")
        if value in (None, "") and platform in {"text", "number", "select"}:
            return None
        return value

    def _profile_schema(self, profile_type: str, current: dict | None = None):
        """User-facing profile form using native HA selectors.

        Required product identity and technical facts are explicit. Optional values use
        suggested values instead of None defaults so the frontend can always serialize
        and render the form.
        """
        row = current or {}
        fields: dict = {
            vol.Required("display_name", default=str(row.get("display_name") or "")): str,
            vol.Required("short_name", default=str(row.get("short_name") or row.get("display_name") or "")): str,
            vol.Required("brand", default=str(row.get("brand") or row.get("manufacturer") or row.get("vendor") or "")): str,
            vol.Required("model", default=str(row.get("model") or "")): str,
            vol.Required("variant", default=str(row.get("variant") or "")): str,
        }
        if profile_type == "vehicle":
            fields[vol.Required("model_year", default=int(row.get("model_year") or 2026))] = NumberSelector(
                NumberSelectorConfig(min=1900, max=2200, step=1)
            )
            fields[vol.Required("vehicle_kind", default=str(row.get("vehicle_kind") or "ev"))] = SelectSelector(
                SelectSelectorConfig(
                    options=[
                        SelectOptionDict(value="ev", label="Battery electric (EV)"),
                        SelectOptionDict(value="phev", label="Plug-in hybrid (PHEV)"),
                    ],
                    mode=SelectSelectorMode.DROPDOWN,
                )
            )
            fields[vol.Required("battery_capacity_kwh", default=float(row.get("battery_capacity_kwh") or 1.0))] = NumberSelector(
                NumberSelectorConfig(min=0.1, max=500, step=0.1, unit_of_measurement="kWh")
            )
            fields[vol.Required("max_ac_power_kw", default=float(row.get("max_ac_power_kw") or 1.0))] = NumberSelector(
                NumberSelectorConfig(min=0.1, max=100, step=0.1, unit_of_measurement="kW")
            )
            fields[vol.Required("phase_capability", default=str(row.get("phase_capability") or 1))] = SelectSelector(
                SelectSelectorConfig(
                    options=[
                        SelectOptionDict(value="1", label="1 phase"),
                        SelectOptionDict(value="2", label="2 phase"),
                        SelectOptionDict(value="3", label="3 phase"),
                    ],
                    mode=SelectSelectorMode.DROPDOWN,
                )
            )
        else:
            if row.get("model_year") not in (None, ""):
                fields[vol.Optional("model_year", description={"suggested_value": int(row["model_year"])})] = NumberSelector(
                    NumberSelectorConfig(min=1900, max=2200, step=1)
                )
            else:
                fields[vol.Optional("model_year")] = NumberSelector(NumberSelectorConfig(min=1900, max=2200, step=1))
            fields[vol.Required("max_current_a", default=float(row.get("max_current_a") or 16.0))] = NumberSelector(
                NumberSelectorConfig(min=0.1, max=200, step=0.1, unit_of_measurement="A")
            )
            min_current = row.get("min_current_a")
            min_marker = (
                vol.Optional("min_current_a", description={"suggested_value": float(min_current)})
                if min_current not in (None, "")
                else vol.Optional("min_current_a")
            )
            fields[min_marker] = NumberSelector(
                NumberSelectorConfig(min=0, max=200, step=0.1, unit_of_measurement="A")
            )
            fields[vol.Required("max_power_kw", default=float(row.get("max_power_kw") or 3.7))] = NumberSelector(
                NumberSelectorConfig(min=0.1, max=1000, step=0.1, unit_of_measurement="kW")
            )
            fields[vol.Required("phase_capability", default=str(row.get("phase_capability") or 1))] = SelectSelector(
                SelectSelectorConfig(
                    options=[
                        SelectOptionDict(value="1", label="1 phase"),
                        SelectOptionDict(value="2", label="2 phase"),
                        SelectOptionDict(value="3", label="3 phase"),
                    ],
                    mode=SelectSelectorMode.DROPDOWN,
                )
            )
            fields[vol.Required("nominal_voltage_v", default=float(row.get("nominal_voltage_v") or 230))] = NumberSelector(
                NumberSelectorConfig(min=1, max=1000, step=1, unit_of_measurement="V")
            )
            sku = str(row.get("sku") or "").strip()
            mpn = str(row.get("manufacturer_part_number") or "").strip()
            fields[
                vol.Optional("sku", description={"suggested_value": sku}) if sku else vol.Optional("sku")
            ] = str
            fields[
                vol.Optional(
                    "manufacturer_part_number",
                    description={"suggested_value": mpn},
                ) if mpn else vol.Optional("manufacturer_part_number")
            ] = str
            fields[vol.Optional("current_step_a", description={"suggested_value": row.get("current_step_a") or 1})] = NumberSelector(
                NumberSelectorConfig(min=0.1, max=100, step=0.1, unit_of_measurement="A")
            )
        return vol.Schema(fields)

    @staticmethod
    def _normalized_profile_input(profile_type: str, values: dict) -> dict:
        normalized = dict(values)
        normalized["profile_type"] = profile_type
        if normalized.get("phase_capability") not in (None, ""):
            normalized["phase_capability"] = int(normalized["phase_capability"])
        if profile_type == "charger":
            for key in ("sku", "manufacturer_part_number"):
                value = str(normalized.get(key) or "").strip()
                if value:
                    normalized[key] = value
                else:
                    normalized.pop(key, None)
        else:
            normalized.pop("sku", None)
            normalized.pop("manufacturer_part_number", None)
        return normalized

    def _assert_unique_profile_identity(self, values: dict, *, profile_id: str | None = None) -> None:
        identity = tuple(str(values.get(key) or "").strip().casefold() for key in ("brand", "model", "variant", "model_year"))
        if not all(identity):
            return
        profile_type = str(values.get("profile_type") or "")
        for existing_id, row in self._manageable_profiles().items():
            if existing_id == profile_id or str(row.get("profile_type") or "") != profile_type:
                continue
            other = tuple(str(row.get(key) or "").strip().casefold() for key in ("brand", "model", "variant", "model_year"))
            if other == identity:
                raise ValueError(f"duplicate auto-resolve identity: {existing_id}")

    async def _store_profile(self, values: dict, *, profile_id: str | None = None):
        domain_config = self._domain_config()
        if domain_config is None:
            raise ValueError("Mobility semantic configuration store unavailable")
        self._assert_unique_profile_identity(values, profile_id=profile_id)
        if profile_id is None:
            profile_id = await domain_config.async_add_profile(values)
        else:
            await domain_config.async_update_profile(profile_id, values)
        runtime = self._runtime()
        if runtime is not None:
            for asset_id in sorted(getattr(runtime, "assets", {})):
                if runtime.effective_profile_id(asset_id) == profile_id:
                    runtime._refresh(asset_id)
            notify = getattr(runtime, "_notify_topology", None)
            if callable(notify):
                notify()
        return self.async_create_entry(title="", data=self._options())

    async def async_step_init(self, user_input=None):
        choices = ["vehicle_profile_config"]
        if self._product_assets_for_type("vehicle"):
            choices.append("vehicle_config")
        choices.append("guest_vehicle_config")
        choices.append("charger_profile_config")
        if self._product_assets_for_type("charger"):
            choices.append("charger_config")
        return self.async_show_menu(step_id="init", menu_options=choices)

    async def _configure_asset_type(self, asset_type: str, step_id: str, user_input=None):
        choices = self._product_asset_options_for_type(asset_type)
        if not choices:
            return await self.async_step_init()
        selector = SelectSelector(
            SelectSelectorConfig(
                options=[SelectOptionDict(value=value, label=label) for value, label in choices.items()],
                mode=SelectSelectorMode.DROPDOWN,
            )
        )
        if user_input is not None:
            asset_id = str(user_input.get("product_asset") or "")
            if asset_id not in choices:
                return self.async_show_form(
                    step_id=step_id,
                    data_schema=vol.Schema({vol.Required("product_asset"): selector}),
                    errors={"base": "unknown_product_asset"},
                )
            self._target_product_asset = asset_id
            return await self.async_step_edit_product_asset()
        return self.async_show_form(
            step_id=step_id,
            data_schema=vol.Schema({vol.Required("product_asset"): selector}),
        )

    async def async_step_vehicle_config(self, user_input=None):
        return await self._configure_asset_type("vehicle", "vehicle_config", user_input)

    async def async_step_charger_config(self, user_input=None):
        return await self._configure_asset_type("charger", "charger_config", user_input)

    # Backward-compatible hidden step for an already-open 0.9.35 options flow.
    async def async_step_configure_product_asset(self, user_input=None):
        return await self.async_step_vehicle_config(user_input)

    async def async_step_edit_product_asset(self, user_input=None):
        asset_id = str(self._target_product_asset or "")
        runtime = self._runtime()
        if runtime is None or asset_id not in self._product_assets():
            return await self.async_step_init()
        editables = dict(self._product_editables(asset_id))
        if user_input is None:
            return self._product_form(asset_id)
        try:
            for property_key, editable in editables.items():
                value = self._normalized_product_value(editable, user_input.get(property_key))
                configured = runtime.configuration_value(asset_id, property_key, None)
                resolved = self._resolved_product_value(asset_id, property_key)
                if value == configured or (configured is None and value == resolved):
                    continue
                canonical_key = "asset.lifecycle_status" if property_key == "lifecycle_status" else property_key
                await runtime.async_set_configuration_property(asset_id, canonical_key, value)
        except (TypeError, ValueError):
            return self._product_form(asset_id, user_input=user_input, error="invalid_product_configuration")
        asset = self._product_assets().get(asset_id)
        if str(getattr(asset, "concept_id", "")) == "charger":
            return await self.async_step_charger_config()
        return await self.async_step_vehicle_config()

    async def _profile_config(self, profile_type: str, step_id: str, user_input=None):
        profiles = self._profiles_for_type(profile_type)
        schema = {
            vol.Required("action", default="edit"): self._profile_action_selector(profile_type),
        }
        if profiles:
            schema[vol.Optional("profile")] = self._profile_selector(profiles)
        if user_input is None:
            return self.async_show_form(step_id=step_id, data_schema=vol.Schema(schema))

        action = str(user_input.get("action") or "edit")
        target = str(user_input.get("profile") or "")
        if action == "add":
            self._pending_profile_type = profile_type
            return await (
                self.async_step_add_vehicle_profile()
                if profile_type == "vehicle"
                else self.async_step_add_charger_profile()
            )
        if not target or target not in profiles:
            return self.async_show_form(
                step_id=step_id,
                data_schema=vol.Schema(schema),
                errors={"profile": "profile_required"},
            )
        self._target_profile = target
        if action == "edit":
            return await self.async_step_edit_selected_profile()
        if action == "remove":
            return await self.async_step_remove_selected_profile()
        if action == "restore":
            if target not in self._disabled_profiles():
                return self.async_show_form(
                    step_id=step_id,
                    data_schema=vol.Schema(schema),
                    errors={"profile": "profile_not_disabled"},
                )
            await self._domain_config().async_restore_profile(target)
            return await self._profile_config(profile_type, step_id)
        return await self._profile_config(profile_type, step_id)

    async def async_step_vehicle_profile_config(self, user_input=None):
        return await self._profile_config("vehicle", "vehicle_profile_config", user_input)

    async def async_step_charger_profile_config(self, user_input=None):
        return await self._profile_config("charger", "charger_profile_config", user_input)

    async def async_step_manage_profiles(self, user_input=None):
        return await self.async_step_vehicle_profile_config(user_input)

    async def async_step_add_vehicle_profile(self, user_input=None):
        if user_input is None:
            return self.async_show_form(step_id="add_vehicle_profile", data_schema=self._profile_schema("vehicle"))
        try:
            values = self._normalized_profile_input("vehicle", user_input)
            await self._store_profile(values)
            return await self.async_step_vehicle_profile_config()
        except (TypeError, ValueError):
            return self.async_show_form(
                step_id="add_vehicle_profile",
                data_schema=self._profile_schema("vehicle", user_input),
                errors={"base": "invalid_profile"},
            )

    async def async_step_add_charger_profile(self, user_input=None):
        if user_input is None:
            return self.async_show_form(step_id="add_charger_profile", data_schema=self._profile_schema("charger"))
        try:
            values = self._normalized_profile_input("charger", user_input)
            await self._store_profile(values)
            return await self.async_step_charger_profile_config()
        except (TypeError, ValueError):
            return self.async_show_form(
                step_id="add_charger_profile",
                data_schema=self._profile_schema("charger", user_input),
                errors={"base": "invalid_profile"},
            )

    async def _select_profile(self, step_id: str, next_step: str, user_input=None):
        profiles = self._manageable_profiles()
        disabled = self._disabled_profiles()
        labels = {
            profile_id: f"{row.get('display_name') or profile_id}{' · disabled' if profile_id in disabled else ''}"
            for profile_id, row in profiles.items()
        }
        if not labels:
            return await self.async_step_init()
        if user_input is not None:
            target = str(user_input.get("profile") or "")
            if target not in profiles:
                return self.async_show_form(step_id=step_id, data_schema=vol.Schema({vol.Required("profile"): vol.In(labels)}), errors={"base": "unknown_profile"})
            self._target_profile = target
            return await getattr(self, f"async_step_{next_step}")()
        return self.async_show_form(step_id=step_id, data_schema=vol.Schema({vol.Required("profile"): vol.In(labels)}))

    async def async_step_edit_profile(self, user_input=None):
        return await self._select_profile("edit_profile", "edit_selected_profile", user_input)

    async def async_step_edit_selected_profile(self, user_input=None):
        target = str(self._target_profile or "")
        current = self._manageable_profiles().get(target)
        if not isinstance(current, dict):
            return await self.async_step_init()
        profile_type = str(current.get("profile_type") or "")
        if user_input is None:
            return self.async_show_form(step_id="edit_selected_profile", data_schema=self._profile_schema(profile_type, current), description_placeholders={"name": str(current.get("display_name") or target)})
        try:
            domain_config = self._domain_config()
            if domain_config is None:
                raise ValueError("Mobility semantic configuration store unavailable")
            values = self._normalized_profile_input(profile_type, user_input)
            self._assert_unique_profile_identity(values, profile_id=target)
            await domain_config.async_update_profile(target, values, expected_type=profile_type)
            return await (
                self.async_step_vehicle_profile_config()
                if profile_type == "vehicle"
                else self.async_step_charger_profile_config()
            )
        except (TypeError, ValueError):
            return self.async_show_form(step_id="edit_selected_profile", data_schema=self._profile_schema(profile_type, user_input), errors={"base": "invalid_profile"}, description_placeholders={"name": str(current.get("display_name") or target)})

    async def async_step_remove_profile(self, user_input=None):
        return await self._select_profile("remove_profile", "remove_selected_profile", user_input)

    async def async_step_remove_selected_profile(self, user_input=None):
        target = str(self._target_profile or "")
        current = self._manageable_profiles().get(target)
        if not isinstance(current, dict):
            return await self.async_step_init()
        if user_input is None:
            return self.async_show_form(step_id="remove_selected_profile", data_schema=vol.Schema({vol.Required("confirm", default=False): bool}), description_placeholders={"name": str(current.get("display_name") or target)})
        if not user_input.get("confirm"):
            return await self.async_step_init()
        try:
            domain_config = self._domain_config()
            packaged_ids = {
                str(row.get("profile_id"))
                for row in getattr(self._registry(), "profiles", ())
                if isinstance(row, dict) and row.get("profile_id")
            }
            if target in self._authored_profiles() and target not in packaged_ids:
                await domain_config.async_remove_profile(target)
            else:
                await domain_config.async_disable_profile(target)
        except (TypeError, ValueError):
            return self.async_show_form(step_id="remove_selected_profile", data_schema=vol.Schema({vol.Required("confirm", default=False): bool}), errors={"base": "profile_in_use"}, description_placeholders={"name": str(current.get("display_name") or target)})
        profile_type = str(current.get("profile_type") or "")
        return await (
            self.async_step_vehicle_profile_config()
            if profile_type == "vehicle"
            else self.async_step_charger_profile_config()
        )

    async def async_step_guest_vehicle_config(self, user_input=None):
        guests = self._guests()
        schema = {vol.Required("action", default="edit"): self._guest_action_selector()}
        if guests:
            schema[vol.Optional("guest_vehicle")] = SelectSelector(
                SelectSelectorConfig(
                    options=[
                        SelectOptionDict(value=asset_id, label=str(row.get("name") or asset_id))
                        for asset_id, row in sorted(
                            guests.items(),
                            key=lambda item: str(item[1].get("name") or item[0]).casefold(),
                        )
                    ],
                    mode=SelectSelectorMode.DROPDOWN,
                )
            )
        if user_input is None:
            return self.async_show_form(step_id="guest_vehicle_config", data_schema=vol.Schema(schema))
        action = str(user_input.get("action") or "edit")
        if action == "add":
            return await self.async_step_add_guest_vehicle()
        target = str(user_input.get("guest_vehicle") or "")
        if not target or target not in guests:
            return self.async_show_form(
                step_id="guest_vehicle_config",
                data_schema=vol.Schema(schema),
                errors={"guest_vehicle": "guest_vehicle_required"},
            )
        self._target_guest = target
        if action == "remove":
            return await self.async_step_remove_guest()
        return await self.async_step_edit_guest()

    async def async_step_add_guest_vehicle(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="add_guest_vehicle",
                data_schema=vol.Schema({
                    vol.Required("name", default="Guest vehicle"): str,
                    vol.Required("product_source", default="profile"): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value="profile", label="Known product profile"),
                                SelectOptionDict(value="custom", label="Custom / free format"),
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    ),
                }),
            )
        self._pending_guest = {"name": str(user_input.get("name") or "Guest vehicle").strip()}
        if user_input.get("product_source") == "custom":
            return await self.async_step_add_guest_custom()
        return await self.async_step_add_guest_product()

    async def async_step_add_guest_product(self, user_input=None):
        profiles = self._guest_profiles()
        if user_input is None:
            return self.async_show_form(
                step_id="add_guest_product",
                data_schema=vol.Schema({
                    vol.Required("profile_id"): self._profile_selector({
                        profile_id: row
                        for profile_id, row in self._manageable_profiles().items()
                        if profile_id in profiles
                    }, include_disabled=False),
                    vol.Optional("color", default=""): str,                    vol.Required("present", default=True): bool,
                    vol.Optional("selected_charger", default=""): self._charger_selector(),
                    vol.Required("lifecycle_status", default="active"): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value="active", label="Active"),
                                SelectOptionDict(value="disabled", label="Disabled"),
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    ),
                }),
            )
        values = {**(self._pending_guest or {}), **dict(user_input)}
        values["selected_charger"] = values.get("selected_charger") or None
        domain_config = self._domain_config()
        if domain_config is None:
            return await self.async_step_init()
        await domain_config.async_add_guest_vehicle(
            MobilityDomainConfiguration._validate_guest_vehicle(values, set(profiles))
        )
        return await self.async_step_guest_vehicle_config()

    async def async_step_add_guest_custom(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="add_guest_custom",
                data_schema=vol.Schema({
                    vol.Required("brand"): str,
                    vol.Required("model"): str,
                    vol.Optional("variant", default=""): str,
                    vol.Optional("model_year"): vol.Any(None, "", vol.All(vol.Coerce(int), vol.Range(min=1900, max=2200))),
                    vol.Optional("color", default=""): str,                    vol.Required("present", default=True): bool,
                    vol.Optional("selected_charger", default=""): self._charger_selector(),
                    vol.Required("lifecycle_status", default="active"): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value="active", label="Active"),
                                SelectOptionDict(value="disabled", label="Disabled"),
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    ),
                }),
            )
        values = {**(self._pending_guest or {}), **dict(user_input), "profile_id": None}
        values["selected_charger"] = values.get("selected_charger") or None
        domain_config = self._domain_config()
        if domain_config is None:
            return await self.async_step_init()
        await domain_config.async_add_guest_vehicle(
            MobilityDomainConfiguration._validate_guest_vehicle(values, set(self._guest_profiles()))
        )
        return await self.async_step_guest_vehicle_config()

    async def _select_guest(self, step_id: str, next_step: str, user_input=None):
        guests = self._guests()
        if user_input is not None:
            target = str(user_input.get("guest_vehicle") or "")
            if target not in guests:
                labels = {asset_id: str(row.get("name") or asset_id) for asset_id, row in guests.items()}
                return self.async_show_form(step_id=step_id, data_schema=vol.Schema({vol.Required("guest_vehicle"): vol.In(labels)}), errors={"base": "unknown_guest_vehicle"})
            self._target_guest = target
            return await getattr(self, f"async_step_{next_step}")()
        labels = {asset_id: str(row.get("name") or asset_id) for asset_id, row in guests.items()}
        return self.async_show_form(step_id=step_id, data_schema=vol.Schema({vol.Required("guest_vehicle"): vol.In(labels)}))

    async def async_step_edit_guest_vehicle(self, user_input=None):
        return await self._select_guest("edit_guest_vehicle", "edit_guest", user_input)

    async def async_step_edit_guest(self, user_input=None):
        guests = self._guests()
        target = str(self._target_guest or "")
        current = guests.get(target)
        if not isinstance(current, dict):
            return await self.async_step_init()
        if user_input is None:
            return self.async_show_form(
                step_id="edit_guest",
                data_schema=vol.Schema({
                    vol.Required("name", default=current.get("name", "Guest vehicle")): str,
                    vol.Required(
                        "product_source",
                        default="profile" if current.get("profile_id") else "custom",
                    ): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value="profile", label="Known product profile"),
                                SelectOptionDict(value="custom", label="Custom / free format"),
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    ),
                }),
            )
        self._pending_guest = {
            "name": str(user_input.get("name") or current.get("name") or "Guest vehicle").strip(),
            "_current": dict(current),
        }
        if user_input.get("product_source") == "custom":
            return await self.async_step_edit_guest_custom()
        return await self.async_step_edit_guest_product()

    async def async_step_edit_guest_product(self, user_input=None):
        guests = self._guests()
        target = str(self._target_guest or "")
        current = dict((self._pending_guest or {}).get("_current") or guests.get(target) or {})
        profiles = self._guest_profiles()
        current_profile = str(current.get("profile_id") or "")
        if current_profile not in profiles:
            current_profile = next(iter(profiles), "")
        if user_input is None:
            return self.async_show_form(
                step_id="edit_guest_product",
                data_schema=vol.Schema({
                    vol.Required("profile_id", default=current_profile): self._profile_selector({
                        profile_id: row
                        for profile_id, row in self._manageable_profiles().items()
                        if profile_id in profiles
                    }, include_disabled=False),
                    vol.Optional("color", default=current.get("color", "")): str,
                    vol.Optional("battery_capacity_kwh", description={"suggested_value": current.get("battery_capacity_kwh")}): NumberSelector(NumberSelectorConfig(min=0.1, max=500, step=0.1)),
                    vol.Optional("soc_pct", description={"suggested_value": current.get("soc_pct")}): NumberSelector(NumberSelectorConfig(min=0, max=100, step=0.1)),
                    vol.Optional("battery_energy_kwh", description={"suggested_value": current.get("battery_energy_kwh")}): NumberSelector(NumberSelectorConfig(min=0, max=500, step=0.1)),
                    vol.Required("present", default=current.get("present", True)): bool,
                    vol.Optional("selected_charger", default=current.get("selected_charger") or ""): self._charger_selector(),
                    vol.Required("lifecycle_status", default=current.get("lifecycle_status", "active")): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value="active", label="Active"),
                                SelectOptionDict(value="disabled", label="Disabled"),
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    ),
                }),
            )
        values = {
            **current,
            **dict(user_input),
            "name": (self._pending_guest or {}).get("name") or current.get("name"),
            "brand": None,
            "model": None,
            "variant": None,
            "model_year": None,
        }
        values["selected_charger"] = values.get("selected_charger") or None
        # Switching to a known product removes stale free-format identity.
        values = {k: v for k, v in values.items() if v is not None}
        domain_config = self._domain_config()
        if domain_config is None:
            return await self.async_step_init()
        await domain_config.async_update_guest_vehicle(
            target,
            MobilityDomainConfiguration._validate_guest_vehicle(values, set(profiles)),
        )
        return await self.async_step_guest_vehicle_config()

    async def async_step_edit_guest_custom(self, user_input=None):
        guests = self._guests()
        target = str(self._target_guest or "")
        current = dict((self._pending_guest or {}).get("_current") or guests.get(target) or {})
        if user_input is None:
            return self.async_show_form(
                step_id="edit_guest_custom",
                data_schema=vol.Schema({
                    vol.Required("brand", default=current.get("brand", "")): str,
                    vol.Required("model", default=current.get("model", "")): str,
                    vol.Optional("variant", default=current.get("variant", "")): str,
                    vol.Optional("model_year", default=current.get("model_year")): vol.Any(None, "", vol.All(vol.Coerce(int), vol.Range(min=1900, max=2200))),
                    vol.Optional("color", default=current.get("color", "")): str,
                    vol.Optional("battery_capacity_kwh", description={"suggested_value": current.get("battery_capacity_kwh")}): NumberSelector(NumberSelectorConfig(min=0.1, max=500, step=0.1)),
                    vol.Optional("soc_pct", description={"suggested_value": current.get("soc_pct")}): NumberSelector(NumberSelectorConfig(min=0, max=100, step=0.1)),
                    vol.Optional("battery_energy_kwh", description={"suggested_value": current.get("battery_energy_kwh")}): NumberSelector(NumberSelectorConfig(min=0, max=500, step=0.1)),
                    vol.Required("present", default=current.get("present", True)): bool,
                    vol.Optional("selected_charger", default=current.get("selected_charger") or ""): self._charger_selector(),
                    vol.Required("lifecycle_status", default=current.get("lifecycle_status", "active")): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value="active", label="Active"),
                                SelectOptionDict(value="disabled", label="Disabled"),
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    ),
                }),
            )
        values = {
            **current,
            **dict(user_input),
            "name": (self._pending_guest or {}).get("name") or current.get("name"),
            "profile_id": None,
        }
        values["selected_charger"] = values.get("selected_charger") or None
        values.pop("profile_id", None)
        domain_config = self._domain_config()
        if domain_config is None:
            return await self.async_step_init()
        await domain_config.async_update_guest_vehicle(
            target,
            MobilityDomainConfiguration._validate_guest_vehicle(values, set(self._guest_profiles())),
        )
        return await self.async_step_guest_vehicle_config()

    async def async_step_remove_guest_vehicle(self, user_input=None):
        return await self._select_guest("remove_guest_vehicle", "remove_guest", user_input)

    async def async_step_remove_guest(self, user_input=None):
        guests = self._guests()
        target = str(self._target_guest or "")
        if target not in guests:
            return await self.async_step_init()
        if user_input is None:
            return self.async_show_form(step_id="remove_guest", data_schema=vol.Schema({vol.Required("confirm", default=False): bool}), description_placeholders={"name": str(guests.get(target, {}).get("name") or target)})
        if not user_input.get("confirm"):
            return await self.async_step_init()
        domain_config = self._domain_config()
        if domain_config is None:
            return await self.async_step_init()
        await domain_config.async_remove_guest_vehicle(target)
        return await self.async_step_guest_vehicle_config()

    async def async_step_restore_profile(self, user_input=None):
        disabled = self._disabled_profiles()
        registry = self._registry()
        packaged = {
            str(row.get("profile_id")): dict(row)
            for row in getattr(registry, "profiles", ())
            if isinstance(row, dict) and str(row.get("profile_id")) in disabled
        } if registry is not None else {}
        labels = {pid: str(row.get("display_name") or pid) for pid, row in packaged.items()}
        if not labels:
            return await self.async_step_init()
        if user_input is None:
            return self.async_show_form(
                step_id="restore_profile",
                data_schema=vol.Schema({vol.Required("profile"): vol.In(labels)}),
            )
        target = str(user_input.get("profile") or "")
        if target not in labels:
            return self.async_show_form(
                step_id="restore_profile",
                data_schema=vol.Schema({vol.Required("profile"): vol.In(labels)}),
                errors={"base": "unknown_profile"},
            )
        await self._domain_config().async_restore_profile(target)
        return self.async_create_entry(title="", data=self._options())
