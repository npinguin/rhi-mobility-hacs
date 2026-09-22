from __future__ import annotations
from copy import deepcopy
import voluptuous as vol
from homeassistant import config_entries
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

    _PRODUCT_WRITE_KINDS = {"configuration", "profile", "selected_charger"}

    def __init__(self, config_entry=None) -> None:
        self._provided_config_entry = config_entry
        self._target_guest: str | None = None
        self._target_product_asset: str | None = None
        self._target_profile: str | None = None

    def _entry(self):
        try:
            entry = self.config_entry
        except (AttributeError, ValueError):
            entry = None
        if entry is not None:
            return entry
        if self._provided_config_entry is not None:
            return self._provided_config_entry
        raise RuntimeError("Mobility options flow has no config entry")

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

    def _charger_options(self) -> dict[str, str]:
        runtime = self._runtime()
        rows = {"": "No charger assigned"}
        for asset_id, asset in sorted(getattr(runtime, "assets", {}).items()):
            if getattr(asset, "concept_id", None) == "charger":
                rows[asset_id] = getattr(asset, "display_name", None) or asset_id
        return rows

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

    def _profile_image_options(self, profile_type: str) -> dict[str, str]:
        fallback = "generic_vehicle" if profile_type == "vehicle" else "generic_charger"
        rows = {fallback: "Generic"}
        registry = self._registry()
        if registry is not None:
            for profile in registry.profiles_for_type(profile_type):
                key = str(profile.get("image_key") or "").strip()
                if key:
                    rows[key] = str(profile.get("display_name") or key)
        return rows

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
        return sorted(rows, key=lambda row: row[0])

    def _profile_options(self, asset_id: str) -> dict[str, str]:
        asset = self._product_assets().get(asset_id)
        if asset is None:
            return {"": "Not configured"}
        return self._profile_options_for_type(str(getattr(asset, "concept_id", "")), include_empty=True)

    def _product_schema(self, asset_id: str):
        runtime = self._runtime()
        fields: dict = {}
        if runtime is None:
            return vol.Schema(fields)
        for property_key, editable in self._product_editables(asset_id):
            current = runtime.configuration_value(asset_id, property_key, None)
            platform = editable.get("platform")
            write_kind = editable.get("write_kind")
            if platform == "text":
                fields[vol.Optional(property_key, default="" if current is None else str(current))] = str
            elif platform == "number":
                validators = [vol.Coerce(float)]
                if editable.get("min") is not None or editable.get("max") is not None:
                    validators.append(vol.Range(min=editable.get("min"), max=editable.get("max")))
                marker = vol.Optional(property_key) if current is None else vol.Optional(property_key, default=float(current))
                fields[marker] = vol.All(*validators)
            elif platform == "select":
                if write_kind == "profile":
                    choices = self._profile_options(asset_id)
                elif write_kind == "selected_charger":
                    choices = self._charger_options()
                else:
                    choices = {"": "Not configured"}
                    choices.update({str(value): str(value) for value in editable.get("options") or []})
                fields[vol.Optional(property_key, default="" if current is None else str(current))] = vol.In(choices)
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
        row = current or {}
        common = {
            vol.Required("profile_type", default=profile_type): vol.In({profile_type: profile_type.title()}),
            vol.Required("display_name", default=row.get("display_name", "")): str,
            vol.Required("short_name", default=row.get("short_name", "")): str,
            vol.Optional("brand", default=row.get("brand") or row.get("manufacturer") or row.get("vendor") or ""): str,
            vol.Optional("model", default=row.get("model", "")): str,
            vol.Optional("variant", default=row.get("variant", "")): str,
            vol.Optional("model_year", default=row.get("model_year")): vol.Any(None, "", vol.All(vol.Coerce(int), vol.Range(min=1900, max=2200))),
            vol.Optional("image_key", default=row.get("image_key", "")): str,
            vol.Optional("phase_capability", default=row.get("phase_capability")): vol.Any(None, vol.All(vol.Coerce(int), vol.In([1, 2, 3]))),
        }
        if profile_type == "vehicle":
            common.update({
                vol.Optional("vehicle_kind", default=row.get("vehicle_kind", "")): vol.In({"": "Not specified", "ev": "EV", "phev": "PHEV"}),
                vol.Optional("battery_capacity_kwh", default=row.get("battery_capacity_kwh")): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0.1, max=500))),
                vol.Optional("nominal_range_km", default=row.get("nominal_range_km")): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0.1, max=2000))),
                vol.Optional("max_ac_power_kw", default=row.get("max_ac_power_kw")): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0.1, max=100))),
                vol.Optional("default_target_soc_pct", default=row.get("default_target_soc_pct", 80)): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0, max=100))),
            })
        else:
            common.update({
                vol.Optional("min_current_a", default=row.get("min_current_a")): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0, max=200))),
                vol.Optional("max_current_a", default=row.get("max_current_a")): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0.1, max=200))),
                vol.Optional("max_power_kw", default=row.get("max_power_kw")): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0.1, max=1000))),
                vol.Optional("nominal_voltage_v", default=row.get("nominal_voltage_v", 230)): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=1, max=1000))),
                vol.Optional("current_step_a", default=row.get("current_step_a", 1)): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0.1, max=100))),
                vol.Required("supports_current_control", default=bool(row.get("supports_current_control", False))): bool,
                vol.Required("supports_remote_start_stop", default=bool(row.get("supports_remote_start_stop", False))): bool,
            })
        return vol.Schema(common)

    async def _store_profile(self, values: dict, *, profile_id: str | None = None):
        domain_config = self._domain_config()
        if domain_config is None:
            raise ValueError("Mobility semantic configuration store unavailable")
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
        choices = ["add_guest_vehicle", "add_vehicle_profile", "add_charger_profile"]
        if self._product_assets():
            choices.insert(0, "configure_product_asset")
        if self._manageable_profiles():
            choices.extend(["edit_profile", "remove_profile"])
        if self._disabled_profiles():
            choices.append("restore_profile")
        if self._guests():
            choices.extend(["edit_guest_vehicle", "remove_guest_vehicle"])
        return self.async_show_menu(step_id="init", menu_options=choices)

    async def async_step_configure_product_asset(self, user_input=None):
        choices = self._product_asset_options()
        if not choices:
            return await self.async_step_init()
        if user_input is not None:
            asset_id = str(user_input.get("product_asset") or "")
            if asset_id not in choices:
                return self.async_show_form(step_id="configure_product_asset", data_schema=vol.Schema({vol.Required("product_asset"): vol.In(choices)}), errors={"base": "unknown_product_asset"})
            self._target_product_asset = asset_id
            return await self.async_step_edit_product_asset()
        return self.async_show_form(step_id="configure_product_asset", data_schema=vol.Schema({vol.Required("product_asset"): vol.In(choices)}))

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
                current = runtime.configuration_value(asset_id, property_key, None)
                if value == current:
                    continue
                await runtime.async_set_configuration_property(asset_id, property_key, value)
        except (TypeError, ValueError):
            return self._product_form(asset_id, user_input=user_input, error="invalid_product_configuration")
        return self.async_create_entry(title="", data=self._options())

    async def async_step_add_vehicle_profile(self, user_input=None):
        if user_input is None:
            return self.async_show_form(step_id="add_vehicle_profile", data_schema=self._profile_schema("vehicle"))
        try:
            return await self._store_profile(dict(user_input))
        except (TypeError, ValueError):
            return self.async_show_form(step_id="add_vehicle_profile", data_schema=self._profile_schema("vehicle", user_input), errors={"base": "invalid_profile"})

    async def async_step_add_charger_profile(self, user_input=None):
        if user_input is None:
            return self.async_show_form(step_id="add_charger_profile", data_schema=self._profile_schema("charger"))
        try:
            return await self._store_profile(dict(user_input))
        except (TypeError, ValueError):
            return self.async_show_form(step_id="add_charger_profile", data_schema=self._profile_schema("charger", user_input), errors={"base": "invalid_profile"})

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
            await domain_config.async_update_profile(target, dict(user_input), expected_type=profile_type)
            return self.async_create_entry(title="", data=self._options())
        except (TypeError, ValueError):
            return self.async_show_form(step_id="edit_selected_profile", data_schema=self._profile_schema(profile_type, user_input), errors={"base": "invalid_profile"}, description_placeholders={"name": str(current.get("display_name") or target)})

    async def async_step_remove_profile(self, user_input=None):
        return await self._select_profile("remove_profile", "remove_selected_profile", user_input)

    async def async_step_remove_selected_profile(self, user_input=None):
        target = str(self._target_profile or "")
        current = self._authored_profiles().get(target)
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
        return self.async_create_entry(title="", data=self._options())

    async def async_step_add_guest_vehicle(self, user_input=None):
        if user_input is None:
            return self._vehicle_form("add_guest_vehicle")
        try:
            values = self._validated_vehicle(user_input)
        except (TypeError, ValueError):
            return self._vehicle_form("add_guest_vehicle", user_input, error="invalid_guest_vehicle")
        guests = self._guests()
        asset_id = _guest_asset_id(values["name"], set(guests))
        guests[asset_id] = values
        return self._result(guests)

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
            return self._vehicle_form("edit_guest", current)
        try:
            guests[target] = self._validated_vehicle(user_input)
        except (TypeError, ValueError):
            return self._vehicle_form("edit_guest", user_input, error="invalid_guest_vehicle")
        return self._result(guests)

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
        guests.pop(target, None)
        options = self._options()
        semantic = dict(options.get("domain_semantic_configuration", {}) or {})
        semantic.pop(target, None)
        options["domain_semantic_configuration"] = semantic
        options[GUEST_VEHICLES_KEY] = guests
        options[REVISION_KEY] = int(options.get(REVISION_KEY, 0) or 0) + 1
        return self.async_create_entry(title="", data=options)

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
