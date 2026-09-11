from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any, Iterable

from .property_resolution import (
    PropertyProducerKind,
    PropertyResolution,
    PropertyResolutionStatus,
)


class HealthState(StrEnum):
    OK = "OK"
    LIMITED = "LIMITED"
    DEGRADED = "DEGRADED"
    BLOCKED = "BLOCKED"
    UNKNOWN = "UNKNOWN"


class ProductReadiness(StrEnum):
    READY = "READY"
    READY_WITH_LIMITATIONS = "READY_WITH_LIMITATIONS"
    CONFIGURATION_REQUIRED = "CONFIGURATION_REQUIRED"
    DEGRADED = "DEGRADED"
    BLOCKED = "BLOCKED"


@dataclass(frozen=True, slots=True)
class AssetReadiness:
    asset_id: str
    binding_health: HealthState
    observation_health: HealthState
    property_health: HealthState
    control_health: HealthState
    product_readiness: ProductReadiness
    reasons: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "asset_id": self.asset_id,
            "binding_health": self.binding_health.value,
            "observation_health": self.observation_health.value,
            "property_health": self.property_health.value,
            "control_health": self.control_health.value,
            "product_readiness": self.product_readiness.value,
            "reasons": list(self.reasons),
        }


def _binding_health(manager: Any, asset_id: str) -> tuple[HealthState, list[str]]:
    asset = manager.assets.get(asset_id)
    if asset is None:
        return HealthState.BLOCKED, ["asset_missing"]
    if not asset.source_bindings:
        return HealthState.OK, []
    reasons: list[str] = []
    for row in getattr(manager, "_capability_diagnostics", ()) or ():
        if not isinstance(row, dict):
            continue
        status = str(row.get("status") or "").upper()
        if not any(token in status for token in ("AMBIGUOUS", "BINDING", "CARDINALITY", "TARGET_SCOPE")):
            continue
        candidate_asset = row.get("asset_id") or row.get("logical_asset_id")
        if candidate_asset not in (None, "", asset_id):
            continue
        reasons.append(f"binding:{status}")
    return (HealthState.DEGRADED, reasons) if reasons else (HealthState.OK, [])


def _resolution_health(resolutions: Iterable[PropertyResolution]) -> tuple[HealthState, HealthState, bool, list[str]]:
    observation = HealthState.OK
    properties = HealthState.OK
    configuration_required = False
    reasons: list[str] = []
    for row in resolutions:
        if row.status == PropertyResolutionStatus.RESOLUTION_ERROR:
            properties = HealthState.DEGRADED
            reasons.append(f"property:{row.property_id}:{row.error_kind or 'RESOLUTION_ERROR'}")
            if row.producer_kind == PropertyProducerKind.SOURCE:
                observation = HealthState.DEGRADED
        elif row.status == PropertyResolutionStatus.UNAVAILABLE_TEMPORARY:
            if row.producer_kind in (None, PropertyProducerKind.SOURCE):
                observation = HealthState.LIMITED if observation == HealthState.OK else observation
            reasons.append(f"observation:{row.property_id}:temporary")
        elif row.status == PropertyResolutionStatus.CONFIGURATION_REQUIRED:
            configuration_required = True
            properties = HealthState.LIMITED if properties == HealthState.OK else properties
            reasons.append(f"configuration:{row.property_id}:required")
    return observation, properties, configuration_required, reasons


def _control_health(controller: Any, asset_id: str) -> tuple[HealthState, list[str]]:
    descriptors = getattr(controller, "command_descriptors", None)
    if not callable(descriptors):
        return HealthState.UNKNOWN, ["control_descriptors_unavailable"]
    rows = [row for row in descriptors().values() if getattr(row, "asset_id", None) == asset_id]
    if not rows:
        return HealthState.OK, []
    allowed = [row for row in rows if bool(getattr(row, "execution_allowed", False))]
    if len(allowed) == len(rows):
        return HealthState.OK, []
    reasons = [
        f"control:{getattr(row, 'command_key', 'unknown')}:{getattr(row, 'blocked_reason', 'blocked')}"
        for row in rows
        if not bool(getattr(row, "execution_allowed", False))
    ]
    return (HealthState.LIMITED if allowed else HealthState.BLOCKED), reasons


def evaluate_asset_readiness(
    manager: Any,
    controller: Any,
    asset_id: str,
    resolutions: Iterable[PropertyResolution],
) -> AssetReadiness:
    binding, binding_reasons = _binding_health(manager, asset_id)
    observation, properties, configuration_required, property_reasons = _resolution_health(resolutions)
    control, control_reasons = _control_health(controller, asset_id)
    reasons = tuple(binding_reasons + property_reasons + control_reasons)

    if binding == HealthState.BLOCKED or control == HealthState.BLOCKED:
        readiness = ProductReadiness.BLOCKED
    elif binding == HealthState.DEGRADED or observation == HealthState.DEGRADED or properties == HealthState.DEGRADED:
        readiness = ProductReadiness.DEGRADED
    elif configuration_required:
        readiness = ProductReadiness.CONFIGURATION_REQUIRED
    elif any(state in {HealthState.LIMITED, HealthState.UNKNOWN} for state in (binding, observation, properties, control)):
        readiness = ProductReadiness.READY_WITH_LIMITATIONS
    else:
        readiness = ProductReadiness.READY

    return AssetReadiness(
        asset_id=asset_id,
        binding_health=binding,
        observation_health=observation,
        property_health=properties,
        control_health=control,
        product_readiness=readiness,
        reasons=reasons,
    )
