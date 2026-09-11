from __future__ import annotations
from typing import Any
from .models import CommandDescriptor, RequestedPowerDescriptor
from ..models.contracts import SourceRef
from ..runtime.normalization import current_a, power_kw

class MobilityControlCatalog:
    def __init__(self,hass,manager,registry) -> None:
        self.hass=hass; self.manager=manager; self.registry=registry

    def _source_for_rule(self, asset, rule: dict[str,Any]):
        input_id=rule['input_id']
        candidates=[]
        for binding in asset.source_bindings.values():
            source=binding.inputs.get(input_id)
            if source is not None: candidates.append((binding.source_precedence,source))
        if candidates:
            return max(candidates,key=lambda x:x[0])[1]
        return self._attributed_global_service_source(asset,input_id)

    def _vehicle_resource_id(self,asset) -> str | None:
        """Recover an integration resource id only from an already accepted vehicle source.

        mbapi2020 entity unique IDs are VIN-prefixed. This is not semantic discovery: the
        vehicle object already exists through AcceptedSourceBinding and the prefix is used
        only as the integration's required command resource id.
        """
        if asset.source_integration_domain!='mbapi2020':
            return None
        for binding in asset.source_bindings.values():
            for source in binding.inputs.values():
                unique_id=source.identity.get('unique_id') if isinstance(source.identity,dict) else None
                if not isinstance(unique_id,str) or '_' not in unique_id:
                    continue
                prefix=unique_id.split('_',1)[0].strip()
                if len(prefix)>=10:
                    return prefix
        return None

    @staticmethod
    def _published_service_name(row: dict[str,Any]) -> str | None:
        match=row.get('published_match') or {}
        values={
            str(p.get('value')) for p in (match.get('all_of') or [])
            if isinstance(p,dict) and p.get('field')=='source_identity.service_name' and p.get('operator')=='equals' and p.get('value')
        }
        return next(iter(values)) if len(values)==1 else None

    def _attributed_global_service_source(self,asset,input_id: str) -> SourceRef | None:
        """Bind a Foundation-proven config-entry service to one already proven vehicle.

        Foundation correctly publishes integration-global service candidates as
        config-entry scoped. Such a surface may support an existing vehicle but may never
        create one. Attribution is therefore allowed only when the current Mobility
        selection contains exactly one accepted vehicle for that integration; otherwise
        it remains fail-closed. The original Foundation candidate id and published match
        are retained as provenance.
        """
        if asset.concept_id!='vehicle' or not asset.source_device_id or not asset.source_integration_domain:
            return None
        peers=[a for a in self.manager.assets.values() if a.concept_id=='vehicle' and a.source_integration_domain==asset.source_integration_domain]
        if len(peers)!=1 or peers[0].asset_id!=asset.asset_id:
            return None
        rows=[]
        for row in getattr(self.manager,'_capability_diagnostics',()):
            if row.get('integration_domain')!=asset.source_integration_domain or row.get('input_id')!=input_id:
                continue
            if row.get('source_kind')!='service' or row.get('status') not in {'BLOCKED_BY_TARGET_SCOPE','BLOCKED_BY_REVIEW'}:
                continue
            service_name=self._published_service_name(row)
            if service_name:
                rows.append((row,service_name))
        unique={(str(r.get('candidate_id')),name) for r,name in rows if r.get('candidate_id')}
        if len(unique)!=1:
            return None
        row,service_name=rows[0]
        services=getattr(self.hass,'services',None)
        has_service=getattr(services,'has_service',None)
        if callable(has_service) and not has_service(asset.source_integration_domain,service_name):
            return None
        resource_id=self._vehicle_resource_id(asset)
        identity={
            'source_kind':'service',
            'integration_domain':asset.source_integration_domain,
            'config_entry_id':asset.source_config_entry_id,
            'service_domain':asset.source_integration_domain,
            'service_name':service_name,
            'target_scope':'device',
            'target':{'device_registry_id':asset.source_device_id},
            'origin_target_scope':'config_entry',
            'command_binding_basis':'foundation_global_service_plus_accepted_vehicle_binding',
        }
        if resource_id:
            identity['resource_id']=resource_id
        if asset.source_integration_domain=='mbapi2020' and service_name=='doors_unlock':
            identity['requires_security_pin']=True
        return SourceRef(
            candidate_id=str(row['candidate_id']),source_kind='service',
            integration_domain=asset.source_integration_domain,technical_capability='service_command_surface',
            writable=True,identity=identity,raw_capability_id=str(row.get('raw_capability_id') or input_id),
            published_match=dict(row.get('published_match') or {}),technical_match_confidence='accepted_global_service_attributed_to_single_vehicle',
            availability='available',
        )

    def command_descriptors(self) -> dict[str,CommandDescriptor]:
        out={}
        for asset_id,asset in self.manager.assets.items():
            snap=self.manager.snapshots.get(asset_id)
            for binding in asset.source_bindings.values():
                model=self.registry.builder_model(binding.builder_id)
                for key,rule in model.get('command_rules',{}).items():
                    source=self._source_for_rule(asset,rule)
                    if source is None: continue
                    allowed,reason=self._command_readiness(asset_id,key,source,snap)
                    cid=f'{asset_id}:{key}'
                    row=CommandDescriptor(
                        command_id=cid,asset_id=asset_id,command_key=key,source=source,
                        conflict_family=rule['conflict_family'],confirmation=dict(rule['confirmation']),
                        protective=bool(rule.get('protective',False)),placement=str(rule.get('placement','')),
                        supported=True,execution_allowed=allowed,blocked_reason=reason,
                    )
                    previous=out.get(cid)
                    if previous is None or binding.source_precedence>=self._descriptor_precedence(asset,previous): out[cid]=row
        return out

    def _descriptor_precedence(self,asset,descriptor) -> int:
        for binding in asset.source_bindings.values():
            if descriptor.source in binding.inputs.values(): return binding.source_precedence
        if descriptor.source.identity.get('command_binding_basis'):
            return min((b.source_precedence for b in asset.source_bindings.values()),default=0)-1
        return -1

    def _command_readiness(self,asset_id,key,source,snap):
        if source.availability=='missing': return False,'source_missing'
        if source.availability=='temporarily_unavailable': return False,'source_temporarily_unavailable'
        if source.identity.get('requires_security_pin'):
            return False,'integration_security_pin_required'
        values=snap.values if snap else {}
        if values.get('asset.lifecycle_status') == 'disabled' and key != 'charger.command.stop':
            return False,'lifecycle_disabled'
        if key=='charger.command.start':
            op=values.get('charger.operating_state'); conn=values.get('charger.connection_state')
            if op=='fault' or conn=='fault': return False,'charger_fault'
            if 'charger.connection_state' in values and conn!='asset_connected': return False,'vehicle_not_connected'
            if op in (None,'unknown'): return False,'charger_state_unknown'
        elif key=='charger.command.stop':
            return True,'ready_protective_stop'
        elif key.startswith('vehicle.command.') and snap and snap.health!='OK':
            return False,'vehicle_runtime_not_ready'
        return True,'ready'

    def requested_power_descriptor(self,asset_id: str) -> RequestedPowerDescriptor | None:
        asset=self.manager.assets.get(asset_id)
        if asset is None or asset.concept_id!='charger': return None
        direct=None; current=None
        for binding in sorted(asset.source_bindings.values(),key=lambda b:b.source_precedence,reverse=True):
            direct=direct or binding.inputs.get('charger_power_limit_write')
            current=current or binding.inputs.get('charger_current_limit_write')
        if direct and direct.entity_id:
            state=self.hass.states.get(direct.entity_id)
            unit=direct.native_unit or (state.attributes.get('unit_of_measurement') if state else None)
            mn=power_kw(state.attributes.get('min'),unit) if state else None
            mx=power_kw(state.attributes.get('max'),unit) if state else None
            st=power_kw(state.attributes.get('step'),unit) if state else None
            if mn is not None and mx is not None and st and st>0:
                return RequestedPowerDescriptor(asset_id,direct,'direct_power',mn,mx,st)
        if current and current.entity_id:
            profile=self.manager.effective_charging_profile(asset_id)
            if profile is None: return None
            state=self.hass.states.get(current.entity_id)
            unit=current.native_unit or (state.attributes.get('unit_of_measurement') if state else 'A')
            attr_min=current_a(state.attributes.get('min'),unit) if state else None
            attr_max=current_a(state.attributes.get('max'),unit) if state else None
            attr_step=current_a(state.attributes.get('step'),unit) if state else None
            min_a=max(profile['min_current_a'],attr_min) if attr_min is not None else profile['min_current_a']
            max_a=min(profile['max_current_a'],attr_max) if attr_max is not None else profile['max_current_a']
            step_a=max(profile['current_step_a'],attr_step) if attr_step is not None else profile['current_step_a']
            if max_a<min_a or step_a<=0: return None
            v=profile['nominal_voltage_v']; phases=int(profile['phase_count'])
            return RequestedPowerDescriptor(
                asset_id,current,'current_limit',min_a*v*phases/1000.0,max_a*v*phases/1000.0,
                step_a*v*phases/1000.0,v,phases,min_a,max_a,step_a,
            )
        return None

    def requested_power_readback(self,asset_id: str) -> float | None:
        desc=self.requested_power_descriptor(asset_id)
        if desc is None or not desc.source.entity_id: return None
        state=self.hass.states.get(desc.source.entity_id)
        if state is None or state.state in ('unknown','unavailable',''): return None
        unit=desc.source.native_unit or state.attributes.get('unit_of_measurement')
        if desc.mode=='direct_power': return power_kw(state.state,unit)
        amps=current_a(state.state,unit or 'A')
        if amps is None or desc.effective_voltage_v is None or desc.effective_phase_count is None: return None
        return round(amps*desc.effective_voltage_v*desc.effective_phase_count/1000.0,3)
