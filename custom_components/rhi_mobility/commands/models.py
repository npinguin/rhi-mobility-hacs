from __future__ import annotations
from dataclasses import dataclass, field
from enum import StrEnum
import hashlib, json
from typing import Any
from ..models.contracts import SourceRef


class CommandLifecycleStage(StrEnum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    DISPATCHED = "dispatched"
    ACKNOWLEDGED = "acknowledged"
    EFFECTIVE = "effective"
    REJECTED = "rejected"
    FAILED = "failed"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class CommandLifecycle:
    """Typed execution lifecycle owned by Mobility V2.

    The sequence is evidence, not an inferred progress bar. A stage is present only when
    the executor has proof that the transition happened.
    """

    request_id: str
    asset_id: str
    operation_key: str
    stages: tuple[CommandLifecycleStage, ...]

    @property
    def current(self) -> CommandLifecycleStage:
        return self.stages[-1]

    def as_dict(self) -> dict[str, Any]:
        return {
            "request_id": self.request_id,
            "asset_id": self.asset_id,
            "operation_key": self.operation_key,
            "stages": [stage.value for stage in self.stages],
            "current_stage": self.current.value,
        }


@dataclass(frozen=True)
class CommandDescriptor:
    command_id: str
    asset_id: str
    command_key: str
    source: SourceRef
    conflict_family: str
    confirmation: dict[str, Any]
    protective: bool
    placement: str
    supported: bool = True
    execution_allowed: bool = False
    blocked_reason: str = "not_evaluated"


@dataclass(frozen=True)
class RequestedPowerDescriptor:
    asset_id: str
    source: SourceRef
    mode: str
    min_power_kw: float
    max_power_kw: float
    step_power_kw: float
    effective_voltage_v: float | None = None
    effective_phase_count: int | None = None
    min_current_a: float | None = None
    max_current_a: float | None = None
    current_step_a: float | None = None


@dataclass(frozen=True)
class ExecutionRequest:
    request_id: str
    asset_id: str
    operation_key: str
    producer_id: str
    conflict_family: str
    service_domain: str
    service_action: str
    target: dict[str, Any]
    service_data: dict[str, Any]
    confirmation: dict[str, Any]
    protective: bool = False
    context: dict[str, Any] = field(default_factory=dict)

    @property
    def scope(self) -> tuple[str,str]:
        return (self.producer_id,self.conflict_family)

    @property
    def fingerprint(self) -> str:
        payload={
            'asset_id':self.asset_id,'operation_key':self.operation_key,'producer_id':self.producer_id,
            'conflict_family':self.conflict_family,'service_domain':self.service_domain,
            'service_action':self.service_action,'target':self.target,'service_data':self.service_data,
            'confirmation':self.confirmation,'protective':self.protective,
        }
        return hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(',',':'),default=str).encode()).hexdigest()


@dataclass(frozen=True)
class ExecutionResult:
    request_id: str
    asset_id: str
    operation_key: str
    result: str
    reason: str
    write_attempted: bool
    confirmation_mode: str
    state_before: Any = None
    state_after: Any = None
    lifecycle: CommandLifecycle | None = None
