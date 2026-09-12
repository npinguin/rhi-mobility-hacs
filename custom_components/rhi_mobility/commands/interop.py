from __future__ import annotations
from typing import Any


class MobilityCommandProvider:
    """Typed Mobility command boundary; never exposes raw HA service bindings."""

    CONTRACT_ID='MOBILITY_COMMAND_EXECUTION_V1'

    def __init__(self,controller) -> None:
        self.controller=controller

    def command_snapshot(self) -> dict[str,Any]:
        rows=[]
        for row in self.controller.command_descriptors().values():
            rows.append({
                'command_id':row.command_id,'asset_id':row.asset_id,'command_key':row.command_key,
                'supported':row.supported,'execution_allowed':row.execution_allowed,'blocked_reason':row.blocked_reason,
                'placement':row.placement,'protective':row.protective,
            })
        return {'contract_id':self.CONTRACT_ID,'publisher':'rhi_mobility','commands':rows,'raw_service_bindings_exposed':False}

    async def async_execute(self,request: dict[str,Any]) -> dict[str,Any]:
        return await self.controller.async_execute_command(str(request['asset_id']),str(request['command_key']),request.get('request_id'))

    async def async_set_requested_power(self,request: dict[str,Any]) -> dict[str,Any]:
        return await self.controller.async_set_requested_power(str(request['asset_id']),float(request['power_kw']),request.get('request_id'))

    async def async_apply_requested_setpoint(self,request: dict[str,Any]) -> dict[str,Any]:
        """Apply canonical requested-power/current intent through Mobility-owned control semantics.

        Compatibility callers may provide power, current or both. Coherence and physical
        mapping remain V2 concerns; the V1 facade never performs electrical conversion.
        """
        asset_id=str(request['asset_id'])
        power=request.get('power_kw')
        current=request.get('current_a')
        request_id=request.get('request_id')
        if power is None and current is None:
            raise ValueError('power_kw or current_a is required')
        if power is not None and current is not None:
            desc=self.controller.requested_power_descriptor(asset_id)
            if desc is None or desc.effective_voltage_v is None or desc.effective_phase_count is None:
                raise ValueError('cannot validate simultaneous power/current request without explicit control profile')
            implied=float(current)*float(desc.effective_voltage_v)*int(desc.effective_phase_count)/1000.0
            if abs(float(power)-implied)>max(0.05,float(desc.step_power_kw)/2.0):
                raise ValueError('power_kw and current_a conflict')
            return await self.controller.async_set_requested_power(asset_id,float(power),request_id)
        if power is not None:
            return await self.controller.async_set_requested_power(asset_id,float(power),request_id)
        return await self.controller.async_set_requested_current(asset_id,float(current),request_id)
