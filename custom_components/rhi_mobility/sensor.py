from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers import device_registry as dr

from .device_surfaces import logical_surface_device_info
from .projection import logical_device_info
from .property_projection import MobilityPropertyProjection
from .property_resolver import PropertyResolver
from .readiness import ProductReadiness, evaluate_asset_readiness
from .const import (
    DOMAIN,
    FOUNDATION_DOMAIN_ID,
    NAME,
    RELEASE,
    RELEASE_NAME,
    SELECTED_BUILD_INPUT_REGISTRY_KEY,
    SHARED_BASELINE_CHECKSUM,
    SHARED_BASELINE_ID,
    SHARED_BASELINE_VERSION,
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    data = hass.data[DOMAIN][entry.entry_id]
    manager = data["runtime"]
    public = data["public_provider"]
    controller = data["controller"]
    provider = data["provider"]
    source_diagnostics = data["source_diagnostics_provider"]
    device_surfaces = data["device_surface_provider"]
    experience = data["experience_provider"]
    policy = data["policy_provider"]
    energy = data["energy_provider"]
    command = data["command_provider"]
    activity = data["activity_provider"]
    profile_catalog = data["profile_catalog_provider"]
    product_supervision = data["product_supervision_provider"]
    domain_config = data["domain_config"]
    projection = MobilityPropertyProjection(hass, manager, controller, public)
    async_add_entities(
        [
            ReleaseSensor(entry.entry_id),
            HealthSensor(entry.entry_id, manager, controller, public),
            ConfigurationSensor(hass, entry.entry_id, manager),
            BuildSensor(entry.entry_id, manager, provider),
            RuntimeV2SummarySensor(entry.entry_id, manager, public),
            ExperienceV2Sensor(entry.entry_id, manager, domain_config, experience),
            PolicyV2Sensor(entry.entry_id, domain_config, policy),
            EnergyV2Sensor(entry.entry_id, energy),
            CommandV2Sensor(entry.entry_id, command),
            ActivityV2Sensor(entry.entry_id, manager, controller, activity),
            ProfileCatalogV2Sensor(entry.entry_id, profile_catalog),
            ProductSupervisionV2Sensor(entry.entry_id, manager, controller, product_supervision),
            BroadDeviceSurfaceSensor("mobility", NAME, "Mobility Module V2", device_surfaces, manager, controller, diagnostic=True, device_identifier=entry.entry_id),
            BroadDeviceSurfaceSensor("mobility_intelligence", "Mobility Intelligence", "Mobility Intelligence", device_surfaces, manager, controller),
            BroadDeviceSurfaceSensor("vehicle_intelligence", "Vehicle Intelligence", "Vehicle Intelligence", device_surfaces, manager, controller),
            BroadDeviceSurfaceSensor("charger_intelligence", "Charger Intelligence", "Charger Intelligence", device_surfaces, manager, controller),
        ],
        True,
    )

    created: dict[tuple[str, str], MobilityPropertySensor] = {}
    created_source_diagnostics: dict[tuple[str, str], SourceDiagnosticSensor] = {}
    created_source_children: dict[tuple[str, str], SourceBindingStatusSensor] = {}

    @callback
    def sync_properties() -> None:
        rows = public.materialized_scalar_properties()
        wanted = {(row["asset_id"], row["property_key"]) for row in rows}
        for key in list(created):
            if key in wanted:
                continue
            entity = created.pop(key)
            hass.async_create_task(entity.async_remove(force_remove=True))
        new = []
        for row in rows:
            key = (row["asset_id"], row["property_key"])
            if key in created:
                continue
            entity = MobilityPropertySensor(entry.entry_id, row["asset_id"], row["property_key"], public, manager, projection)
            created[key] = entity
            new.append(entity)
        diagnostic_wanted = {(asset_id, role) for asset_id in manager.assets for role in ("integration", "device", "status")}
        for key in list(created_source_diagnostics):
            if key in diagnostic_wanted:
                continue
            entity = created_source_diagnostics.pop(key)
            hass.async_create_task(entity.async_remove(force_remove=True))
        for asset_id, role in sorted(diagnostic_wanted):
            key = (asset_id, role)
            if key in created_source_diagnostics:
                continue
            entity = SourceDiagnosticSensor(entry.entry_id, asset_id, role, source_diagnostics, manager)
            created_source_diagnostics[key] = entity
            new.append(entity)
        binding_rows = {
            (asset_id, str(row["source_key"])): row
            for asset_id in manager.assets
            for row in source_diagnostics.sources(asset_id)
            if row.get("device_registry_id")
        }
        for key in list(created_source_children):
            if key in binding_rows:
                continue
            entity = created_source_children.pop(key)
            hass.async_create_task(entity.async_remove(force_remove=True))
        for key, row in sorted(binding_rows.items()):
            if key in created_source_children:
                continue
            asset_id, source_key = key
            entity = SourceBindingStatusSensor(hass, entry.entry_id, asset_id, source_key, row, source_diagnostics, manager)
            created_source_children[key] = entity
            new.append(entity)
        if new:
            async_add_entities(new, True)

    sync_properties()
    entry.async_on_unload(manager.add_topology_listener(sync_properties))


class MonitoringSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_should_poll = False

    def __init__(self, entry_id: str, role: str, name: str) -> None:
        self._attr_unique_id = f"{DOMAIN}:{entry_id}:monitor:{role}"
        self._attr_name = name
        self._attr_suggested_object_id = f"{DOMAIN}_{role}"
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry_id)},
            "name": NAME,
            "manufacturer": "Robotix",
            "model": "Mobility Module V2",
            "sw_version": RELEASE,
        }


class RuntimeMonitoringSensor(MonitoringSensor):
    def __init__(self, entry_id: str, role: str, name: str, manager) -> None:
        super().__init__(entry_id, role, name)
        self.manager = manager

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.manager.add_listener(self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()


class RuntimeV2SummarySensor(RuntimeMonitoringSensor):
    _attr_icon = "mdi:database-outline"

    def __init__(self, entry_id: str, manager, public) -> None:
        super().__init__(entry_id, "runtime_v2", "Runtime V2", manager)
        self.entity_id = "sensor.rhi_mobility_runtime_v2"
        self.public = public

    @property
    def native_value(self):
        return "ready"

    @property
    def extra_state_attributes(self):
        snapshot = self.public.snapshot()
        return {
            "contract_id": snapshot.get("contract_id"),
            "canonical": True,
            "assets": snapshot.get("assets") or [],
            "fleet": snapshot.get("fleet") or {},
            "relationships": snapshot.get("relationships") or [],
            "vehicle_charger_relationships": snapshot.get("vehicle_charger_relationships") or [],
            "ux_inference_forbidden": True,
        }


class ExperienceV2Sensor(RuntimeMonitoringSensor):
    _attr_icon = "mdi:brain"

    def __init__(self, entry_id: str, manager, domain_config, experience) -> None:
        super().__init__(entry_id, "experience_v2", "Experience V2", manager)
        self.entity_id = "sensor.rhi_mobility_experience_v2"
        self.domain_config = domain_config
        self.experience = experience

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(self.domain_config.add_listener(self._configuration_changed))

    @callback
    def _configuration_changed(self, _asset_id: str, _property_key: str) -> None:
        self.async_write_ha_state()

    @property
    def native_value(self):
        return "ready"

    @property
    def extra_state_attributes(self):
        return dict(self.experience.snapshot() or {})


class PolicyV2Sensor(MonitoringSensor):
    _attr_icon = "mdi:tune-variant"

    def __init__(self, entry_id: str, domain_config, policy) -> None:
        super().__init__(entry_id, "policy_v2", "Policy V2")
        self.entity_id = "sensor.rhi_mobility_policy_v2"
        self.domain_config = domain_config
        self.policy = policy

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.domain_config.add_listener(self._configuration_changed))

    @callback
    def _configuration_changed(self, _asset_id: str, _property_key: str) -> None:
        self.async_write_ha_state()

    @property
    def native_value(self):
        return self.policy.revision

    @property
    def extra_state_attributes(self):
        return dict(self.policy.snapshot() or {})


class EnergyV2Sensor(MonitoringSensor):
    _attr_icon = "mdi:transmission-tower-export"

    def __init__(self, entry_id: str, provider) -> None:
        super().__init__(entry_id, "energy_v2", "Energy V2")
        self.entity_id = "sensor.rhi_mobility_energy_v2"
        self.provider = provider

    async def async_added_to_hass(self) -> None:
        add_listener = getattr(self.provider, "add_listener", None)
        if callable(add_listener):
            self.async_on_remove(add_listener(self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()

    @property
    def native_value(self):
        return "ready"

    @property
    def extra_state_attributes(self):
        return dict(self.provider.snapshot() or {})


class CommandV2Sensor(MonitoringSensor):
    _attr_icon = "mdi:gesture-tap-button"

    def __init__(self, entry_id: str, provider) -> None:
        super().__init__(entry_id, "command_v2", "Command V2")
        self.entity_id = "sensor.rhi_mobility_command_v2"
        self.provider = provider

    async def async_added_to_hass(self) -> None:
        add_listener = getattr(self.provider.controller, "add_listener", None)
        if callable(add_listener):
            self.async_on_remove(add_listener(self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()

    @property
    def native_value(self):
        return "ready"

    @property
    def extra_state_attributes(self):
        return dict(self.provider.command_snapshot() or {})


class ActivityV2Sensor(RuntimeMonitoringSensor):
    _attr_icon = "mdi:history"

    def __init__(self, entry_id: str, manager, controller, provider) -> None:
        super().__init__(entry_id, "activity_v2", "Activity V2", manager)
        self.entity_id = "sensor.rhi_mobility_activity_v2"
        self.controller = controller
        self.provider = provider

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(self.controller.add_listener(self._changed))

    @property
    def native_value(self):
        return "ready"

    @property
    def extra_state_attributes(self):
        return dict(self.provider.snapshot() or {})


class ProfileCatalogV2Sensor(MonitoringSensor):
    _attr_icon = "mdi:car-info"

    def __init__(self, entry_id: str, provider) -> None:
        super().__init__(entry_id, "profile_catalog_v2", "Profile Catalog V2")
        self.entity_id = "sensor.rhi_mobility_profile_catalog_v2"
        self.provider = provider

    @property
    def native_value(self):
        return "ready"

    @property
    def extra_state_attributes(self):
        return dict(self.provider.snapshot() or {})


class ProductSupervisionV2Sensor(RuntimeMonitoringSensor):
    _attr_icon = "mdi:shield-star-outline"

    def __init__(self, entry_id: str, manager, controller, provider) -> None:
        super().__init__(entry_id, "supervision_v2", "Supervision V2", manager)
        self.entity_id = "sensor.rhi_mobility_supervision_v2"
        self.controller = controller
        self.provider = provider

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(self.controller.add_listener(self._changed))

    @property
    def native_value(self):
        return "ready"

    @property
    def extra_state_attributes(self):
        return dict(self.provider.snapshot() or {})


class ReleaseSensor(MonitoringSensor):
    _attr_icon = "mdi:car-connected"
    _attr_entity_registry_enabled_default = False

    def __init__(self, entry_id: str) -> None:
        super().__init__(entry_id, "release", "Release")

    @property
    def native_value(self):
        return RELEASE

    @property
    def extra_state_attributes(self):
        return {
            "release_name": RELEASE_NAME,
            "shared_baseline_id": SHARED_BASELINE_ID,
            "shared_baseline_version": SHARED_BASELINE_VERSION,
            "shared_baseline_checksum": SHARED_BASELINE_CHECKSUM,
        }


class HealthSensor(RuntimeMonitoringSensor):
    _attr_icon = "mdi:shield-check-outline"

    def __init__(self, entry_id: str, manager, controller, public) -> None:
        super().__init__(entry_id, "health", "Health", manager)
        self.controller = controller
        self.resolver = PropertyResolver(manager, public)

    def _asset_readiness(self):
        rows = []
        for asset_id in sorted(self.manager.assets):
            lifecycle = str(
                self.manager.configuration_value(asset_id, "asset.lifecycle_status", "active") or "active"
            ).lower()
            if lifecycle == "disabled":
                continue
            resolutions = self.resolver.resolve_asset(asset_id)
            rows.append(evaluate_asset_readiness(self.manager, self.controller, asset_id, resolutions.values()))
        return rows

    @property
    def native_value(self):
        attempt = self.manager.last_build_attempt
        if attempt.get("status") == "REJECTED" and not self.manager.snapshots:
            return ProductReadiness.BLOCKED.value
        rows = self._asset_readiness()
        if not rows:
            if attempt.get("status") == "REMOVED":
                return ProductReadiness.READY.value
            return ProductReadiness.CONFIGURATION_REQUIRED.value
        precedence = {
            ProductReadiness.READY: 0,
            ProductReadiness.READY_WITH_LIMITATIONS: 1,
            ProductReadiness.CONFIGURATION_REQUIRED: 2,
            ProductReadiness.DEGRADED: 3,
            ProductReadiness.BLOCKED: 4,
        }
        return max((row.product_readiness for row in rows), key=lambda state: precedence[state]).value

    @property
    def extra_state_attributes(self):
        attempt = self.manager.last_build_attempt
        readiness = self._asset_readiness()
        revision = max((s.build_input_revision for s in self.manager.snapshots.values()), default=0)
        return {
            "product_readiness": self.native_value,
            "revision": revision,
            "last_success": attempt.get("observed_at") if attempt.get("status") in {"ACCEPTED", "PARTIAL", "REMOVED"} else None,
            "binding_health": {row.asset_id: row.binding_health.value for row in readiness},
            "observation_health": {row.asset_id: row.observation_health.value for row in readiness},
            "property_health": {row.asset_id: row.property_health.value for row in readiness},
            "control_health": {row.asset_id: row.control_health.value for row in readiness},
            "asset_readiness": [row.as_dict() for row in readiness],
            "legacy_snapshot_health": {
                aid: snap.health for aid, snap in sorted(self.manager.snapshots.items())
            },
            "affected_scope": [] if self.native_value == ProductReadiness.READY.value else [FOUNDATION_DOMAIN_ID],
        }


class ConfigurationSensor(RuntimeMonitoringSensor):
    _attr_icon = "mdi:tune-variant"

    def __init__(self, hass: HomeAssistant, entry_id: str, manager) -> None:
        super().__init__(entry_id, "configuration", "Configuration", manager)
        self.hass = hass

    def _entry(self):
        registry = self.hass.data.get(SELECTED_BUILD_INPUT_REGISTRY_KEY, {}) or {}
        row = registry.get(FOUNDATION_DOMAIN_ID)
        return row if isinstance(row, dict) else None

    @property
    def native_value(self):
        row = self._entry()
        return "CONFIGURED" if row and row.get("inputs") else "UNCONFIGURED"

    @property
    def extra_state_attributes(self):
        row = self._entry() or {}
        inputs = row.get("inputs") if isinstance(row.get("inputs"), list) else []
        return {
            "configuration_revision": int(row.get("configuration_revision", 0) or 0),
            "selected_input_count": len(inputs),
            "foundation_entry_id_present": bool(row.get("foundation_entry_id")),
        }


class BuildSensor(RuntimeMonitoringSensor):
    _attr_icon = "mdi:source-branch-check"

    def __init__(self, entry_id: str, manager, provider) -> None:
        super().__init__(entry_id, "build", "Build", manager)
        self.provider = provider

    @property
    def native_value(self):
        status = self.manager.last_build_attempt.get("status")
        if status == "REJECTED":
            return "INVALID"
        if status == "ACCEPTED":
            return "READY"
        if status == "PARTIAL":
            return "DEGRADED"
        if status == "REMOVED":
            return "EMPTY"
        return "WAITING"

    @property
    def extra_state_attributes(self):
        attempt = self.manager.last_build_attempt
        active_asset_ids = {
            asset_id
            for asset_id in self.manager.assets
            if str(
                self.manager.configuration_value(asset_id, "asset.lifecycle_status", "active") or "active"
            ).lower() != "disabled"
        }
        return {
            "publication_revision": self.provider.publication_revision,
            "specification_count": len(self.provider.get_build_specifications()),
            "build_input_revision": int(attempt.get("build_input_revision", 0) or 0),
            "accepted_binding_count": len(self.manager.bindings),
            "configured_asset_count": len(self.manager.assets),
            "active_runtime_asset_count": len(active_asset_ids),
            "disabled_configured_asset_count": len(self.manager.assets) - len(active_asset_ids),
            "reason": attempt.get("error") if attempt.get("status") == "REJECTED" else attempt.get("status", "WAITING_FOR_FOUNDATION").lower(),
            "legacy_snapshot_degraded_asset_count": sum(
                1
                for asset_id, snapshot in self.manager.snapshots.items()
                if asset_id in active_asset_ids and snapshot.health != "OK"
            ),
            "selection_error_count": int(attempt.get("selection_error_count", 0) or 0),
        }


class MobilityPropertySensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_icon = "mdi:gauge"

    def __init__(self, entry_id, asset_id, property_key, provider, manager, projection):
        asset = manager.assets.get(asset_id)
        definition = provider.property_definition(property_key, None if asset is None else asset.concept_id) or {}
        name = definition.get("friendly_name") or property_key.split(".")[-1].replace("_", " ").title()
        self.asset_id = asset_id
        self.property_key = property_key
        self.provider = provider
        self.manager = manager
        self.projection = projection
        self._attr_name = name
        self._attr_unique_id = f"{DOMAIN}:{asset_id}:property:{property_key}"
        self._attr_suggested_object_id = f"{DOMAIN}_{asset_id}_{property_key.split('.')[-1]}"
        self._attr_native_unit_of_measurement = definition.get("unit")
        if definition.get("visibility") == "engineering":
            self._attr_entity_registry_enabled_default = False
        self._attr_device_info = logical_device_info(manager.hass, entry_id, manager, asset_id)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.manager.add_asset_listener(self.asset_id,self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()

    @property
    def native_value(self):
        return self.projection.value(self.asset_id, self.property_key)

    @property
    def available(self):
        # Keep the canonical property entity stable while value/status describe absence.
        return self.asset_id in self.manager.assets

    @property
    def extra_state_attributes(self):
        asset = self.manager.assets.get(self.asset_id)
        definition = self.provider.property_definition(self.property_key, None if asset is None else asset.concept_id) or {}
        projected = self.projection.row(self.asset_id, self.property_key) or {}
        provenance = dict(projected.get("source_provenance") or {})
        write = self.projection.write_metadata(self.asset_id, self.property_key) or {}
        attrs = {
            "asset_id": self.asset_id,
            "asset_type": None if asset is None else asset.concept_id,
            "property_key": self.property_key,
            "component_id": definition.get("component_id"),
            "section_id": definition.get("section_id"),
            "visibility": definition.get("visibility"),
            "quality": projected.get("quality"),
            "resolution_status": projected.get("resolution_status"),
            "resolution_error": projected.get("resolution_error"),
            "producer_kind": projected.get("producer_kind"),
            "editable": bool(write.get("editable")),
            "write_supported": bool(write.get("write_supported")),
            "write_binding_type": write.get("write_binding_type") or "",
            "write_service_domain": write.get("write_service_domain") or "",
            "write_service_action": write.get("write_service_action") or "",
            "write_target_entity": write.get("write_target_entity") or "",
            "write_property_key": write.get("write_property_key") or self.property_key,
            "write_service_data": write.get("write_service_data") or {},
            "write_value_field": write.get("write_value_field") or "",
            "min": write.get("min"),
            "max": write.get("max"),
            "step": write.get("step"),
            "choices": write.get("choices"),
            "options": write.get("options"),
            "value_field": write.get("value_field") or "value",
            "label_field": write.get("label_field") or "label",
            "secondary_label_field": write.get("secondary_label_field") or "secondary_label",
            "allow_none": bool(write.get("allow_none")),
            "none_value": write.get("none_value") or "",
            **provenance,
            "canonical_contract": "MOBILITY_PUBLIC_RUNTIME_V2",
        }
        return attrs


class BroadDeviceSurfaceSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_icon = "mdi:brain"

    def __init__(self, surface_id, name, model, provider, manager, controller, diagnostic=False, device_identifier=None):
        self.surface_id=surface_id
        self.provider=provider
        self.manager=manager
        self.controller=controller
        self._attr_name="Status"
        self._attr_unique_id=f"{DOMAIN}:surface:{surface_id}:status"
        self._attr_suggested_object_id=f"{DOMAIN}_{surface_id}_status"
        self._attr_device_info=logical_surface_device_info(surface_id,name,model,device_identifier=device_identifier)
        if diagnostic:
            self._attr_entity_category=EntityCategory.DIAGNOSTIC
            self._attr_icon="mdi:shield-search"

    async def async_added_to_hass(self):
        # Broad surfaces are summaries, not telemetry mirrors. Updating them for every
        # source event caused four expensive whole-domain recomputations per asset
        # refresh. They now update only for structural topology and explicit control
        # changes. Scalar property entities remain live through asset-scoped listeners.
        self.async_on_remove(self.manager.add_topology_listener(self._changed))
        add_control=getattr(self.controller,"add_listener",None)
        if callable(add_control): self.async_on_remove(add_control(self._changed))

    @callback
    def _changed(self): self.async_write_ha_state()

    def _row(self):
        return dict((self.provider.snapshot() or {}).get(self.surface_id) or {})

    @property
    def native_value(self): return self._row().get("state") or "UNKNOWN"

    @property
    def extra_state_attributes(self):
        row=self._row(); row.pop("state",None)
        return {**row,"surface_id":self.surface_id,"owner":DOMAIN,"projection_contract":self.provider.CONTRACT_ID,"ha_projection_inference":False}


class SourceDiagnosticSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_icon = "mdi:source-branch"

    _NAMES={"integration":"Source Integration","device":"Source Device","status":"Source Status"}

    def __init__(self, entry_id, asset_id, role, provider, manager):
        self.asset_id=asset_id
        self.role=role
        self.provider=provider
        self.manager=manager
        self._attr_name=self._NAMES[role]
        self._attr_unique_id=f"{DOMAIN}:{asset_id}:source_diag:{role}"
        self._attr_suggested_object_id=f"{DOMAIN}_{asset_id}_source_{role}"
        self._attr_device_info=logical_device_info(manager.hass,entry_id,manager,asset_id)

    async def async_added_to_hass(self):
        self.async_on_remove(self.manager.add_asset_listener(self.asset_id,self._changed))

    @callback
    def _changed(self): self.async_write_ha_state()

    def _row(self):
        summary=self.provider.asset(self.asset_id)
        return {} if summary is None else summary.as_dict()

    @property
    def available(self): return self.asset_id in self.manager.assets

    @property
    def native_value(self):
        row=self._row()
        if self.role=="integration": return row.get("integration") or "Unavailable"
        if self.role=="device": return row.get("device_name") or row.get("device_registry_id") or "Unavailable"
        return row.get("status") or "UNBOUND"

    @property
    def extra_state_attributes(self):
        row=self._row()
        common={
            "source_device_url":row.get("source_device_url"),
            "source_integration_url":row.get("source_integration_url"),
            "source_integration_documentation_url":row.get("source_integration_documentation_url"),
            "mobility_repository_url":row.get("mobility_repository_url"),
            "owner":row.get("owner"),
            "authority":row.get("authority"),
        }
        if self.role=="status":
            common.update({"binding_count":row.get("binding_count"),"observed_at":row.get("observed_at"),"config_entry_id":row.get("config_entry_id")})
        elif self.role=="device":
            common.update({"device_registry_id":row.get("device_registry_id"),"config_entry_id":row.get("config_entry_id")})
        return {k:v for k,v in common.items() if v is not None}


class SourceBindingStatusSensor(SensorEntity):
    """One compact diagnostic entity attached to the accepted HA source device."""
    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_icon = "mdi:connection"
    _attr_name = "Binding Status"

    def __init__(self, hass, entry_id, asset_id, source_key, initial_row, provider, manager):
        self.hass = hass
        self.entry_id = entry_id
        self.asset_id = asset_id
        self.source_key = source_key
        self.provider = provider
        self.manager = manager
        self.source_device_id = str(initial_row.get("device_registry_id") or "")
        integration = initial_row.get("integration")
        self._attr_unique_id = f"{DOMAIN}:{asset_id}:source_binding:{source_key}:status"
        self._attr_suggested_object_id = f"{DOMAIN}_{asset_id}_{integration or 'source'}_binding_status"
        # HA 2026.8+ helper-integration rule: attach the diagnostic entity
        # directly to the existing source DeviceEntry. Do not copy identifiers or
        # connections and do not create a Mobility proxy device.
        self._attr_device_info = None
        self.device_entry = dr.async_get(hass).async_get(self.source_device_id)

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        self.async_on_remove(self.manager.add_asset_listener(self.asset_id, self._changed))

    @callback
    def _changed(self):
        self.async_write_ha_state()

    def _row(self):
        return next((row for row in self.provider.sources(self.asset_id) if str(row.get("source_key")) == self.source_key), {})

    @property
    def available(self):
        return bool(self._row())

    @property
    def native_value(self):
        return "ACTIVE" if self._row() else "UNBOUND"

    @property
    def extra_state_attributes(self):
        row = self._row()
        return {k: v for k, v in {
            "integration": row.get("integration"),
            "source_device_url": row.get("source_device_url"),
            "source_integration_url": row.get("source_integration_url"),
            "source_integration_documentation_url": row.get("source_integration_documentation_url"),
            "device_registry_id": row.get("device_registry_id"),
            "config_entry_id": row.get("config_entry_id"),
            "binding_ids": row.get("binding_ids"),
            "source_roles": row.get("source_roles"),
            "input_count": row.get("input_count"),
            "owner": row.get("owner"),
            "authority": row.get("authority"),
        }.items() if v is not None}
