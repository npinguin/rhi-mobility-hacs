from __future__ import annotations
from typing import Any

class MobilityCommandProvider:
    """Typed domain boundary for Energy/UX callers; never exposes raw HA service bindings."""
    CONTRACT_ID='MOBILITY_COMMAND_EXECUTION_V1'
    def __init__(self,controller) -> None:self.controller=controller
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
