from __future__ import annotations
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Callable
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from ..builders.selected_input import prepare_selected_build_input
from ..models.contracts import AssetControlProfile, LogicalAssetBinding, RelationshipSnapshot, RuntimeSnapshot, VehiclePlanningProfile
from .normalization import normalize
from .derived import apply_vehicle_derivations, apply_charger_derivations

_LOGGER = logging.getLogger(__name__)

class MobilityRuntimeManager:
    """Mobility runtime built solely from Foundation SelectedDomainBuildInput."""
    def __init__(self, hass: HomeAssistant, registry, domain_config=None) -> None:
        self.hass=hass
        self.registry=registry
        self.domain_config=domain_config
        self.assets: dict[str, LogicalAssetBinding]={}
        self.snapshots: dict[str, RuntimeSnapshot]={}
        self.relationships: dict[str, RelationshipSnapshot]={}
        self._selection_asset_roles: dict[str,set[tuple[str,str]]]={}
        self._selection_asset_ids: dict[str,set[str]]={}
        self._selection_diagnostics: dict[str,dict[str,Any]]={}
        self._capability_diagnostics: list[dict[str,Any]]=[]
        self._selection_relationship_ids: dict[str,set[str]]={}
        self._selection_control_profiles: dict[str,dict[str,AssetControlProfile]]={}
        self._selection_planning_profiles: dict[str,dict[str,VehiclePlanningProfile]]={}
        self._unsubs: dict[str,list[Callable[[],None]]]={}
        # Scoped notifications keep high-frequency telemetry off the topology path.
        self.listeners: list[Callable[[],None]]=[]  # small domain/monitoring audience only
        self._topology_listeners: list[Callable[[],None]]=[]
        self._runtime_listeners: list[Callable[[],None]]=[]  # small publisher/controller audience
        self._asset_listeners: dict[str,list[Callable[[],None]]]=defaultdict(list)
        self._pending_refresh_assets: set[str]=set()
        self._refresh_flush_scheduled=False
        self.last_build_attempt: dict[str,Any] = {'status':'WAITING_FOR_FOUNDATION','observed_at':None}
        self._health_cache: dict[str,tuple[str,str]] = {}

    @property
    def bindings(self):
        return {b.binding_id:b for a in self.assets.values() for b in a.source_bindings.values()}

    def _selected_profile(self, asset_id: str) -> dict[str, Any] | None:
        profile_id = self.configuration_value(asset_id, "asset.profile_id", None)
        if not profile_id:
            return None
        getter = getattr(self.registry, "profile", None)
        profile = getter(str(profile_id)) if callable(getter) else None
        asset = self.assets.get(asset_id)
        if not isinstance(profile, dict) or asset is None:
            return None
        if profile.get("profile_type") != asset.concept_id:
            return None
        return profile

    @property
    def control_profiles(self) -> dict[str, AssetControlProfile]:
        merged: dict[str, AssetControlProfile] = {}
        for selection_id in sorted(self._selection_control_profiles):
            merged.update(self._selection_control_profiles[selection_id])
        # Domain profiles are Mobility-owned semantic configuration. They may add
        # physical limits/defaults but never replace a measured actual value.
        for asset_id, asset in self.assets.items():
            profile = self._selected_profile(asset_id)
            if not profile:
                continue
            if asset.concept_id == "vehicle":
                phases = profile.get("phase_capability")
                merged[asset_id] = AssetControlProfile(
                    asset_id=asset_id,
                    phase_count=int(phases) if phases is not None else None,
                    ac_phase_count=int(phases) if phases is not None else None,
                    max_ac_power_kw=float(profile["max_ac_power_kw"]) if profile.get("max_ac_power_kw") is not None else None,
                )
            elif asset.concept_id == "charger":
                phases = profile.get("phase_capability")
                merged[asset_id] = AssetControlProfile(
                    asset_id=asset_id,
                    nominal_voltage_v=float(profile["nominal_voltage_v"]) if profile.get("nominal_voltage_v") is not None else None,
                    phase_count=int(phases) if phases is not None else None,
                    min_current_a=float(profile["min_current_a"]) if profile.get("min_current_a") is not None else None,
                    max_current_a=float(profile["max_current_a"]) if profile.get("max_current_a") is not None else None,
                    current_step_a=float(profile["current_step_a"]) if profile.get("current_step_a") is not None else None,
                    ac_phase_count=int(phases) if phases is not None else None,
                    max_ac_power_kw=float(profile["max_power_kw"]) if profile.get("max_power_kw") is not None else None,
                )
        return merged

    def control_profile(self, asset_id: str) -> AssetControlProfile | None:
        return self.control_profiles.get(asset_id)

    @property
    def planning_profiles(self) -> dict[str, VehiclePlanningProfile]:
        merged: dict[str, VehiclePlanningProfile] = {}
        for selection_id in sorted(self._selection_planning_profiles):
            merged.update(self._selection_planning_profiles[selection_id])
        for asset_id, asset in self.assets.items():
            if asset.concept_id != "vehicle":
                continue
            profile = self._selected_profile(asset_id) or {}
            configured_capacity = self.configuration_value(asset_id, "vehicle.battery_capacity_kwh", None)
            configured_target = self.configuration_value(asset_id, "vehicle.target_soc_pct", None)
            ready_by = self.configuration_value(asset_id, "vehicle.ready_by", None)
            capacity = configured_capacity if configured_capacity is not None else profile.get("battery_capacity_kwh")
            target = configured_target if configured_target is not None else profile.get("default_target_soc_pct")
            lifecycle = self.configuration_value(asset_id, "asset.lifecycle_status", "active")
            if capacity is None and target is None and ready_by is None and not profile:
                continue
            merged[asset_id] = VehiclePlanningProfile(
                asset_id=asset_id,
                battery_capacity_kwh=float(capacity) if capacity is not None else None,
                target_soc_pct=float(target) if target is not None else None,
                ready_by=str(ready_by) if ready_by not in (None, "") else None,
                enabled=lifecycle != "disabled",
            )
        return merged

    def planning_profile(self, asset_id: str) -> VehiclePlanningProfile | None:
        return self.planning_profiles.get(asset_id)

    def _source_device_name(self, device_id: str | None) -> str | None:
        if not device_id:
            return None
        try:
            from homeassistant.helpers import device_registry as dr
            device = dr.async_get(self.hass).async_get(device_id)
        except Exception as exc:
            _LOGGER.debug("Mobility exact source-device lookup failed device_id=%s: %s", device_id, exc)
            return None
        if device is None:
            return None
        for value in (getattr(device, "name_by_user", None), getattr(device, "name", None), getattr(device, "model", None)):
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None

    def primary_source_metadata(self, asset_id: str) -> dict[str, Any]:
        asset = self.assets.get(asset_id)
        if asset is None:
            return {}
        out = {
            "integration_domain": asset.source_integration_domain,
            "device_id": asset.source_device_id,
            "config_entry_id": asset.source_config_entry_id,
        }
        if asset.source_device_id:
            out["device_name"] = self._source_device_name(asset.source_device_id)
        return {k: v for k, v in out.items() if v is not None}

    def property_provenance(self, asset_id: str, property_key: str) -> dict[str, Any]:
        snap = self.snapshots.get(asset_id)
        asset = self.assets.get(asset_id)
        if snap is None or asset is None:
            return {}
        quality = snap.quality.get(property_key)
        out: dict[str, Any] = {"normalization_status": "UNKNOWN" if self.property_value_for_provenance(snap, property_key) is None else "AVAILABLE"}
        if quality:
            out["quality"] = quality
        if isinstance(quality, str) and quality.startswith("candidate:"):
            candidate_id = quality.split("candidate:", 1)[1]
            for binding in asset.source_bindings.values():
                for input_id, source in binding.inputs.items():
                    if source.candidate_id != candidate_id:
                        continue
                    out.update({
                        "source_integration": source.integration_domain,
                        "source_device_id": source.device_id,
                        "source_config_entry_id": source.config_entry_id,
                        "source_entity_id": source.entity_id,
                        "candidate_id": source.candidate_id,
                        "raw_capability_id": source.raw_capability_id,
                        "technical_capability": source.technical_capability,
                        "source_input_id": input_id,
                    })
                    return {k: v for k, v in out.items() if v is not None}
        if isinstance(quality, str) and quality.startswith("mobility_profile:"):
            out["profile_id"] = quality.split(":", 1)[1]
        definition = (getattr(self.registry, "semantic_catalog", {}).get("properties") or {}).get(property_key) or {}
        dependencies = definition.get("derived_dependencies") or []
        if dependencies:
            out["derived_from"] = list(dependencies)
        elif property_key == "asset.availability_state":
            out["derived_from"] = [f"{asset.concept_id}.health", "asset.lifecycle_status"]
        if "source_integration" not in out:
            out.update({
                "source_integration": asset.source_integration_domain,
                "source_device_id": asset.source_device_id,
                "source_config_entry_id": asset.source_config_entry_id,
            })
        return {k: v for k, v in out.items() if v is not None}

    @staticmethod
    def property_value_for_provenance(snap: RuntimeSnapshot, property_key: str):
        return snap.values.get(property_key)

    def configuration_value(self, asset_id: str, property_key: str, default=None):
        if self.domain_config is None:
            return default
        return self.domain_config.get(asset_id, property_key, default)

    @property
    def effective_relationships(self) -> dict[str, RelationshipSnapshot]:
        # Mobility owns logical assignment semantics. A local semantic assignment may supersede
        # a Foundation-carried default relationship, but it never changes technical source
        # bindings or SelectedDomainBuildInput identity.
        out={rid:rel for rid,rel in self.relationships.items() if rel.relationship_type!='configured_assignment'}
        foundation_by_vehicle={}
        for rel in self.relationships.values():
            if rel.relationship_type=='configured_assignment': foundation_by_vehicle[rel.from_asset_id]=rel
        for aid,asset in self.assets.items():
            if asset.concept_id!='vehicle': continue
            configured=self.configuration_value(aid,'vehicle.selected_charger',None)
            base=foundation_by_vehicle.get(aid)
            cid=configured if configured not in (None,'') else (base.to_asset_id if base else None)
            if cid is None: continue
            health='OK' if aid in self.assets and cid in self.assets else 'PENDING'
            rid=f'relationship.mobility.configured_assignment.{aid}.{cid}'
            out[rid]=RelationshipSnapshot(rid,'configured_assignment',aid,cid,'mobility_semantic_configuration' if configured not in (None,'') else (base.selection_id if base else 'unknown'),health,'mobility_domain_configuration' if configured not in (None,'') else (base.evidence_source if base else 'foundation'))
        return out

    def effective_charger_for_vehicle(self, vehicle_id: str) -> str | None:
        for rel in self.effective_relationships.values():
            if rel.relationship_type=='configured_assignment' and rel.from_asset_id==vehicle_id and rel.health=='OK':
                return rel.to_asset_id
        return None

    async def async_set_configuration_property(self, asset_id: str, property_key: str, value) -> None:
        if asset_id not in self.assets:
            raise ValueError(f'unknown Mobility asset: {asset_id}')
        asset=self.assets[asset_id]
        semantic_catalog=getattr(self.registry,'semantic_catalog',{}) or {}
        semantic_properties=semantic_catalog.get('properties') or {}
        definition=semantic_properties.get(property_key) or {}
        editable=definition.get('editable') if isinstance(definition,dict) else None
        manager_write_kinds={'configuration','profile','selected_charger','manual_vehicle_configuration'}
        internal_canonical_write = property_key == 'asset.lifecycle_status' and asset.concept_id in {'vehicle','charger'}
        if semantic_properties:
            if not internal_canonical_write and (not isinstance(editable,dict) or editable.get('write_kind') not in manager_write_kinds):
                raise ValueError(f'unsupported Mobility domain property: {property_key}')
            if not internal_canonical_write and asset.concept_id not in set(editable.get('asset_types') or []):
                raise ValueError(f'{property_key} is not editable for {asset.concept_id}')
        else:
            # Test/backward fixture compatibility only; production registry always carries the canonical catalog.
            fallback={'asset.display_name','asset.short_name','asset.owner_label','asset.location_label','asset.profile_id','asset.lifecycle_status','vehicle.selected_charger','vehicle.target_soc_pct','vehicle.ready_by','vehicle.present','vehicle.battery_capacity_kwh','vehicle.mobility_charge_policy','vehicle.soc_pct','vehicle.battery_energy_kwh'}
            if property_key not in fallback:
                raise ValueError(f'unsupported Mobility domain property: {property_key}')
        if property_key=='asset.lifecycle_status' and value not in {'active','disabled'}:
            raise ValueError('lifecycle_status must be active or disabled')
        if property_key=='asset.profile_id' and value not in (None, ''):
            getter=getattr(self.registry,'profile',None)
            profile=getter(str(value)) if callable(getter) else None
            if not isinstance(profile,dict):
                raise ValueError(f'unknown Mobility profile: {value}')
            if profile.get('profile_type') != asset.concept_id:
                raise ValueError(f'profile {value} is not valid for {asset.concept_id}')
        if property_key=='vehicle.selected_charger':
            if asset.concept_id!='vehicle': raise ValueError('selected charger is vehicle-only')
            if value not in self.assets or self.assets[value].concept_id!='charger': raise ValueError('selected charger must reference a current charger asset')
        if property_key=='vehicle.target_soc_pct':
            value=float(value)
            if not 0 <= value <= 100: raise ValueError('target_soc_pct must be between 0 and 100')
        if property_key=='vehicle.battery_capacity_kwh':
            value=float(value)
            if value <= 0: raise ValueError('battery_capacity_kwh must be positive')
        if property_key in {'vehicle.soc_pct','vehicle.battery_energy_kwh'}:
            if asset.concept_id!='vehicle' or 'manual_profile' not in asset.source_bindings:
                raise ValueError(f'{property_key} is editable only for manual-profile vehicles')
            value=float(value)
            if property_key=='vehicle.soc_pct' and not 0 <= value <= 100:
                raise ValueError('vehicle.soc_pct must be between 0 and 100')
            if property_key=='vehicle.battery_energy_kwh' and value < 0:
                raise ValueError('vehicle.battery_energy_kwh must be >= 0')
            cap=self.configuration_value(asset_id,'vehicle.battery_capacity_kwh',None)
            if property_key=='vehicle.battery_energy_kwh' and cap is not None and value > float(cap)+1e-9:
                raise ValueError('vehicle.battery_energy_kwh cannot exceed battery capacity')
        if property_key=='vehicle.present': value=bool(value)
        if property_key=='vehicle.mobility_charge_policy' and value not in {'Automatic','Forced','Paused'}:
            raise ValueError('unsupported mobility charge policy')
        if self.domain_config is None:
            raise RuntimeError('Mobility semantic configuration store unavailable')
        await self.domain_config.async_set(asset_id,property_key,value)
        affected=set(self.assets) if property_key in {'vehicle.selected_charger','vehicle.target_soc_pct','vehicle.battery_capacity_kwh'} else {asset_id}
        for aid in affected:
            if aid in self.snapshots: self._refresh(aid)

    def configured_vehicle_for_charger(self, charger_id: str) -> str | None:
        for rel in self.effective_relationships.values():
            if rel.relationship_type=='configured_assignment' and rel.to_asset_id==charger_id and rel.health=='OK':
                return rel.from_asset_id
        return None

    def effective_charging_profile(self, charger_id: str) -> dict[str, float] | None:
        charger=self.control_profile(charger_id)
        if charger is None or charger.nominal_voltage_v is None or charger.phase_count is None:
            return None
        phases=int(charger.phase_count); voltage=float(charger.nominal_voltage_v)
        min_a=charger.min_current_a; max_a=charger.max_current_a; step_a=charger.current_step_a
        vehicle_id=self.configured_vehicle_for_charger(charger_id)
        vehicle=self.control_profile(vehicle_id) if vehicle_id else None
        if vehicle and vehicle.ac_phase_count: phases=min(phases,int(vehicle.ac_phase_count))
        if phases<=0 or voltage<=0: return None
        if vehicle and vehicle.max_ac_power_kw and max_a:
            max_a=min(float(max_a),float(vehicle.max_ac_power_kw)*1000.0/(voltage*phases))
        if min_a is None or max_a is None or step_a is None or min_a<=0 or max_a<min_a or step_a<=0: return None
        return {
            'nominal_voltage_v':voltage,'phase_count':float(phases),'min_current_a':float(min_a),
            'max_current_a':float(max_a),'current_step_a':float(step_a),
            'min_power_kw':float(min_a)*voltage*phases/1000.0,
            'max_power_kw':float(max_a)*voltage*phases/1000.0,
            'step_power_kw':float(step_a)*voltage*phases/1000.0,
        }

    def add_listener(self, cb: Callable[[],None]) -> Callable[[],None]:
        """Subscribe to low-volume domain/runtime status changes.

        Property entities must use add_asset_listener(); topology projection must use
        add_topology_listener(). This prevents one telemetry update from waking every entity.
        """
        self.listeners.append(cb)
        def unsub() -> None:
            if cb in self.listeners: self.listeners.remove(cb)
        return unsub

    def add_topology_listener(self, cb: Callable[[],None]) -> Callable[[],None]:
        self._topology_listeners.append(cb)
        def unsub() -> None:
            if cb in self._topology_listeners: self._topology_listeners.remove(cb)
        return unsub

    def add_runtime_listener(self, cb: Callable[[],None]) -> Callable[[],None]:
        """Subscribe a small backend consumer that needs any asset-value change.

        This path is for the compatibility publisher/controller, never for per-property HA entities.
        """
        self._runtime_listeners.append(cb)
        def unsub() -> None:
            if cb in self._runtime_listeners: self._runtime_listeners.remove(cb)
        return unsub

    def add_asset_listener(self, asset_id: str, cb: Callable[[],None]) -> Callable[[],None]:
        rows=self._asset_listeners[str(asset_id)]; rows.append(cb)
        def unsub() -> None:
            listeners=self._asset_listeners.get(str(asset_id))
            if listeners and cb in listeners:
                listeners.remove(cb)
                if not listeners: self._asset_listeners.pop(str(asset_id),None)
        return unsub

    def _notify(self) -> None:
        """Backward-compatible domain status notification; intentionally small audience."""
        for cb in tuple(self.listeners): cb()

    def _notify_topology(self) -> None:
        for cb in tuple(self._topology_listeners): cb()
        for cb in tuple(self._runtime_listeners): cb()
        self._notify()

    def _notify_asset(self, asset_id: str) -> None:
        for cb in tuple(self._asset_listeners.get(str(asset_id),())): cb()
        for cb in tuple(self._runtime_listeners): cb()

    def _schedule_refresh(self, asset_id: str) -> None:
        """Coalesce multiple source events for the same asset into one event-loop refresh."""
        if asset_id not in self.assets:
            return
        self._pending_refresh_assets.add(asset_id)
        if self._refresh_flush_scheduled:
            return
        loop=getattr(self.hass,"loop",None)
        call_soon=getattr(loop,"call_soon",None)
        if callable(call_soon):
            self._refresh_flush_scheduled=True
            call_soon(self._flush_scheduled_refreshes)
        else:
            self._flush_scheduled_refreshes()

    def _flush_scheduled_refreshes(self) -> None:
        self._refresh_flush_scheduled=False
        pending=sorted(self._pending_refresh_assets); self._pending_refresh_assets.clear()
        for asset_id in pending:
            self._refresh(asset_id)

    def _clear_asset_listener(self, asset_id: str) -> None:
        for unsub in self._unsubs.pop(asset_id,[]): unsub()

    def clear_all(self) -> None:
        for asset_id in list(self._unsubs): self._clear_asset_listener(asset_id)
        self.assets.clear(); self.snapshots.clear(); self.relationships.clear()
        self._selection_asset_roles.clear(); self._selection_asset_ids.clear(); self._selection_diagnostics.clear(); self._capability_diagnostics.clear(); self._selection_relationship_ids.clear(); self._selection_control_profiles.clear(); self._selection_planning_profiles.clear(); self._health_cache.clear(); self._pending_refresh_assets.clear(); self._notify_topology()

    async def async_replace_selected_build_inputs(self, payloads: list[dict[str,Any]] | tuple[dict[str,Any], ...]) -> dict[str,Any]:
        """Reconcile the complete Foundation handoff slice with capability isolation.

        Top-level malformed handoffs are isolated to their selection. Identifiable Mobility
        objects are materialized even when individual capabilities are missing, ambiguous or
        awaiting review. Only proven capabilities become source bindings; command/control
        surfaces stay fail-closed. This keeps good runtime truth visible and makes the exact
        integration/device/capability defect diagnosable.
        """
        observed_at=datetime.now(timezone.utc).isoformat()
        prepared_rows=[]
        selection_errors=[]
        for index,payload in enumerate(payloads):
            try:
                prepared_rows.append(prepare_selected_build_input(payload,self.registry))
            except Exception as exc:
                builder_id=str(payload.get('builder_id') or '') if isinstance(payload,dict) else ''
                selection=(payload.get('selection') or {}) if isinstance(payload,dict) else {}
                selection_errors.append({
                    'index':index,'builder_id':builder_id,'integration_domain':selection.get('integration_domain'),
                    'status':'REJECTED','error_type':type(exc).__name__,'error':str(exc),
                })
                _LOGGER.warning('Mobility selected input isolated as invalid builder=%s integration=%s: %s',builder_id,selection.get('integration_domain'),exc)

        proposed_assets: dict[str,LogicalAssetBinding]={}
        proposed_relationships: dict[str,RelationshipSnapshot]={}
        selection_asset_roles: dict[str,set[tuple[str,str]]]={}
        selection_asset_ids: dict[str,set[str]]={}
        selection_relationship_ids: dict[str,set[str]]={}
        selection_control_profiles: dict[str,dict[str,AssetControlProfile]]={}
        selection_planning_profiles: dict[str,dict[str,VehiclePlanningProfile]]={}
        selection_diagnostics: dict[str,dict[str,Any]]={}
        capability_diagnostics: list[dict[str,Any]]=[]
        max_cfg_by_asset: dict[str,int]={}
        max_build_by_asset: dict[str,int]={}

        try:
            for prepared in prepared_rows:
                sid=prepared.selection_id
                if sid in selection_asset_roles:
                    raise ValueError(f'duplicate Mobility selection identity {sid}')
                ids:set[str]=set()
                for seed in prepared.asset_seeds:
                    asset=proposed_assets.get(seed.asset_id)
                    source_name=self._source_device_name(seed.source_device_id)
                    display_name=source_name or seed.display_name
                    if asset is None:
                        asset=LogicalAssetBinding(
                            seed.asset_id, seed.logical_concept_id, display_name, {},
                            source_integration_domain=seed.integration_domain,
                            source_device_id=seed.source_device_id,
                            source_config_entry_id=seed.source_config_entry_id,
                        )
                        proposed_assets[seed.asset_id]=asset
                    else:
                        if asset.concept_id != seed.logical_concept_id:
                            raise ValueError(f'asset {seed.asset_id} concept conflict')
                        if asset.source_integration_domain not in (None, seed.integration_domain):
                            raise ValueError(f'automatic multi-source fusion forbidden for {seed.asset_id}')
                    ids.add(seed.asset_id)
                    max_cfg_by_asset[seed.asset_id]=max(max_cfg_by_asset.get(seed.asset_id,0),prepared.source_configuration_revision)
                    max_build_by_asset[seed.asset_id]=max(max_build_by_asset.get(seed.asset_id,0),prepared.build_input_revision)

                pairs:set[tuple[str,str]]=set()
                for binding in prepared.source_bindings:
                    asset=proposed_assets.get(binding.asset_id)
                    first_source=next(iter(binding.inputs.values()), None)
                    source_device_id=None if first_source is None else first_source.device_id
                    source_config_entry_id=None if first_source is None else first_source.config_entry_id
                    source_name=self._source_device_name(source_device_id)
                    if asset is None:
                        asset=LogicalAssetBinding(
                            binding.asset_id, binding.logical_concept_id,
                            source_name or binding.asset_id.replace('_',' ').title(), {},
                            source_integration_domain=binding.integration_domain,
                            source_device_id=source_device_id,
                            source_config_entry_id=source_config_entry_id,
                        )
                        proposed_assets[binding.asset_id]=asset
                        ids.add(binding.asset_id)
                    else:
                        if asset.concept_id != binding.logical_concept_id:
                            raise ValueError(f'asset {binding.asset_id} concept conflict')
                        if asset.source_integration_domain not in (None, binding.integration_domain):
                            raise ValueError(f'automatic multi-source fusion forbidden for {binding.asset_id}')
                        if asset.source_device_id not in (None, source_device_id):
                            raise ValueError(f'asset {binding.asset_id} has conflicting primary source device')
                        if asset.source_integration_domain is None:
                            asset.source_integration_domain=binding.integration_domain
                        if asset.source_device_id is None:
                            asset.source_device_id=source_device_id
                        if asset.source_config_entry_id is None:
                            asset.source_config_entry_id=source_config_entry_id
                        if source_name and asset.display_name.startswith(("Vehicle ", "Charger ", "Person ")):
                            asset.display_name=source_name
                    existing=asset.source_bindings.get(binding.source_role)
                    if existing is not None and existing != binding:
                        raise ValueError(f'asset {binding.asset_id} has conflicting source role {binding.source_role}')
                    asset.source_bindings[binding.source_role]=binding
                    pairs.add((binding.asset_id,binding.source_role))
                    max_cfg_by_asset[binding.asset_id]=max(max_cfg_by_asset.get(binding.asset_id,0),binding.source_configuration_revision)
                    max_build_by_asset[binding.asset_id]=max(max_build_by_asset.get(binding.asset_id,0),binding.build_input_revision)
                selection_asset_roles[sid]=pairs
                selection_asset_ids[sid]=ids

                rel_ids:set[str]=set()
                for rel in prepared.relationships:
                    if rel.relationship_id in proposed_relationships and proposed_relationships[rel.relationship_id] != rel:
                        raise ValueError(f'conflicting Mobility relationship {rel.relationship_id}')
                    proposed_relationships[rel.relationship_id]=rel
                    rel_ids.add(rel.relationship_id)
                selection_relationship_ids[sid]=rel_ids
                selection_control_profiles[sid]={row.asset_id:row for row in prepared.control_profiles}
                selection_planning_profiles[sid]={row.asset_id:row for row in prepared.planning_profiles}

                capability_diagnostics.extend(dict(row) for row in prepared.capability_diagnostics)
                problem_statuses={'MISSING','AMBIGUOUS','INVALID_EVIDENCE','BLOCKED_BY_REVIEW','BLOCKED_BY_TARGET_SCOPE'}
                problems=[row for row in prepared.capability_diagnostics if row.get('status') in problem_statuses]
                status='EMPTY' if not prepared.asset_seeds else ('PARTIAL' if problems or prepared.discovery_assessment.get('review_required') else 'READY')
                selection_diagnostics[sid]={
                    'selection_id':sid,'builder_id':prepared.builder_id,'integration_domain':prepared.integration_domain,
                    'status':status,'asset_ids':sorted(ids),'binding_count':len(prepared.source_bindings),
                    'assessment':dict(prepared.discovery_assessment),'problem_count':len(problems),
                }

            merged_control={}
            for rows in selection_control_profiles.values():
                for aid,profile in rows.items():
                    if aid in merged_control and merged_control[aid] != profile:
                        raise ValueError(f'conflicting Mobility control profiles for {aid}')
                    merged_control[aid]=profile
            merged_planning={}
            for rows in selection_planning_profiles.values():
                for aid,profile in rows.items():
                    if aid in merged_planning and merged_planning[aid] != profile:
                        raise ValueError(f'conflicting Mobility planning profiles for {aid}')
                    merged_planning[aid]=profile
        except Exception as exc:
            self.last_build_attempt={
                'status':'REJECTED','observed_at':observed_at,'error_type':type(exc).__name__,'error':str(exc),
                'retained_previous_runtime':bool(self.assets),'selection_errors':selection_errors,
            }
            _LOGGER.warning('Mobility reconciliation rejected due to cross-selection conflict: %s',exc)
            self._notify()
            raise

        old=(self.assets,self.snapshots,self.relationships,self._selection_asset_roles,self._selection_asset_ids,
             self._selection_relationship_ids,self._selection_control_profiles,self._selection_planning_profiles,
             self._selection_diagnostics,self._capability_diagnostics)
        try:
            for asset_id in list(self._unsubs): self._clear_asset_listener(asset_id)
            self.assets=proposed_assets
            self.relationships=proposed_relationships
            self._selection_asset_roles=selection_asset_roles
            self._selection_asset_ids=selection_asset_ids
            self._selection_relationship_ids=selection_relationship_ids
            self._selection_control_profiles=selection_control_profiles
            self._selection_planning_profiles=selection_planning_profiles
            self._selection_diagnostics=selection_diagnostics
            self._capability_diagnostics=capability_diagnostics
            self.snapshots={}
            self._health_cache={}
            for aid,asset in self.assets.items():
                self.snapshots[aid]=RuntimeSnapshot(
                    asset_id=asset.asset_id,concept_id=asset.concept_id,display_name=asset.display_name,
                    source_configuration_revision=max_cfg_by_asset.get(aid,0),build_input_revision=max_build_by_asset.get(aid,0),
                )
                await self._async_bind_asset(aid)
            self._reconcile_relationship_health()
        except Exception as exc:
            for asset_id in list(self._unsubs): self._clear_asset_listener(asset_id)
            (self.assets,self.snapshots,self.relationships,self._selection_asset_roles,self._selection_asset_ids,
             self._selection_relationship_ids,self._selection_control_profiles,self._selection_planning_profiles,
             self._selection_diagnostics,self._capability_diagnostics)=old
            for aid in list(self.assets): await self._async_bind_asset(aid)
            self.last_build_attempt={
                'status':'REJECTED','observed_at':observed_at,'error_type':type(exc).__name__,'error':str(exc),
                'retained_previous_runtime':True,'selection_errors':selection_errors,
            }
            _LOGGER.exception('Mobility handoff activation failed; previous runtime restored')
            self._notify_topology(); raise

        partial=bool(selection_errors) or any(row.get('status')=='PARTIAL' for row in selection_diagnostics.values())
        if not payloads:
            status='REMOVED'
        elif partial:
            status='PARTIAL' if prepared_rows else 'REJECTED'
        elif self.assets:
            status='ACCEPTED'
        else:
            status='REMOVED'
        max_cfg=max([row.source_configuration_revision for row in prepared_rows],default=0)
        max_build=max([row.build_input_revision for row in prepared_rows],default=0)
        self.last_build_attempt={
            'status':status,'observed_at':observed_at,'configuration_revision':max_cfg,'build_input_revision':max_build,
            'selected_input_count':len(payloads),'prepared_input_count':len(prepared_rows),'selection_error_count':len(selection_errors),
            'accepted_binding_count':len(self.bindings),'asset_count':len(self.assets),'relationship_count':len(self.relationships),
            'degraded_asset_count':sum(1 for snap in self.snapshots.values() if snap.health!='OK'),
            'selection_errors':selection_errors,
        }
        _LOGGER.info('Mobility handoff reconciled status=%s inputs=%s assets=%s bindings=%s degraded=%s',status,len(payloads),len(self.assets),len(self.bindings),self.last_build_attempt['degraded_asset_count'])
        self._notify_topology()
        return {
            'selected_input_count':len(payloads),'prepared_input_count':len(prepared_rows),'asset_count':len(self.assets),
            'accepted_binding_count':len(self.bindings),'relationship_count':len(self.relationships),
            'degraded_asset_count':self.last_build_attempt['degraded_asset_count'],'status':status,
            'selection_error_count':len(selection_errors),'atomic_domain_replace':True,'capability_isolation':True,
        }

    async def async_apply_selected_build_input(self, payload: dict[str,Any]) -> dict[str,Any]:
        """Compatibility entrypoint: reconcile one authoritative selection payload.

        The shared lifecycle uses complete-slice replacement. This method deliberately uses
        the same capability-isolated semantics instead of maintaining a second builder path.
        """
        return await self.async_replace_selected_build_inputs([payload])

    async def _async_bind_asset(self, asset_id: str) -> None:
        asset=self.assets[asset_id]
        entity_ids=[]
        for binding in asset.source_bindings.values():
            entity_ids.extend(s.entity_id for s in binding.inputs.values() if s.entity_id)
        entity_ids=sorted(set(entity_ids))
        unsubs=[]
        if entity_ids:
            @callback
            def changed(event) -> None: self._schedule_refresh(asset_id)
            unsubs.append(async_track_state_change_event(self.hass,entity_ids,changed))
        self._unsubs[asset_id]=unsubs
        self._refresh(asset_id)

    def _refresh(self, asset_id: str) -> None:
        asset=self.assets.get(asset_id); snap=self.snapshots.get(asset_id)
        if not asset or not snap: return
        before=(dict(snap.values),dict(snap.quality),snap.health,snap.health_reason,snap.source_configuration_revision,snap.build_input_revision)
        candidates: dict[str,tuple[int,Any,str]]={}
        required_missing=[]
        required_unknown=[]
        max_cfg=max((b.source_configuration_revision for b in asset.source_bindings.values()),default=0)
        max_build=max((b.build_input_revision for b in asset.source_bindings.values()),default=0)

        ordered=sorted(asset.source_bindings.values(),key=lambda b:b.source_precedence)
        for binding in ordered:
            spec=self.registry.build_spec(binding.builder_id)
            model=self.registry.builder_model(binding.builder_id)
            spec_inputs={r['input_id']:r for r in spec['candidate_requirements']['normalized_inputs']}
            for input_id,source in binding.inputs.items():
                rule=model['input_rules'].get(input_id)
                if not rule or rule.get('usage','observation')!='observation': continue
                if not source.entity_id: continue
                state=self.hass.states.get(source.entity_id)
                raw=None if state is None else state.state
                unit=source.native_unit or (state.attributes.get('unit_of_measurement') if state else None)
                normalized=normalize(rule['normalizer'],source.integration_domain,raw,unit)
                outputs=rule['outputs']; input_prec=int(rule.get('precedence',0)); total_prec=binding.source_precedence*100+input_prec
                if 'value' in normalized and len(outputs)==1:
                    normalized={outputs[0]:normalized['value']}
                for key in outputs:
                    value=normalized.get(key)
                    if value is not None:
                        old=candidates.get(key)
                        if old is None or total_prec>=old[0]: candidates[key]=(total_prec,value,source.candidate_id)
                if spec_inputs[input_id]['required']:
                    if state is None or raw in (None,'unknown','unavailable',''):
                        required_missing.append(input_id)
                    elif not any(normalized.get(k) not in (None,'unknown') for k in outputs):
                        required_unknown.append(input_id)

        snap.values={k:v[1] for k,v in sorted(candidates.items())}
        snap.quality={k:f"candidate:{v[2]}" for k,v in sorted(candidates.items())}

        # Explicit Mobility profile selection contributes only catalog-declared semantic defaults.
        # Truth precedence is data-owned by semantic_property_catalog.json; measured actuals
        # without a profile_field can never be fabricated by a profile.
        selected_profile=self._selected_profile(asset_id)
        if selected_profile:
            pid=str(selected_profile["profile_id"])
            snap.values["asset.profile_id"]=pid; snap.quality["asset.profile_id"]="mobility_domain_configuration"
            semantic_properties=(getattr(self.registry,"semantic_catalog",{}).get("properties") or {})
            for property_key,definition in semantic_properties.items():
                applicable=set(definition.get("applicable_asset_types") or [])
                if applicable and asset.concept_id not in applicable:
                    continue
                profile_field=definition.get("profile_field")
                if not profile_field:
                    continue
                value=selected_profile.get(profile_field)
                if value is None:
                    continue
                precedence=list(definition.get("truth_precedence") or [])
                if "PROFILE" not in precedence:
                    continue
                # Source values are replaced only where the catalog explicitly gives PROFILE
                # higher precedence than SOURCE. Configuration is applied afterwards and wins.
                if property_key in snap.values and "SOURCE" in precedence and precedence.index("SOURCE") < precedence.index("PROFILE"):
                    continue
                snap.values[property_key]=value
                snap.quality[property_key]=f"mobility_profile:{pid}"

        planning=self.planning_profile(asset_id)
        if planning and asset.concept_id=='vehicle' and planning.enabled and planning.ready_by is not None:
            snap.values['vehicle.ready_by']=planning.ready_by; snap.quality['vehicle.ready_by']='mobility_domain_configuration'
        # Domain-owned semantic overrides are catalog-driven and always applied after
        # source/profile facts. Special physical/manual semantics remain explicit below.
        semantic_properties=(getattr(self.registry,"semantic_catalog",{}).get("properties") or {})
        for property_key,definition in semantic_properties.items():
            precedence=list(definition.get("truth_precedence") or [])
            if "CONFIGURED" not in precedence:
                continue
            applicable=set(definition.get("applicable_asset_types") or [])
            if applicable and asset.concept_id not in applicable:
                continue
            sentinel=object()
            configured=self.configuration_value(asset_id,property_key,sentinel)
            if configured is sentinel:
                continue
            snap.values[property_key]=configured
            snap.quality[property_key]="mobility_domain_configuration"
        if not semantic_properties:
            # Unit-test/legacy fixture fallback only; production uses the catalog-driven path above.
            fallback_keys={'asset.display_name','asset.short_name','asset.owner_label','asset.location_label','asset.profile_id','vehicle.target_soc_pct','vehicle.ready_by','vehicle.present','vehicle.battery_capacity_kwh','vehicle.mobility_charge_policy'}
            for property_key in fallback_keys:
                sentinel=object(); configured=self.configuration_value(asset_id,property_key,sentinel)
                if configured is not sentinel:
                    snap.values[property_key]=configured; snap.quality[property_key]='mobility_domain_configuration'

        lifecycle=self.configuration_value(asset_id,'asset.lifecycle_status','active')
        snap.values['asset.lifecycle_status']=lifecycle; snap.quality['asset.lifecycle_status']='mobility_domain_configuration'
        if 'asset.display_name' not in snap.values:
            source_name=self._source_device_name(asset.source_device_id)
            snap.values['asset.display_name']=source_name or asset.display_name
            snap.quality['asset.display_name']='source_device_identity' if source_name else 'logical_asset_identity'
        if asset.concept_id=='vehicle':
            # Numeric configuration normalization remains explicit; the catalog owns which
            # properties are configurable, while validation owns domain constraints.
            if snap.values.get('vehicle.target_soc_pct') is not None:
                snap.values['vehicle.target_soc_pct']=float(snap.values['vehicle.target_soc_pct'])
            if snap.values.get('vehicle.battery_capacity_kwh') is not None:
                snap.values['vehicle.battery_capacity_kwh']=float(snap.values['vehicle.battery_capacity_kwh'])
            if 'manual_profile' in asset.source_bindings:
                manual_soc=self.configuration_value(asset_id,'vehicle.soc_pct',None)
                manual_energy=self.configuration_value(asset_id,'vehicle.battery_energy_kwh',None)
                if manual_soc is not None:
                    snap.values['vehicle.soc_pct']=float(manual_soc); snap.quality['vehicle.soc_pct']='mobility_manual_profile'
                if manual_energy is not None:
                    snap.values['vehicle.battery_energy_kwh']=float(manual_energy); snap.quality['vehicle.battery_energy_kwh']='mobility_manual_profile'
                capacity=snap.values.get('vehicle.battery_capacity_kwh')
                if manual_soc is None and manual_energy is not None and capacity is not None and float(capacity)>0:
                    snap.values['vehicle.soc_pct']=round(float(manual_energy)/float(capacity)*100.0,3); snap.quality['vehicle.soc_pct']='derived_from_manual_energy_capacity'
            selected=self.effective_charger_for_vehicle(asset_id)
            if selected: snap.values['vehicle.selected_charger']=selected; snap.quality['vehicle.selected_charger']='mobility_domain_configuration_or_foundation_assignment'
            selected_charger=self.effective_charger_for_vehicle(asset_id)
            charging_profile=self.effective_charging_profile(selected_charger) if selected_charger else None
            apply_vehicle_derivations(snap.values, snap.quality, charging_profile=charging_profile)
        elif asset.concept_id=='charger':
            vid=self.configured_vehicle_for_charger(asset_id)
            if vid: snap.values['charger.assigned_vehicle_id']=vid; snap.quality['charger.assigned_vehicle_id']='mobility_domain_configuration_or_foundation_assignment'
            apply_charger_derivations(snap.values, snap.quality)

        snap.source_configuration_revision=max_cfg; snap.build_input_revision=max_build
        build_required_issues=sorted({
            f"{row.get('input_id')}:{row.get('status')}"
            for row in self._capability_diagnostics
            if row.get('asset_id')==asset_id and row.get('required') is True
            and row.get('status') in {'MISSING','AMBIGUOUS','INVALID_EVIDENCE','BLOCKED_BY_REVIEW','BLOCKED_BY_TARGET_SCOPE'}
        })
        if build_required_issues:
            snap.health='DEGRADED'; snap.health_reason='required_capability_issue:' + ','.join(build_required_issues)
        elif required_missing:
            snap.health='DEGRADED'; snap.health_reason='required_observation_unavailable:' + ','.join(sorted(set(required_missing)))
        elif required_unknown:
            snap.health='DEGRADED'; snap.health_reason='required_observation_semantically_unknown:' + ','.join(sorted(set(required_unknown)))
        else:
            snap.health='OK'; snap.health_reason='canonical_observation_ready'
        previous_health=self._health_cache.get(asset_id)
        current_health=(snap.health,snap.health_reason)
        if previous_health != current_health:
            self._health_cache[asset_id]=current_health
            log=_LOGGER.info if snap.health=='OK' else _LOGGER.warning
            log('Mobility asset health asset=%s health=%s reason=%s', asset_id, snap.health, snap.health_reason)
            self._notify()
        snap.values['asset.availability_state']='disabled' if snap.values.get('asset.lifecycle_status')=='disabled' else ('available' if snap.health=='OK' else 'temporarily_unavailable')
        snap.quality['asset.availability_state']='derived_from_required_observation_health'
        snap.values[f'{asset.concept_id}.health']=snap.health; snap.quality[f'{asset.concept_id}.health']='canonical_runtime_health'
        snap.values[f'{asset.concept_id}.health_reason']=snap.health_reason; snap.quality[f'{asset.concept_id}.health_reason']='canonical_runtime_health'
        for rel in self.effective_relationships.values():
            if rel.relationship_type!='configured_assignment' or rel.health!='OK': continue
            if asset.concept_id=='vehicle' and rel.from_asset_id==asset_id:
                snap.values['vehicle.selected_charger']=rel.to_asset_id; snap.quality['vehicle.selected_charger']='configured_assignment'
            if asset.concept_id=='charger' and rel.to_asset_id==asset_id:
                snap.values['charger.assigned_vehicle_id']=rel.from_asset_id; snap.quality['charger.assigned_vehicle_id']='configured_assignment'
        self._reconcile_relationship_health()
        after=(dict(snap.values),dict(snap.quality),snap.health,snap.health_reason,snap.source_configuration_revision,snap.build_input_revision)
        if after!=before: self._notify_asset(asset_id)

    def supported_property_keys(self, asset_id: str) -> set[str]:
        """Return properties with concrete technical evidence without building diagnostics JSON."""
        keys: set[str] = set()
        for row in self._capability_diagnostics:
            if row.get("asset_id") != asset_id or row.get("status") == "UNSUPPORTED":
                continue
            keys.update(str(key) for key in row.get("normalized_properties") or [])
        asset = self.assets.get(asset_id)
        if asset is not None:
            for binding in asset.source_bindings.values():
                model = self.registry.builder_model(binding.builder_id)
                for input_id in binding.inputs:
                    rule = (model.get("input_rules") or {}).get(input_id) or {}
                    keys.update(str(key) for key in rule.get("outputs") or [])
        return keys

    def _live_capability_diagnostics(self) -> list[dict[str,Any]]:
        rows=[]
        for base in self._capability_diagnostics:
            row=dict(base)
            status=row.get('status')
            if status=='MATCHED':
                asset_id=row.get('asset_id'); candidate_id=row.get('candidate_id'); entity_id=row.get('entity_id')
                snap=self.snapshots.get(asset_id)
                if entity_id:
                    state=self.hass.states.get(entity_id)
                    if state is None or state.state in (None,'unknown','unavailable',''):
                        row['status']='STALE'
                        row['reason']='matched source is currently unavailable/unknown'
                    else:
                        props=row.get('normalized_properties') or []
                        normalized=[key for key in props if snap is not None and snap.quality.get(key)==f'candidate:{candidate_id}']
                        if normalized:
                            row['status']='NORMALIZED'
                            row['reason']='runtime value normalized from matched source'
                            row['normalized_properties']=normalized
                        elif props:
                            row['status']='INVALID_VALUE'
                            row['reason']='source is available but did not yield a canonical normalized value'
                else:
                    props=row.get('normalized_properties') or []
                    normalized=[key for key in props if snap is not None and snap.quality.get(key)==f'candidate:{candidate_id}']
                    if normalized:
                        row['status']='NORMALIZED'; row['reason']='runtime value normalized from matched source'; row['normalized_properties']=normalized
            rows.append(row)
        return rows

    def diagnostics_snapshot(self) -> dict[str,Any]:
        live_caps=self._live_capability_diagnostics()
        caps_by_asset: dict[str,list[dict[str,Any]]]={}
        for row in live_caps:
            caps_by_asset.setdefault(str(row.get('asset_id')),[]).append(row)
        selections=[]
        for selection_id in sorted(self._selection_asset_roles):
            base=dict(self._selection_diagnostics.get(selection_id) or {'selection_id':selection_id})
            pairs=self._selection_asset_roles.get(selection_id,set())
            base['asset_roles']=[{'asset_id':a,'source_role':r} for a,r in sorted(pairs)]
            selections.append(base)
        assets=[]
        for aid,asset in sorted(self.assets.items()):
            snap=self.snapshots.get(aid)
            sources=[]
            integrations=set()
            for role,binding in sorted(asset.source_bindings.items()):
                integrations.add(binding.integration_domain)
                sources.append({
                    'source_role':role,'builder_id':binding.builder_id,'integration_domain':binding.integration_domain,
                    'binding_id':binding.binding_id,'input_count':len(binding.inputs),
                    'inputs':[{
                        'input_id':iid,'candidate_id':src.candidate_id,'source_kind':src.source_kind,
                        'entity_id':src.entity_id,'device_id':src.device_id,'raw_capability_id':src.raw_capability_id,
                        'technical_capability':src.technical_capability,'target_scope':src.target_scope,
                    } for iid,src in sorted(binding.inputs.items())],
                })
            cap_rows=sorted(caps_by_asset.get(aid,[]),key=lambda x:(str(x.get('input_id')),str(x.get('status'))))
            status_counts={}
            for row in cap_rows: status_counts[row.get('status')]=status_counts.get(row.get('status'),0)+1
            assets.append({
                'asset_id':aid,'concept_id':asset.concept_id,'display_name':None if snap is None else snap.values.get('asset.display_name',asset.display_name),
                'integrations':sorted(integrations or {str(r.get('integration_domain')) for r in cap_rows if r.get('integration_domain')}),
                'primary_source':self.primary_source_metadata(aid),
                'profile_id':self.configuration_value(aid,'asset.profile_id',None),
                'health':None if snap is None else snap.health,'health_reason':None if snap is None else snap.health_reason,
                'property_count':0 if snap is None else len(snap.values),'source_bindings':sources,
                'capability_status_counts':status_counts,'capabilities':cap_rows,
            })
        selection_status_counts={}
        for row in selections: selection_status_counts[row.get('status')]=selection_status_counts.get(row.get('status'),0)+1
        capability_status_counts={}
        for row in live_caps: capability_status_counts[row.get('status')]=capability_status_counts.get(row.get('status'),0)+1
        return {
            'last_build_attempt':dict(self.last_build_attempt),'selection_count':len(self._selection_asset_roles),
            'accepted_binding_count':len(self.bindings),'relationship_count':len(self.effective_relationships),
            'control_profile_count':len(self.control_profiles),'planning_profile_count':len(self.planning_profiles),
            'listener_asset_count':len(self._unsubs),
            'summary':{
                'asset_count':len(self.assets),'healthy_asset_count':sum(1 for s in self.snapshots.values() if s.health=='OK'),
                'degraded_asset_count':sum(1 for s in self.snapshots.values() if s.health!='OK'),
                'selection_status_counts':selection_status_counts,'capability_status_counts':capability_status_counts,
            },
            'selections':selections,'assets':assets,
        }

    def _reconcile_relationship_health(self) -> None:
        updated={}
        for rid,rel in self.relationships.items():
            health='OK' if rel.from_asset_id in self.assets and rel.to_asset_id in self.assets else 'PENDING'
            updated[rid]=RelationshipSnapshot(rel.relationship_id,rel.relationship_type,rel.from_asset_id,rel.to_asset_id,rel.selection_id,health,rel.evidence_source)
        self.relationships=updated
