from __future__ import annotations

from typing import Any

from .producer_policy import declared_producer_types
from .property_resolution import (
    PropertyProducerKind,
    PropertyQuality,
    PropertyResolution,
    PropertyResolutionError,
    PropertyResolutionStatus,
)


_STATUS_ERROR_MAP = {
    "AMBIGUOUS_SOURCE": PropertyResolutionError.AMBIGUOUS_SOURCE,
    "BINDING_ERROR": PropertyResolutionError.INVALID_BINDING,
    "NORMALIZATION_ERROR": PropertyResolutionError.NORMALIZATION_ERROR,
    "CARDINALITY_ERROR": PropertyResolutionError.CARDINALITY_ERROR,
    "TARGET_SCOPE_ERROR": PropertyResolutionError.TARGET_SCOPE_ERROR,
}

_PRODUCER_KIND = {
    "SOURCE": PropertyProducerKind.SOURCE,
    "PROFILE": PropertyProducerKind.PROFILE,
    "CONFIGURED": PropertyProducerKind.CONFIGURATION,
    "RELATIONSHIP": PropertyProducerKind.RELATIONSHIP,
    "CONTROL_READBACK": PropertyProducerKind.CONTROL_READBACK,
    "DERIVED": PropertyProducerKind.DERIVED,
    "ALIAS": PropertyProducerKind.ALIAS,
}


def _quality(value: str | None, *, available: bool) -> PropertyQuality:
    raw = str(value or "").upper()
    if "STALE" in raw:
        return PropertyQuality.STALE
    if "INVALID" in raw or "ERROR" in raw:
        return PropertyQuality.INVALID
    if "PARTIAL" in raw:
        return PropertyQuality.PARTIAL
    if "ESTIMAT" in raw or "DERIVED" in raw:
        return PropertyQuality.ESTIMATED
    if available:
        return PropertyQuality.VALID
    return PropertyQuality.UNKNOWN


def _producer_from_evidence(definition: dict[str, Any], quality: str | None, provenance: dict[str, Any]) -> PropertyProducerKind | None:
    declared = set(declared_producer_types(definition))
    q = str(quality or provenance.get("quality") or "").lower()
    if provenance.get("candidate_id") or q.startswith("candidate:"):
        return PropertyProducerKind.SOURCE if "SOURCE" in declared else None
    if provenance.get("profile_id") or q.startswith("mobility_profile:"):
        return PropertyProducerKind.PROFILE if "PROFILE" in declared else None
    if "configuration" in q or "manual_profile" in q or provenance.get("configuration_revision"):
        return PropertyProducerKind.CONFIGURATION if "CONFIGURED" in declared else None
    if provenance.get("relationship_id") or "relationship" in q:
        return PropertyProducerKind.RELATIONSHIP if "RELATIONSHIP" in declared else None
    if "readback" in q or provenance.get("command_reference"):
        return PropertyProducerKind.CONTROL_READBACK if "CONTROL_READBACK" in declared else None
    if provenance.get("compatibility_alias_of"):
        return PropertyProducerKind.ALIAS if "ALIAS" in declared else None
    if provenance.get("derived_from"):
        return PropertyProducerKind.DERIVED if "DERIVED" in declared else None
    if len(declared) == 1:
        return _PRODUCER_KIND.get(next(iter(declared)))
    return None


def _select_declared_candidate(definition: dict[str, Any], candidates: dict[str, dict[str, Any]]) -> tuple[dict[str, Any], PropertyProducerKind] | None:
    if not candidates:
        return None
    declared = set(declared_producer_types(definition))
    precedence = tuple(str(value) for value in definition.get("truth_precedence") or ())
    unknown = sorted(set(candidates) - declared)
    if unknown:
        raise ValueError(f"candidate producers not declared by semantic catalog: {unknown}")
    if not precedence:
        raise ValueError("producer candidates exist but truth_precedence is empty")
    for producer_name in precedence:
        candidate = candidates.get(producer_name)
        if candidate is None:
            continue
        producer_kind = _PRODUCER_KIND.get(producer_name)
        if producer_kind is None:
            raise ValueError(f"unsupported producer in truth_precedence: {producer_name}")
        return candidate, producer_kind
    raise ValueError("producer candidates exist but none are selectable by truth_precedence")


class PropertyResolver:
    def __init__(self, manager: Any, public: Any) -> None:
        self.manager = manager
        self.public = public

    def _definition(self, asset_id: str, property_id: str) -> dict[str, Any] | None:
        asset = self.manager.assets.get(asset_id)
        if asset is None:
            return None
        return self.public.property_definition(property_id, asset.concept_id)

    def _absence_reason(self, asset_id: str, property_id: str, definition: dict[str, Any] | None, provenance: dict[str, Any], raw_quality: str | None) -> str:
        asset = self.manager.assets.get(asset_id)
        if asset is None: return "BINDING_ERROR"
        if definition is None: return "NOT_APPLICABLE"
        status = str(provenance.get("normalization_status") or "").upper()
        quality = str(raw_quality or provenance.get("quality") or "").upper()
        reason = str(provenance.get("reason") or "").upper()
        evidence = " ".join((status, quality, reason))
        if "AMBIGUOUS" in evidence: return "AMBIGUOUS_SOURCE"
        if "CARDINALITY" in evidence: return "CARDINALITY_ERROR"
        if "TARGET_SCOPE" in evidence: return "TARGET_SCOPE_ERROR"
        if "INVALID" in evidence or "NORMALIZATION" in evidence: return "NORMALIZATION_ERROR"
        if "BINDING" in evidence: return "BINDING_ERROR"
        if "STALE" in evidence or "UNAVAILABLE" in evidence: return "UNAVAILABLE_TEMPORARY"
        if "UNSUPPORTED" in evidence: return "UNSUPPORTED_BY_SOURCE"
        if "CONFIGURATION" in evidence or "REVIEW" in evidence: return "CONFIGURATION_REQUIRED"
        supported = getattr(self.manager, "supported_property_keys", lambda _aid: set())(asset_id)
        if property_id in supported: return "NORMALIZATION_ERROR"
        precedence = set(definition.get("truth_precedence") or [])
        if precedence & {"CONFIGURED", "PROFILE"} and "SOURCE" not in precedence: return "CONFIGURATION_REQUIRED"
        return "UNSUPPORTED_BY_SOURCE"

    def resolve(self, asset_id: str, property_id: str) -> PropertyResolution:
        asset = self.manager.assets.get(asset_id)
        if asset is None:
            return PropertyResolution(asset_id=asset_id, property_id=property_id, value=None, producer_kind=None, status=PropertyResolutionStatus.RESOLUTION_ERROR, quality=PropertyQuality.INVALID, reason_code="asset_not_found", error_kind=PropertyResolutionError.INVALID_BINDING)
        definition = self._definition(asset_id, property_id) or {}
        producer = None
        candidate_provider = getattr(self.manager, "producer_candidates", None)
        candidates = candidate_provider(asset_id, property_id) if callable(candidate_provider) else {}
        try:
            selected = _select_declared_candidate(definition, dict(candidates or {}))
        except ValueError as exc:
            snap = self.manager.snapshots.get(asset_id)
            return PropertyResolution(asset_id=asset_id, property_id=property_id, value=None, producer_kind=None, status=PropertyResolutionStatus.RESOLUTION_ERROR, quality=PropertyQuality.INVALID, reason_code="producer_precedence_error", error_kind=PropertyResolutionError.UNRESOLVED_OWNER, source_reference={"producer_policy_error": str(exc)}, build_input_revision=0 if snap is None else int(getattr(snap, "build_input_revision", 0) or 0))
        if selected is not None:
            candidate, producer = selected
            value = candidate.get("value")
            provenance = dict(candidate.get("source_reference") or {})
            provenance["selected_by_truth_precedence"] = True
            raw_quality = str(candidate.get("quality") or "") or None
        else:
            value = self.public.property_value(asset_id, property_id)
            provenance = dict(self.public.property_provenance(asset_id, property_id) or {})
            raw_quality = self.public.property_quality(asset_id, property_id)
            try: producer = _producer_from_evidence(definition, raw_quality, provenance)
            except ValueError as exc:
                producer = None; provenance = {**provenance, "producer_policy_error": str(exc)}
        availability = "AVAILABLE" if value is not None else self._absence_reason(asset_id, property_id, definition or None, provenance, raw_quality)
        available = availability == "AVAILABLE" and value is not None
        if available and producer is None:
            status=PropertyResolutionStatus.RESOLUTION_ERROR; error_kind=PropertyResolutionError.UNRESOLVED_OWNER; reason="available_value_without_explicit_producer"
        elif availability == "AVAILABLE": status=PropertyResolutionStatus.AVAILABLE; error_kind=None; reason=None
        elif availability == "NOT_APPLICABLE": status=PropertyResolutionStatus.NOT_APPLICABLE; error_kind=None; reason="not_applicable"
        elif availability == "UNSUPPORTED_BY_SOURCE": status=PropertyResolutionStatus.UNSUPPORTED_BY_SOURCE; error_kind=None; reason="unsupported_by_source"
        elif availability == "CONFIGURATION_REQUIRED": status=PropertyResolutionStatus.CONFIGURATION_REQUIRED; error_kind=None; reason="configuration_required"
        elif availability == "UNAVAILABLE_TEMPORARY": status=PropertyResolutionStatus.UNAVAILABLE_TEMPORARY; error_kind=None; reason="temporarily_unavailable"
        else:
            status=PropertyResolutionStatus.RESOLUTION_ERROR; error_kind=_STATUS_ERROR_MAP.get(availability, PropertyResolutionError.UNRESOLVED_OWNER); reason=availability.lower() if availability else "unresolved"
        snap = self.manager.snapshots.get(asset_id)
        return PropertyResolution(asset_id=asset_id, property_id=property_id, value=value, producer_kind=producer, status=status, quality=_quality(raw_quality, available=value is not None), reason_code=reason, error_kind=error_kind, observed_at=provenance.get("observed_at"), source_binding_id=provenance.get("source_binding_id"), source_reference=provenance, dependencies=tuple(str(x) for x in provenance.get("derived_from") or ()), configuration_revision=int(provenance.get("configuration_revision", 0) or 0), build_input_revision=0 if snap is None else int(getattr(snap, "build_input_revision", 0) or 0))

    def resolve_asset(self, asset_id: str) -> dict[str, PropertyResolution]:
        return {property_id: self.resolve(asset_id, property_id) for property_id in self.public.available_property_keys(asset_id)}
