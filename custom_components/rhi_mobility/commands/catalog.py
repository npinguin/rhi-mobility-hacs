from __future__ import annotations
from typing import Any
from .models import CommandDescriptor, RequestedPowerDescriptor
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
        return max(candidates,key=lambda x:x[0])[1] if candidates else None

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
        return -1

    def _command_readiness(self,asset_id,key,source,snap):
        if source.availability=='missing': return False,'source_missing'
        if source.availability=='temporarily_unavailable': return False,'source_temporarily_unavailable'
        values=snap.values if snap else {}
        if values.get('asset.lifecycle_status') == 'disabled' and key != 'charger.command.stop':
            return False,'lifecycle_disabled'
        if key=='charger.command.start':
            op=values.get('charger.operating_state'); conn=values.get('charger.connection_state')
            if op=='fault' or conn=='fault': return False,'charger_fault'
            # Full EVSE must have an attached asset. Utility surfaces have no connection fact.
            if 'charger.connection_state' in values and conn!='asset_connected': return False,'vehicle_not_connected'
            if op in (None,'unknown'): return False,'charger_state_unknown'
        elif key=='charger.command.stop':
            # Protective/idempotent STOP remains available even when connection telemetry disappeared.
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
