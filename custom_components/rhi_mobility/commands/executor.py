from __future__ import annotations
from copy import deepcopy
import asyncio
import logging
from collections import OrderedDict
from datetime import datetime, timezone
from dataclasses import replace
from typing import Any, Callable
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from .models import CommandLifecycle, CommandLifecycleStage, ExecutionRequest, ExecutionResult

_LOGGER = logging.getLogger(__name__)


class MobilityCommandExecutor:
    """KISS Mobility execution owner: no queue, no retry, no restart replay."""
    def __init__(self,hass: HomeAssistant,manager) -> None:
        self.hass=hass; self.manager=manager
        self._guard=asyncio.Lock(); self._active:set[tuple[str,str]]=set()
        self._unknown:dict[tuple[str,str],ExecutionRequest]={}
        self._dedup:OrderedDict[tuple[str,str,str],tuple[str,ExecutionResult]]=OrderedDict()
        self.last_results:dict[tuple[str,str],ExecutionResult]={}
        # Timestamp is command-result evidence, not a snapshot/telemetry time.
        self.result_observed_at:dict[tuple[str,str],str]={}
        self.listeners:list[Callable[[],None]]=[]
        self._reconcile_scheduled=False
        # Persist the physical-dispatch guard before invoking Home Assistant.
        # A crash/restart may forget in-memory readback, never an admitted write.
        from homeassistant.helpers.storage import Store
        self._guard_store = Store(hass, 1, "rhi_mobility_command_execution_guard")
        self._durability_ready = False
        self._persisted_seen:OrderedDict[tuple[str,str,str],str]=OrderedDict()
        self._persisted_history:OrderedDict[tuple[str,str],dict[str,Any]]=OrderedDict()
        self._durable_pending:set[tuple[str,str]]=set()
        self._restart_hold:set[tuple[str,str]]=set()
        subscribe=getattr(manager,'add_runtime_listener',manager.add_listener)
        self._manager_unsub=subscribe(self._manager_changed)

    async def async_restore_execution(self) -> None:
        """Load immutable request fingerprints and unfinished physical scopes.

        A pending pre-dispatch marker is deliberately NOT replayed. The exact
        confirmation context is not serialised: explicit operator rearm is
        required after restart instead of guessing that a physical write failed.
        """
        try:
            raw = await self._guard_store.async_load()
            if raw is None:
                raw = {}
            if not isinstance(raw, dict):
                raise ValueError("invalid_durable_guard")
            seen = raw.get("seen", [])
            pending = raw.get("pending", [])
            history = raw.get("last_results", [])
            if not isinstance(seen, list) or not isinstance(pending, list) or not isinstance(history, list):
                raise ValueError("invalid_durable_guard")
            for row in seen[-128:]:
                if not isinstance(row, dict):
                    raise ValueError("invalid_durable_request")
                key = (row.get("producer_id"), row.get("conflict_family"), row.get("request_id"))
                fingerprint = row.get("fingerprint")
                if not all(isinstance(part, str) and part for part in (*key, fingerprint)):
                    raise ValueError("invalid_durable_request")
                self._persisted_seen[key] = fingerprint
            for row in pending:
                if not isinstance(row, dict):
                    raise ValueError("invalid_durable_scope")
                key = (row.get("producer_id"), row.get("conflict_family"))
                if not all(isinstance(part, str) and part for part in key):
                    raise ValueError("invalid_durable_scope")
                self._durable_pending.add(key)
            for row in history[-128:]:
                if not isinstance(row, dict):
                    raise ValueError("invalid_durable_execution_history")
                scope = (row.get("producer_id"), row.get("conflict_family"))
                if not all(isinstance(part, str) and part for part in scope):
                    raise ValueError("invalid_durable_execution_history_scope")
                self._persisted_history[scope] = deepcopy(row)
            self._restart_hold = set(self._durable_pending)
            self._durability_ready = True
        except Exception:
            _LOGGER.exception("Mobility durable command state unavailable: physical execution blocked")
            self._durability_ready = False
        self._notify()

    async def _persist_guard(self) -> None:
        await self._guard_store.async_save({
            "seen": [
                {"producer_id": key[0], "conflict_family": key[1],
                 "request_id": key[2], "fingerprint": fingerprint}
                for key, fingerprint in self._persisted_seen.items()
            ],
            "pending": [
                {"producer_id": key[0], "conflict_family": key[1]}
                for key in sorted(self._durable_pending)
            ],
            "last_results": list(self._persisted_history.values()),
        })

    def add_listener(self,cb):
        self.listeners.append(cb)
        def unsub():
            if cb in self.listeners:self.listeners.remove(cb)
        return unsub

    def shutdown(self):
        self._manager_unsub(); self.listeners.clear(); self._active.clear(); self._unknown.clear(); self._reconcile_scheduled=False

    def _notify(self):
        for cb in tuple(self.listeners): cb()

    @callback
    def _manager_changed(self):
        # Normal telemetry must not wake the command/control publication lane.
        # While UNKNOWN execution exists, collapse any telemetry burst into one
        # reconciliation task. The task observes current readback when it runs,
        # so queued duplicates add no truth and only create scheduler pressure.
        if not self._unknown or self._reconcile_scheduled:
            return
        self._reconcile_scheduled=True
        self.hass.async_create_task(self._async_reconcile_unknowns_singleflight())

    async def _async_reconcile_unknowns_singleflight(self) -> None:
        try:
            await self.async_reconcile_unknowns()
        finally:
            self._reconcile_scheduled=False

    def is_blocked(self,producer_id: str,conflict_family: str) -> bool:
        return (
            not self._durability_ready
            or (producer_id,conflict_family) in self._unknown
            or (producer_id,conflict_family) in self._restart_hold
        )

    def is_active(self,producer_id: str,conflict_family: str) -> bool:
        return (producer_id,conflict_family) in self._active

    async def async_rearm(self,producer_id: str,conflict_family: str) -> bool:
        scope=(producer_id,conflict_family)
        async with self._guard:
            if not self._durability_ready:
                return False
            existed = scope in self._unknown or scope in self._restart_hold
            if not existed:
                return False
            pending_before = scope in self._durable_pending
            self._durable_pending.discard(scope)
            try:
                await self._persist_guard()
            except Exception:
                if pending_before:
                    self._durable_pending.add(scope)
                _LOGGER.exception("Mobility rearm rejected: durable guard not saved")
                return False
            self._unknown.pop(scope,None)
            self._restart_hold.discard(scope)
        self._notify()
        return True

    async def async_reconcile_unknowns(self) -> None:
        cleared=[]
        async with self._guard:
            for scope,request in list(self._unknown.items()):
                if self._confirmation_matches(request.confirmation):
                    self._durable_pending.discard(scope)
                    try:
                        await self._persist_guard()
                    except Exception:
                        # Never mark an unknown as reconciled when the durable
                        # restart hold could not be cleared consistently.
                        self._durable_pending.add(scope)
                        _LOGGER.exception("Mobility late-readback guard finalization failed")
                        continue
                    self._unknown.pop(scope,None); cleared.append((scope,request))
                    prior=self.last_results.get(scope)
                    if prior:
                        lifecycle=CommandLifecycle(
                            request_id=request.request_id,
                            asset_id=request.asset_id,
                            operation_key=request.operation_key,
                            stages=(
                                CommandLifecycleStage.REQUESTED,
                                CommandLifecycleStage.ACCEPTED,
                                CommandLifecycleStage.DISPATCHED,
                                CommandLifecycleStage.ACKNOWLEDGED,
                                CommandLifecycleStage.EFFECTIVE,
                            ),
                        )
                        self.last_results[scope]=replace(
                            prior,result='SUCCEEDED_AFTER_DELAY',reason='late_readback_converged',
                            state_after=self._confirmation_state(request.confirmation),lifecycle=lifecycle,
                        )
                        self.result_observed_at[scope]=datetime.now(timezone.utc).isoformat()
                        self._persisted_history[scope]=self._serialize_result(
                            scope,self.last_results[scope],self.result_observed_at[scope]
                        )
                        try:
                            await self._persist_guard()
                        except Exception:
                            _LOGGER.exception("Mobility delayed result history save failed")
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
            if not self._durability_ready:
                return self._result(request,'BLOCKED','durable_command_guard_unavailable',False)
            prior_fingerprint = self._persisted_seen.get(dkey)
            if prior_fingerprint is not None:
                reason = ('request_id_already_dispatched_after_restart'
                          if prior_fingerprint == request.fingerprint else 'idempotency_collision')
                return self._result(request,'BLOCKED',reason,False)
            if scope in self._active:
                result=self._result(request,'BLOCKED','execution_in_progress',False); self._remember(request,result); return result
            if scope in self._restart_hold and not request.protective:
                return self._result(request,'BLOCKED','rearm_required_after_restart_uncertainty',False)
            if scope in self._unknown and not request.protective:
                result=self._result(request,'BLOCKED','rearm_required_after_unknown',False); self._remember(request,result); return result
            # A protective stop can be dispatched while the previous start is
            # unknown, but service acceptance alone never resolves that earlier
            # physical uncertainty. Preserve its guard until proven readback
            # or an explicit operator rearm.
            if request.confirmation.get('mode')!='service_acceptance_only' and self._confirmation_matches(request.confirmation):
                result=self._result(request,'ALREADY_CONVERGED','readback_already_matches',False); self._remember(request,result); return result
            self._active.add(scope)
            self._durable_pending.add(scope)
            self._persisted_seen[dkey] = request.fingerprint
            self._persisted_seen.move_to_end(dkey)
            while len(self._persisted_seen) > 128:
                self._persisted_seen.popitem(last=False)
            try:
                # Fail before any physical write if the durable marker cannot
                # be committed, including a full disk or HA-storage failure.
                await self._persist_guard()
            except Exception:
                self._active.discard(scope)
                self._durable_pending.discard(scope)
                self._persisted_seen.pop(dkey, None)
                _LOGGER.exception("Mobility physical dispatch denied: guard persistence failed")
                return self._result(request,'BLOCKED','durable_pre_dispatch_write_failed',False)

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
            if result.result=='EXECUTION_UNKNOWN':
                self._unknown[scope]=request
            elif request.protective and result.result == 'SUCCEEDED':
                self._unknown.pop(scope,None)
                self._restart_hold.discard(scope)
            # An unconfirmed protective stop cannot erase the original
            # possible physical start, even if the HA service was accepted.
            if scope not in self._unknown and scope not in self._restart_hold:
                self._durable_pending.discard(scope)
            self._remember(request,result)
            try:
                await self._persist_guard()
            except Exception:
                # The pre-dispatch marker is still persisted. Keep this scope
                # fail-closed even if live readback looked successful.
                self._durable_pending.add(scope)
                self._restart_hold.add(scope)
                result=self._result(request,'EXECUTION_UNKNOWN','durable_completion_unconfirmed',attempted,before,self._confirmation_state(request.confirmation))
                self._unknown[scope]=request
                self._remember(request,result)
                _LOGGER.exception("Mobility completion persistence failed; scope remains blocked")
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
        self.result_observed_at[request.scope]=datetime.now(timezone.utc).isoformat()
        self._persisted_history[request.scope]=self._serialize_result(
            request.scope,result,self.result_observed_at[request.scope]
        )
        self._persisted_history.move_to_end(request.scope)
        while len(self._persisted_history)>128:
            self._persisted_history.popitem(last=False)

    @staticmethod
    def _serialize_result(scope, result, observed_at):
        return {
            "producer_id": scope[0],
            "conflict_family": scope[1],
            "request_id": result.request_id,
            "asset_id": result.asset_id,
            "operation_key": result.operation_key,
            "result": result.result,
            "reason": result.reason,
            "write_attempted": result.write_attempted,
            "observed_at": observed_at,
            "confirmation_mode": result.confirmation_mode,
            "state_before": result.state_before,
            "state_after": result.state_after,
            "lifecycle": None if result.lifecycle is None else result.lifecycle.as_dict(),
        }

    @staticmethod
    def _lifecycle(request: ExecutionRequest, result: str, attempted: bool) -> CommandLifecycle:
        if result == 'BLOCKED':
            stages=(CommandLifecycleStage.REQUESTED,CommandLifecycleStage.REJECTED)
        elif result == 'ALREADY_CONVERGED':
            stages=(CommandLifecycleStage.REQUESTED,CommandLifecycleStage.ACCEPTED,CommandLifecycleStage.EFFECTIVE)
        elif result == 'ACCEPTED_UNCONFIRMED':
            stages=(CommandLifecycleStage.REQUESTED,CommandLifecycleStage.ACCEPTED,CommandLifecycleStage.DISPATCHED,CommandLifecycleStage.ACKNOWLEDGED)
        elif result in {'SUCCEEDED','SUCCEEDED_AFTER_DELAY'}:
            stages=(CommandLifecycleStage.REQUESTED,CommandLifecycleStage.ACCEPTED,CommandLifecycleStage.DISPATCHED,CommandLifecycleStage.ACKNOWLEDGED,CommandLifecycleStage.EFFECTIVE)
        elif result == 'EXECUTION_UNKNOWN' and attempted:
            stages=(CommandLifecycleStage.REQUESTED,CommandLifecycleStage.ACCEPTED,CommandLifecycleStage.DISPATCHED,CommandLifecycleStage.UNKNOWN)
        elif result == 'EXECUTION_UNKNOWN':
            stages=(CommandLifecycleStage.REQUESTED,CommandLifecycleStage.UNKNOWN)
        else:
            stages=(CommandLifecycleStage.REQUESTED,CommandLifecycleStage.FAILED)
        return CommandLifecycle(request.request_id,request.asset_id,request.operation_key,stages)

    @classmethod
    def _result(cls,request,result,reason,attempted,before=None,after=None):
        return ExecutionResult(
            request.request_id,request.asset_id,request.operation_key,result,reason,attempted,
            request.confirmation.get('mode','service_acceptance_only'),before,after,
            cls._lifecycle(request,result,attempted),
        )

    def snapshot(self) -> dict[str,Any]:
        return {
            'lifecycle_contract':'MOBILITY_COMMAND_LIFECYCLE_V1',
            'active_scopes':[f'{a}|{b}' for a,b in sorted(self._active)],
            'blocked_unknown_scopes':[f'{a}|{b}' for a,b in sorted(self._unknown)],
            # On restart the previous physical command outcome remains visible
            # even though no execution is resumed or replayed.
            'last_results': [
                deepcopy(row) for _scope,row in sorted(self._persisted_history.items())
            ],
            'durable_guard_ready':self._durability_ready,
            'durable_request_count':len(self._persisted_seen),
            'restart_hold_scopes':[f'{a}|{b}' for a,b in sorted(self._restart_hold)],
            'queueing':'none','automatic_retry':False,'restart_replay':False,
        }
