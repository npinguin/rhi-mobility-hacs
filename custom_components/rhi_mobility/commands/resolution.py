from __future__ import annotations
from typing import Any
from .models import CommandDescriptor, ExecutionRequest, RequestedPowerDescriptor


def _entity_service(entity_id: str, command_key: str) -> tuple[str,str,dict[str,Any],dict[str,Any]]:
    domain=entity_id.split('.',1)[0]
    target={'entity_id':entity_id}
    if command_key.endswith('.start'):
        if domain not in {'switch','input_boolean'}: raise ValueError('start entity surface must be switch-like')
        return domain,'turn_on',target,{}
    if command_key.endswith('.stop'):
        if domain not in {'switch','input_boolean'}: raise ValueError('stop entity surface must be switch-like')
        return domain,'turn_off',target,{}
    if domain=='button': return 'button','press',target,{}
    raise ValueError(f'unsupported entity command surface {domain} for {command_key}')


def command_request(descriptor: CommandDescriptor, request_id: str) -> ExecutionRequest:
    source=descriptor.source
    confirmation=dict(descriptor.confirmation)
    if source.source_kind=='entity':
        domain,action,target,data=_entity_service(source.entity_id or '',descriptor.command_key)
        if descriptor.command_key.endswith('.stop') and domain in {'switch','input_boolean'}:
            confirmation={'mode':'entity_state','entity_id':source.entity_id,'expected':'off','tolerance':0.0,'timeout_s':10.0}
    elif source.source_kind=='service':
        ident=source.identity; domain=str(ident['service_domain']); action=str(ident['service_name'])
        target={'device_id':str(ident['target']['device_registry_id'])}; data={}
    else:
        raise ValueError(f'unsupported command source kind: {source.source_kind}')
    return ExecutionRequest(
        request_id=request_id,asset_id=descriptor.asset_id,operation_key=descriptor.command_key,
        producer_id=source.producer_id,conflict_family=descriptor.conflict_family,
        service_domain=domain,service_action=action,target=target,service_data=data,
        confirmation=confirmation,protective=descriptor.protective,
        context={'candidate_id':source.candidate_id,'source_kind':source.source_kind,'integration_domain':source.integration_domain},
    )


def requested_power_request(descriptor: RequestedPowerDescriptor, power_kw: float, request_id: str) -> tuple[ExecutionRequest,float]:
    requested=float(power_kw)
    requested=max(descriptor.min_power_kw,min(requested,descriptor.max_power_kw))
    source=descriptor.source
    if not source.entity_id: raise ValueError('requested power write surface requires entity source')
    domain=source.entity_id.split('.',1)[0]
    if descriptor.mode=='direct_power':
        raw=requested
        unit=(source.native_unit or '').strip().lower().replace(' ','')
        if unit in {'w','watt','watts'}: raw=requested*1000.0
        if domain in {'number','input_number'}:
            action='set_value'; data={'value':raw}
        elif domain in {'select','input_select'}:
            action='select_option'; data={'option':str(raw)}
        else: raise ValueError('direct power write surface must be number/select')
        expected=raw; tolerance=max(0.01,descriptor.step_power_kw/4.0*(1000.0 if unit=='w' else 1.0))
    else:
        if descriptor.effective_voltage_v is None or descriptor.effective_phase_count is None or descriptor.current_step_a is None:
            raise ValueError('current-limit requested power requires complete control profile')
        raw_current=requested*1000.0/(descriptor.effective_voltage_v*descriptor.effective_phase_count)
        step=descriptor.current_step_a
        current=round(raw_current/step)*step
        current=max(descriptor.min_current_a or current,min(current,descriptor.max_current_a or current))
        requested=current*descriptor.effective_voltage_v*descriptor.effective_phase_count/1000.0
        if domain in {'number','input_number'}:
            action='set_value'; data={'value':current}
        elif domain in {'select','input_select'}:
            action='select_option'; data={'option':str(int(current) if float(current).is_integer() else current)}
        else: raise ValueError('current-limit write surface must be number/select')
        expected=current; tolerance=max(0.01,step/4.0)
    confirmation={'mode':'entity_state','entity_id':source.entity_id,'expected':expected,'tolerance':tolerance,'timeout_s':15.0}
    request=ExecutionRequest(
        request_id=request_id,asset_id=descriptor.asset_id,operation_key='charger.requested_power_kw',
        producer_id=source.producer_id,conflict_family='charger_physical',service_domain=domain,service_action=action,
        target={'entity_id':source.entity_id},service_data=data,confirmation=confirmation,protective=False,
        context={'candidate_id':source.candidate_id,'requested_power_kw':round(requested,3),'write_mode':descriptor.mode},
    )
    return request,round(requested,3)
