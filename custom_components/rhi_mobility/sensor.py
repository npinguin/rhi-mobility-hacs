from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .device_surfaces import logical_surface_device_info
from .profile_presentation import profile_image_url, profile_metadata
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
    projection = MobilityPropertyProjection(hass, manager, controller, public)
    async_add_entities(
        [
            ReleaseSensor(entry.entry_id),
            HealthSensor(entry.entry_id, manager, controller, public),
            ConfigurationSensor(hass, entry.entry_id, manager),
            BuildSensor(entry.entry_id, manager, provider),
            BroadDeviceSurfaceSensor("mobility", NAME, "Mobility Module V2", device_surfaces, manager, controller, diagnostic=True, device_identifier=entry.entry_id),
            BroadDeviceSurfaceSensor("mobility_intelligence", "Mobility Intelligence", "Mobility Intelligence", device_surfaces, manager, controller),
            BroadDeviceSurfaceSensor("vehicle_intelligence", "Vehicle Intelligence", "Vehicle Intelligence", device_surfaces, manager, controller),
            BroadDeviceSurfaceSensor("charger_intelligence", "Charger Intelligence", "Charger Intelligence", device_surfaces, manager, controller),
        ],
        True,
    )

    created: dict[tuple[str, str], MobilityPropertySensor] = {}
    created_source_diagnostics: dict[tuple[str, str], SourceDiagnosticSensor] = {}

    @callback
    def sync_properties() -> None:
        rows = public.available_scalar_properties()
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
        if status in {"ACCEPTED", "PARTIAL"}:
            return "READY"
        if status == "REMOVED":
            return "EMPTY"
        return "WAITING"

    @property
    def extra_state_attributes(self):
        attempt = self.manager.last_build_attempt
        return {
            "publication_revision": self.provider.publication_revision,
            "specification_count": len(self.provider.get_build_specifications()),
            "build_input_revision": int(attempt.get("build_input_revision", 0) or 0),
            "accepted_binding_count": len(self.manager.bindings),
            "asset_count": len(self.manager.assets),
            "reason": attempt.get("error") if attempt.get("status") == "REJECTED" else attempt.get("status", "WAITING_FOR_FOUNDATION").lower(),
            "legacy_snapshot_degraded_asset_count": sum(1 for s in self.manager.snapshots.values() if s.health != "OK"),
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
    def entity_picture(self):
        if self.property_key not in {"vehicle.image_key", "charger.image_key"}:
            return None
        return profile_image_url(self.manager, self.asset_id)

    @property
    def extra_state_attributes(self):
        asset = self.manager.assets.get(self.asset_id)
        definition = self.provider.property_definition(self.property_key, None if asset is None else asset.concept_id) or {}
        projected = self.projection.row(self.asset_id, self.property_key) or {}
        provenance = dict(projected.get("source_provenance") or {})
        attrs = {
            "property_key": self.property_key,
            "component_id": definition.get("component_id"),
            "section_id": definition.get("section_id"),
            "visibility": definition.get("visibility"),
            "quality": projected.get("quality"),
            "resolution_status": projected.get("resolution_status"),
            "resolution_error": projected.get("resolution_error"),
            "producer_kind": projected.get("producer_kind"),
            **provenance,
            "canonical_contract": "MOBILITY_PUBLIC_RUNTIME_V2",
        }
        if self.property_key in {"asset.profile_id", "vehicle.image_key", "charger.image_key"}:
            attrs.update(profile_metadata(self.manager, self.asset_id))
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
