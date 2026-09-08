from __future__ import annotations
from dataclasses import replace
from typing import Any, Callable
from uuid import uuid4
from .catalog import MobilityControlCatalog
from .executor import MobilityCommandExecutor
from .resolution import command_request, requested_power_request
from .models import ExecutionRequest

class MobilityControlController:
    def __init__(self,hass,manager,registry) -> None:
        self.hass=hass; self.manager=manager; self.registry=registry
        self.catalog=MobilityControlCatalog(hass,manager,registry)
        self.executor=MobilityCommandExecutor(hass,manager)
        self.listeners:list[Callable[[],None]]=[]
        self.pending_intents:dict[str,float]={}; self.unresolved_intents:dict[str,float]={}
        # Controller state changes only on topology or command/executor state, not on every telemetry update.
        # Readback entities already subscribe to their affected Mobility asset directly.
        self._unsub_topology=manager.add_topology_listener(self._changed); self._unsub_exec=self.executor.add_listener(self._changed)

    def shutdown(self):
        self._unsub_topology(); self._unsub_exec(); self.executor.shutdown(); self.listeners.clear()

    def add_listener(self,cb):
        self.listeners.append(cb)
        def unsub():
            if cb in self.listeners:self.listeners.remove(cb)
        return unsub

    def _changed(self):
        self._reconcile_intents()
        for cb in tuple(self.listeners):cb()

    def command_descriptors(self):
        rows=self.catalog.command_descriptors()
        out={}
        for cid,row in rows.items():
            if self.executor.is_active(row.source.producer_id,row.conflict_family):
                row=replace(row,execution_allowed=False,blocked_reason='execution_in_progress')
            elif self.executor.is_blocked(row.source.producer_id,row.conflict_family) and not row.protective:
                row=replace(row,execution_allowed=False,blocked_reason='rearm_required_after_unknown')
            out[cid]=row
        return out

    def requested_power_descriptor(self,asset_id):
        return self.catalog.requested_power_descriptor(asset_id)

    def requested_power_readback(self,asset_id):
        return self.catalog.requested_power_readback(asset_id)

    def requested_current_readback(self,asset_id: str) -> float | None:
        desc=self.requested_power_descriptor(asset_id)
        if desc is None or desc.mode!='current_limit' or not desc.source.entity_id:
            return None
        state=self.hass.states.get(desc.source.entity_id)
        if state is None or state.state in ('unknown','unavailable',''):
            return None
        from ..runtime.normalization import current_a
        unit=desc.source.native_unit or state.attributes.get('unit_of_measurement') or 'A'
        return current_a(state.state,unit)

    async def async_execute_command(self,asset_id: str,command_key: str,request_id: str | None=None):
        cid=f'{asset_id}:{command_key}'; desc=self.command_descriptors().get(cid)
        if desc is None: raise ValueError(f'unsupported command: {cid}')
        if not desc.execution_allowed: return {'result':'BLOCKED','reason':desc.blocked_reason,'command_id':cid}
        request=command_request(desc,request_id or f'mobility_{uuid4().hex}')
        confirmation=dict(request.confirmation)
        if confirmation.get('mode')=='runtime_property': confirmation['asset_id']=asset_id
        request=replace(request,confirmation=confirmation)
        result=await self.executor.async_execute(request)
        return result.__dict__

    async def async_set_requested_power(self,asset_id: str,power_kw: float,request_id: str | None=None):
        desc=self.requested_power_descriptor(asset_id)
        if desc is None: return {'result':'BLOCKED','reason':'requested_power_write_not_ready','asset_id':asset_id}
        request,accepted=requested_power_request(desc,power_kw,request_id or f'setpoint_{uuid4().hex}')
        self.pending_intents[asset_id]=accepted; self._changed()
        result=await self.executor.async_execute(request)
        self.pending_intents.pop(asset_id,None)
        if result.result=='EXECUTION_UNKNOWN': self.unresolved_intents[asset_id]=accepted
        elif result.result in {'SUCCEEDED','ALREADY_CONVERGED','SUCCEEDED_AFTER_DELAY'}: self.unresolved_intents.pop(asset_id,None)
        self._changed()
        return {**result.__dict__,'accepted_requested_power_kw':accepted,'actual_readback_power_kw':self.requested_power_readback(asset_id)}

    async def async_set_requested_current(self,asset_id: str,current_a_value: float,request_id: str | None=None):
        desc=self.requested_power_descriptor(asset_id)
        if desc is None or desc.mode!='current_limit':
            return {'result':'BLOCKED','reason':'requested_current_write_not_ready','asset_id':asset_id}
        if desc.effective_voltage_v is None or desc.effective_phase_count is None or desc.min_current_a is None or desc.max_current_a is None or desc.current_step_a is None:
            return {'result':'BLOCKED','reason':'current_conversion_profile_incomplete','asset_id':asset_id}
        requested=float(current_a_value)
        if requested < desc.min_current_a-1e-9 or requested > desc.max_current_a+1e-9:
            return {'result':'BLOCKED','reason':'requested_current_out_of_range','asset_id':asset_id,'min_current_a':desc.min_current_a,'max_current_a':desc.max_current_a}
        steps=round((requested-desc.min_current_a)/desc.current_step_a)
        accepted=desc.min_current_a+steps*desc.current_step_a
        accepted=max(desc.min_current_a,min(desc.max_current_a,accepted))
        power_kw=accepted*desc.effective_voltage_v*desc.effective_phase_count/1000.0
        result=await self.async_set_requested_power(asset_id,power_kw,request_id)
        return {**result,'accepted_requested_current_a':round(accepted,3),'actual_readback_current_a':self.requested_current_readback(asset_id)}


    def vehicle_charge_mode_source(self,asset_id: str):
        asset=self.manager.assets.get(asset_id)
        if asset is None or asset.concept_id!='vehicle': return None
        candidates=[]
        for binding in asset.source_bindings.values():
            source=binding.inputs.get('vehicle_charge_mode_write')
            if source is not None and source.entity_id: candidates.append((binding.source_precedence,source))
        return max(candidates,key=lambda x:x[0])[1] if candidates else None

    def vehicle_charge_mode_readback(self,asset_id: str) -> str | None:
        source=self.vehicle_charge_mode_source(asset_id)
        if source is None or not source.entity_id: return None
        state=self.hass.states.get(source.entity_id)
        if state is None or state.state in ('unknown','unavailable',''): return None
        return str(state.state)

    def vehicle_charge_mode_options(self,asset_id: str) -> list[str]:
        source=self.vehicle_charge_mode_source(asset_id)
        if source is None or not source.entity_id: return []
        state=self.hass.states.get(source.entity_id)
        raw=[] if state is None else state.attributes.get('options',[])
        return [str(x) for x in raw] if isinstance(raw,(list,tuple)) else []

    async def async_set_vehicle_charge_mode(self,asset_id: str,value: str,request_id: str | None=None):
        source=self.vehicle_charge_mode_source(asset_id)
        if source is None or not source.entity_id:
            return {'result':'BLOCKED','reason':'vehicle_charge_mode_write_not_ready','asset_id':asset_id}
        domain=source.entity_id.split('.',1)[0]
        if domain not in {'select','input_select'}:
            return {'result':'BLOCKED','reason':'vehicle_charge_mode_surface_not_select','asset_id':asset_id}
        option=str(value).strip()
        if not option: return {'result':'BLOCKED','reason':'vehicle_charge_mode_empty','asset_id':asset_id}
        options=self.vehicle_charge_mode_options(asset_id)
        if options and option not in options:
            return {'result':'BLOCKED','reason':'vehicle_charge_mode_invalid_option','asset_id':asset_id,'options':options}
        request=ExecutionRequest(
            request_id=request_id or f'charge_mode_{uuid4().hex}',asset_id=asset_id,operation_key='vehicle.charge_mode',
            producer_id=source.producer_id,conflict_family='vehicle_physical',service_domain=domain,service_action='select_option',
            target={'entity_id':source.entity_id},service_data={'option':option},
            confirmation={'mode':'entity_state','entity_id':source.entity_id,'expected':option,'tolerance':0.0,'timeout_s':15.0},
            protective=False,context={'candidate_id':source.candidate_id,'write_kind':'vehicle_charge_mode'},
        )
        result=await self.executor.async_execute(request)
        return {**result.__dict__,'actual_readback':self.vehicle_charge_mode_readback(asset_id)}

    async def async_rearm(self,asset_id: str,conflict_family: str):
        asset=self.manager.assets.get(asset_id)
        if asset is None:return False
        producers={s.producer_id for b in asset.source_bindings.values() for s in b.inputs.values()}
        changed=False
        for producer in producers: changed=await self.executor.async_rearm(producer,conflict_family) or changed
        return changed

    def requested_power_status(self,asset_id: str) -> dict[str,Any]:
        return {
            'actual_readback_power_kw':self.requested_power_readback(asset_id),
            'pending_intent_power_kw':self.pending_intents.get(asset_id),
            'unresolved_intent_power_kw':self.unresolved_intents.get(asset_id),
            'value_semantics':'actual_readback_by_default',
        }

    def _reconcile_intents(self):
        for asset_id,value in list(self.unresolved_intents.items()):
            actual=self.requested_power_readback(asset_id); desc=self.requested_power_descriptor(asset_id)
            if actual is not None and desc is not None and abs(actual-value)<=max(0.02,desc.step_power_kw/3):
                self.unresolved_intents.pop(asset_id,None)
