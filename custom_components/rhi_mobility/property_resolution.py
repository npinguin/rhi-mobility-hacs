from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class PropertyProducerKind(StrEnum):
    SOURCE = "SOURCE"
    PROFILE = "PROFILE"
    CONFIGURATION = "CONFIGURATION"
    RELATIONSHIP = "RELATIONSHIP"
    CONTROL_READBACK = "CONTROL_READBACK"
    DERIVED = "DERIVED"
    ALIAS = "ALIAS"


class PropertyResolutionStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNSUPPORTED_BY_SOURCE = "UNSUPPORTED_BY_SOURCE"
    CONFIGURATION_REQUIRED = "CONFIGURATION_REQUIRED"
    UNAVAILABLE_TEMPORARY = "UNAVAILABLE_TEMPORARY"
    RESOLUTION_ERROR = "RESOLUTION_ERROR"


class PropertyResolutionError(StrEnum):
    AMBIGUOUS_SOURCE = "AMBIGUOUS_SOURCE"
    INVALID_BINDING = "INVALID_BINDING"
    NORMALIZATION_ERROR = "NORMALIZATION_ERROR"
    CARDINALITY_ERROR = "CARDINALITY_ERROR"
    TARGET_SCOPE_ERROR = "TARGET_SCOPE_ERROR"
    UNRESOLVED_OWNER = "UNRESOLVED_OWNER"


class PropertyQuality(StrEnum):
    VALID = "VALID"
    ESTIMATED = "ESTIMATED"
    PARTIAL = "PARTIAL"
    STALE = "STALE"
    UNKNOWN = "UNKNOWN"
    INVALID = "INVALID"


@dataclass(frozen=True, slots=True)
class PropertyResolution:
    """Single typed runtime truth for one canonical Mobility property.

    Consumers may project this record but must not reconstruct property ownership,
    availability or failure semantics independently.
    """

    asset_id: str
    property_id: str
    value: Any
    producer_kind: PropertyProducerKind | None
    status: PropertyResolutionStatus
    quality: PropertyQuality = PropertyQuality.UNKNOWN
    reason_code: str | None = None
    error_kind: PropertyResolutionError | None = None
    observed_at: str | None = None
    source_binding_id: str | None = None
    source_reference: dict[str, Any] = field(default_factory=dict)
    dependencies: tuple[str, ...] = ()
    configuration_revision: int = 0
    build_input_revision: int = 0

    @property
    def available(self) -> bool:
        return self.status == PropertyResolutionStatus.AVAILABLE

    @property
    def failed(self) -> bool:
        return self.status == PropertyResolutionStatus.RESOLUTION_ERROR

    def as_dict(self) -> dict[str, Any]:
        return {
            "asset_id": self.asset_id,
            "property_id": self.property_id,
            "value": self.value,
            "producer_kind": None if self.producer_kind is None else self.producer_kind.value,
            "status": self.status.value,
            "quality": self.quality.value,
            "reason_code": self.reason_code,
            "error_kind": None if self.error_kind is None else self.error_kind.value,
            "observed_at": self.observed_at,
            "source_binding_id": self.source_binding_id,
            "source_reference": dict(self.source_reference),
            "dependencies": list(self.dependencies),
            "configuration_revision": self.configuration_revision,
            "build_input_revision": self.build_input_revision,
        }
