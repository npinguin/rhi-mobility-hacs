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


# Product profile enriches profile-owned capabilities (image, capacity, electrical limits,
# planning defaults). Its absence must not make an otherwise healthy physical asset globally
# unconfigured. Configuration-required promotion is reserved for future properties that are
# truly mandatory for the asset to exist or operate at all.
_ASSET_CONFIGURATION_REQUIREMENTS: set[str] = set()

_CONTROL_EVIDENCE_BLOCKERS = {
    "AMBIGUOUS",
    "CARDINALITY_ERROR",
    "BLOCKED_BY_TARGET_SCOPE",
    "INVALID_EVIDENCE",
    "BLOCKED_BY_REVIEW",
    "REJECTED_REVIEW_REQUIRED",
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
            # Required source availability is already owned by RuntimeSnapshot.health.
            # An optional observation being absent must not degrade the whole asset.
            reasons.append(f"observation_optional:{row.property_id}:temporary")
        elif row.status == PropertyResolutionStatus.CONFIGURATION_REQUIRED:
            if row.property_id in _ASSET_CONFIGURATION_REQUIREMENTS:
                properties = HealthState.LIMITED if properties == HealthState.OK else properties
                configuration_required = True
                reasons.append(f"configuration:{row.property_id}:required")
            else:
                # Optional feature configuration is reported as evidence only. If it
                # limits a command, control health reports that limitation directly.
                reasons.append(f"configuration_feature:{row.property_id}:not_configured")
    return observation, properties, configuration_required, reasons


def _declared_control_input_ids(manager: Any, asset_id: str) -> set[str]:
    """Return control/command inputs for the builders already bound to this asset.

    This uses only Mobility-owned accepted bindings and Mobility's canonical builder model.
    It does not rescan Home Assistant or interpret Foundation internals.
    """
    asset = manager.assets.get(asset_id)
    if asset is None:
        return set()
    out: set[str] = set()
    registry = getattr(manager, "registry", None)
    if registry is None:
        return out
    for binding in getattr(asset, "source_bindings", ()) or ():
        try:
            model = registry.builder_model(binding.builder_id)
        except Exception:
            continue
        for input_id, rule in (model.get("input_rules") or {}).items():
            if str(rule.get("usage") or "observation") in {"control", "command"}:
                out.add(str(input_id))
    return out


def _blocked_control_evidence(manager: Any, asset_id: str) -> list[dict[str, Any]]:
    expected = _declared_control_input_ids(manager, asset_id)
    if not expected:
        return []
    rows: list[dict[str, Any]] = []
    for row in getattr(manager, "_capability_diagnostics", ()) or ():
        if not isinstance(row, dict):
            continue
        if row.get("asset_id") != asset_id:
            continue
        if str(row.get("input_id") or "") not in expected:
            continue
        if str(row.get("status") or "").upper() in _CONTROL_EVIDENCE_BLOCKERS:
            rows.append(row)
    return rows


def _control_health(manager: Any, controller: Any, asset_id: str) -> tuple[HealthState, list[str]]:
    descriptors = getattr(controller, "command_descriptors", None)
    if not callable(descriptors):
        return HealthState.UNKNOWN, ["control_descriptors_unavailable"]

    rows = [row for row in descriptors().values() if getattr(row, "asset_id", None) == asset_id]
    blocked_evidence = _blocked_control_evidence(manager, asset_id)
    evidence_reasons = [
        f"control_evidence:{row.get('input_id', 'unknown')}:{str(row.get('status') or 'blocked').lower()}"
        for row in blocked_evidence
    ]

    if not rows:
        return (HealthState.BLOCKED, evidence_reasons) if blocked_evidence else (HealthState.OK, [])

    allowed = [row for row in rows if bool(getattr(row, "execution_allowed", False))]
    descriptor_reasons = [
        f"control:{getattr(row, 'command_key', 'unknown')}:{getattr(row, 'blocked_reason', 'blocked')}"
        for row in rows
        if not bool(getattr(row, "execution_allowed", False))
    ]
    reasons = descriptor_reasons + evidence_reasons

    if len(allowed) == len(rows) and not blocked_evidence:
        return HealthState.OK, []
    if allowed:
        return HealthState.LIMITED, reasons
    return HealthState.BLOCKED, reasons


def evaluate_asset_readiness(
    manager: Any,
    controller: Any,
    asset_id: str,
    resolutions: Iterable[PropertyResolution],
) -> AssetReadiness:
    binding, binding_reasons = _binding_health(manager, asset_id)
    observation, properties, configuration_required, property_reasons = _resolution_health(resolutions)
    control, control_reasons = _control_health(manager, controller, asset_id)
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
