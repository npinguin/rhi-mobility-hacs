from __future__ import annotations
import asyncio
import logging
from collections import OrderedDict
from dataclasses import replace
from typing import Any, Callable
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from .models import ExecutionRequest, ExecutionResult

_LOGGER = logging.getLogger(__name__)

class MobilityCommandExecutor:
    """KISS Mobility execution owner: no queue, no retry, no restart replay."""
    def __init__(self,hass: HomeAssistant,manager) -> None:
        self.hass=hass; self.manager=manager
        self._guard=asyncio.Lock(); self._active:set[tuple[str,str]]=set()
        self._unknown:dict[tuple[str,str],ExecutionRequest]={}
        self._dedup:OrderedDict[tuple[str,str,str],tuple[str,ExecutionResult]]=OrderedDict()
        self.last_results:dict[tuple[str,str],ExecutionResult]={}
        self.listeners:list[Callable[[],None]]=[]
        subscribe=getattr(manager,'add_runtime_listener',manager.add_listener)
        self._manager_unsub=subscribe(self._manager_changed)

    def add_listener(self,cb):
        self.listeners.append(cb)
        def unsub():
            if cb in self.listeners:self.listeners.remove(cb)
        return unsub

    def shutdown(self):
        self._manager_unsub(); self.listeners.clear(); self._active.clear(); self._unknown.clear()

    def _notify(self):
        for cb in tuple(self.listeners): cb()

    @callback
    def _manager_changed(self):
        self.hass.async_create_task(self.async_reconcile_unknowns())
        self._notify()

    def is_blocked(self,producer_id: str,conflict_family: str) -> bool:
        return (producer_id,conflict_family) in self._unknown

    def is_active(self,producer_id: str,conflict_family: str) -> bool:
        return (producer_id,conflict_family) in self._active

    async def async_rearm(self,producer_id: str,conflict_family: str) -> bool:
        scope=(producer_id,conflict_family)
        async with self._guard:
            existed=self._unknown.pop(scope,None) is not None
        if existed:self._notify()
        return existed

    async def async_reconcile_unknowns(self) -> None:
        cleared=[]
        async with self._guard:
            for scope,request in list(self._unknown.items()):
                if self._confirmation_matches(request.confirmation):
                    self._unknown.pop(scope,None); cleared.append((scope,request))
                    prior=self.last_results.get(scope)
                    if prior:
                        self.last_results[scope]=replace(prior,result='SUCCEEDED_AFTER_DELAY',reason='late_readback_converged',state_after=self._confirmation_state(request.confirmation))
        if cleared:self._notify()

    async def async_execute(self,request: ExecutionRequest) -> ExecutionResult:
        scope=request.scope; dkey=(scope[0],scope[1],request.request_id)
        _LOGGER.debug('Mobility execution request asset=%s operation=%s request_id=%s scope=%s|%s protective=%s', request.asset_id, request.operation_key, request.request_id, scope[0], scope[1], request.protective)
        async with self._guard:
            previous=self._dedup.get(dkey)
            if previous:
                fingerprint,result=previous
                if fingerprint==request.fingerprint:return result
                return self._result(request,'BLOCKED','idempotency_collision',False)
            if scope in self._active:
                result=self._result(request,'BLOCKED','execution_in_progress',False); self._remember(request,result); return result
            if scope in self._unknown and not request.protective:
                result=self._result(request,'BLOCKED','rearm_required_after_unknown',False); self._remember(request,result); return result
            if request.protective and scope in self._unknown:
                self._unknown.pop(scope,None)
            if request.confirmation.get('mode')!='service_acceptance_only' and self._confirmation_matches(request.confirmation):
                result=self._result(request,'ALREADY_CONVERGED','readback_already_matches',False); self._remember(request,result); return result
            self._active.add(scope)

        before=self._confirmation_state(request.confirmation); attempted=False
        try:
            attempted=True
            await self.hass.services.async_call(
                request.service_domain,request.service_action,request.service_data,
                blocking=True,target=request.target,
            )
            mode=request.confirmation.get('mode','service_acceptance_only')
            if mode=='service_acceptance_only':
                result=self._result(request,'ACCEPTED_UNCONFIRMED','service_call_accepted_no_readback_contract',True,before,before)
            else:
                timeout=float(request.confirmation.get('timeout_s',30.0))
                confirmed=await self._wait_confirmation(request.confirmation,timeout)
                after=self._confirmation_state(request.confirmation)
                if confirmed:
                    result=self._result(request,'SUCCEEDED','readback_converged',True,before,after)
                else:
                    result=self._result(request,'EXECUTION_UNKNOWN','readback_timeout_no_retry',True,before,after)
        except Exception as exc:
            result=self._result(request,'EXECUTION_UNKNOWN',f'service_call_outcome_unknown:{type(exc).__name__}',attempted,before,self._confirmation_state(request.confirmation))

        async with self._guard:
            self._active.discard(scope)
            if result.result=='EXECUTION_UNKNOWN': self._unknown[scope]=request
            elif request.protective: self._unknown.pop(scope,None)
            self._remember(request,result)
        log=_LOGGER.warning if result.result in {'EXECUTION_UNKNOWN','BLOCKED'} else _LOGGER.info
        log('Mobility execution result asset=%s operation=%s request_id=%s result=%s reason=%s attempted=%s', request.asset_id, request.operation_key, request.request_id, result.result, result.reason, result.write_attempted)
        self._notify(); return result

    async def _wait_confirmation(self,confirmation: dict[str,Any],timeout: float) -> bool:
        if self._confirmation_matches(confirmation): return True
        loop=asyncio.get_running_loop(); fut=loop.create_future(); unsub=None
        mode=confirmation.get('mode')
        if mode=='entity_state':
            entity_id=confirmation.get('entity_id')
            @callback
            def changed(event):
                if not fut.done() and self._confirmation_matches(confirmation): fut.set_result(True)
            unsub=async_track_state_change_event(self.hass,[entity_id],changed)
        elif mode=='runtime_property':
            def changed():
                if not fut.done() and self._confirmation_matches(confirmation): fut.set_result(True)
            asset_id=confirmation.get('asset_id')
            unsub=self.manager.add_asset_listener(asset_id,changed) if asset_id else self.manager.add_runtime_listener(changed)
        else:
            return False
        try:
            if self._confirmation_matches(confirmation): return True
            await asyncio.wait_for(fut,timeout=timeout); return True
        except asyncio.TimeoutError:
            return False
        finally:
            if unsub:unsub()

    def _confirmation_state(self,confirmation: dict[str,Any]):
        mode=confirmation.get('mode')
        if mode=='entity_state':
            state=self.hass.states.get(confirmation.get('entity_id')); return None if state is None else state.state
        if mode=='runtime_property':
            asset_id=confirmation.get('asset_id'); snap=self.manager.snapshots.get(asset_id) if asset_id else None
            return None if snap is None else snap.values.get(confirmation.get('property_key'))
        return None

    def _confirmation_matches(self,confirmation: dict[str,Any]) -> bool:
        mode=confirmation.get('mode')
        if mode=='entity_state':
            actual=self._confirmation_state(confirmation); expected=confirmation.get('expected')
            if actual in (None,'unknown','unavailable',''):return False
            try:return abs(float(actual)-float(expected))<=float(confirmation.get('tolerance',0.0))
            except (TypeError,ValueError):return str(actual).strip().lower()==str(expected).strip().lower()
        if mode=='runtime_property':
            actual=self._confirmation_state(confirmation)
            return actual in set(confirmation.get('accepted_values',[]))
        return False

    def _remember(self,request: ExecutionRequest,result: ExecutionResult) -> None:
        key=(request.scope[0],request.scope[1],request.request_id)
        self._dedup[key]=(request.fingerprint,result); self._dedup.move_to_end(key)
        while len(self._dedup)>128:self._dedup.popitem(last=False)
        self.last_results[request.scope]=result

    @staticmethod
    def _result(request,result,reason,attempted,before=None,after=None):
        return ExecutionResult(request.request_id,request.asset_id,request.operation_key,result,reason,attempted,request.confirmation.get('mode','service_acceptance_only'),before,after)

    def snapshot(self) -> dict[str,Any]:
        return {
            'active_scopes':[f'{a}|{b}' for a,b in sorted(self._active)],
            'blocked_unknown_scopes':[f'{a}|{b}' for a,b in sorted(self._unknown)],
            'last_results':[{
                'producer_id':scope[0],'conflict_family':scope[1],'request_id':r.request_id,'asset_id':r.asset_id,
                'operation_key':r.operation_key,'result':r.result,'reason':r.reason,'write_attempted':r.write_attempted,
                'confirmation_mode':r.confirmation_mode,'state_before':r.state_before,'state_after':r.state_after,
            } for scope,r in sorted(self.last_results.items())],
            'queueing':'none','automatic_retry':False,'restart_replay':False,
        }
