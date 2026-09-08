from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any

@dataclass(frozen=True)
class SourceRef:
    candidate_id: str
    source_kind: str
    integration_domain: str
    technical_capability: str
    writable: bool
    identity: dict[str, Any]
    raw_capability_id: str = ""
    published_match: dict[str, Any] = field(default_factory=dict)
    native_unit: str | None = None
    technical_match_confidence: str | None = None
    availability: str | None = None

    @property
    def entity_id(self) -> str | None:
        value=self.identity.get('current_entity_id')
        return str(value) if isinstance(value,str) and value else None

    @property
    def device_id(self) -> str | None:
        value=self.identity.get('device_registry_id') or (self.identity.get('target') or {}).get('device_registry_id')
        return str(value) if isinstance(value,str) and value else None

    @property
    def config_entry_id(self) -> str | None:
        value=self.identity.get('config_entry_id')
        return str(value) if isinstance(value,str) and value else None

    @property
    def target_scope(self) -> str | None:
        value=self.identity.get("target_scope")
        return str(value) if isinstance(value,str) and value else None

    @property
    def producer_id(self) -> str:
        return self.device_id or self.entity_id or self.candidate_id

@dataclass(frozen=True)
class AssetControlProfile:
    asset_id: str
    nominal_voltage_v: float | None = None
    phase_count: int | None = None
    min_current_a: float | None = None
    max_current_a: float | None = None
    current_step_a: float | None = None
    ac_phase_count: int | None = None
    max_ac_power_kw: float | None = None


@dataclass(frozen=True)
class VehiclePlanningProfile:
    asset_id: str
    battery_capacity_kwh: float | None = None
    target_soc_pct: float | None = None
    ready_by: str | None = None
    enabled: bool = True

@dataclass(frozen=True)
class AcceptedSourceBinding:
    binding_id: str
    selection_id: str
    group_id: str
    asset_id: str
    logical_concept_id: str
    builder_id: str
    source_role: str
    source_precedence: int
    integration_domain: str
    source_configuration_revision: int
    candidate_revision: int
    build_input_revision: int
    inputs: dict[str, SourceRef] = field(default_factory=dict)

@dataclass
class LogicalAssetBinding:
    asset_id: str
    concept_id: str
    display_name: str
    source_bindings: dict[str, AcceptedSourceBinding] = field(default_factory=dict)
    source_integration_domain: str | None = None
    source_device_id: str | None = None
    source_config_entry_id: str | None = None

@dataclass
class RuntimeSnapshot:
    asset_id: str
    concept_id: str
    display_name: str
    values: dict[str, Any] = field(default_factory=dict)
    quality: dict[str, str] = field(default_factory=dict)
    health: str = "UNKNOWN"
    health_reason: str = "awaiting_observation"
    source_configuration_revision: int = 0
    build_input_revision: int = 0

@dataclass(frozen=True)
class RelationshipSnapshot:
    relationship_id: str
    relationship_type: str
    from_asset_id: str
    to_asset_id: str
    selection_id: str
    health: str = "PENDING"
    evidence_source: str = "foundation_selection"
