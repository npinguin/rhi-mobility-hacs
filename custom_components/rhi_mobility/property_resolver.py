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


_PRODUCER_KIND = {
    "SOURCE": PropertyProducerKind.SOURCE,
    "PROFILE": PropertyProducerKind.PROFILE,
    "CONFIGURED": PropertyProducerKind.CONFIGURATION,
    "RELATIONSHIP": PropertyProducerKind.RELATIONSHIP,
    "CONTROL_READBACK": PropertyProducerKind.CONTROL_READBACK,
    "DERIVED": PropertyProducerKind.DERIVED,
    "ALIAS": PropertyProducerKind.ALIAS,
}

_CAPABILITY_FAILURES = {
    "AMBIGUOUS": PropertyResolutionError.AMBIGUOUS_SOURCE,
    "CARDINALITY_ERROR": PropertyResolutionError.CARDINALITY_ERROR,
    "BLOCKED_BY_TARGET_SCOPE": PropertyResolutionError.TARGET_SCOPE_ERROR,
    "INVALID_VALUE": PropertyResolutionError.NORMALIZATION_ERROR,
    "NORMALIZATION_ERROR": PropertyResolutionError.NORMALIZATION_ERROR,
    "INVALID_EVIDENCE": PropertyResolutionError.NORMALIZATION_ERROR,
}

_CAPABILITY_PRIORITY = (
    "AMBIGUOUS",
    "CARDINALITY_ERROR",
    "BLOCKED_BY_TARGET_SCOPE",
    "INVALID_VALUE",
    "NORMALIZATION_ERROR",
    "INVALID_EVIDENCE",
    "BLOCKED_BY_REVIEW",
    "REJECTED_REVIEW_REQUIRED",
    "STALE",
    "UNAVAILABLE",
    "NORMALIZED",
    "MATCHED",
    "MISSING",
)


def _select_declared_candidate(
    definition: dict[str, Any],
    candidates: dict[str, dict[str, Any]],
) -> tuple[dict[str, Any], PropertyProducerKind] | None:
    """Choose exactly by catalog truth_precedence, never by runtime code order."""
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


def _single_declared_producer(definition: dict[str, Any]) -> PropertyProducerKind | None:
    """Allow non-ledger producers only when ownership is unambiguous in the catalog."""
    declared = declared_producer_types(definition)
    if len(declared) != 1:
        return None
    return _PRODUCER_KIND.get(declared[0])


def _quality_for(
    *,
    producer: PropertyProducerKind | None,
    status: PropertyResolutionStatus,
    capability_status: str | None,
) -> PropertyQuality:
    """Derive quality from typed ownership/status only; never parse free-form strings."""
    if status == PropertyResolutionStatus.RESOLUTION_ERROR:
        return PropertyQuality.INVALID
    if status != PropertyResolutionStatus.AVAILABLE:
        return PropertyQuality.STALE if capability_status == "STALE" else PropertyQuality.UNKNOWN
    if producer in {PropertyProducerKind.PROFILE, PropertyProducerKind.DERIVED}:
        return PropertyQuality.ESTIMATED
    return PropertyQuality.VALID


class PropertyResolver:
    """Single runtime authority for canonical Mobility property resolution.

    Resolution is deliberately strict: producer candidates and the semantic catalog own
    precedence; capability diagnostics own absence/error classification. Public projection
    text such as quality/reason labels is never interpreted as semantic evidence.
    """

    def __init__(self, manager: Any, public: Any) -> None:
        self.manager = manager
        self.public = public

    def _definition(self, asset_id: str, property_id: str) -> dict[str, Any] | None:
        asset = self.manager.assets.get(asset_id)
        if asset is None:
            return None
        definition = self.public.property_definition(property_id, asset.concept_id)
        return dict(definition) if isinstance(definition, dict) else None

    def _capability_status(self, asset_id: str, property_id: str) -> str | None:
        statuses: set[str] = set()
        for row in getattr(self.manager, "_capability_diagnostics", ()) or ():
            if not isinstance(row, dict):
                continue
            row_asset = row.get("asset_id") or row.get("logical_asset_id")
            if row_asset not in (None, "", asset_id):
                continue
            outputs = {str(value) for value in row.get("normalized_properties") or ()}
            if property_id not in outputs:
                continue
            status = str(row.get("status") or "").upper()
            if status:
                statuses.add(status)
        for wanted in _CAPABILITY_PRIORITY:
            if wanted in statuses:
                return wanted
        return sorted(statuses)[0] if statuses else None

    @staticmethod
    def _absence_status(
        definition: dict[str, Any], capability_status: str | None
    ) -> tuple[PropertyResolutionStatus, PropertyResolutionError | None, str]:
        if capability_status in _CAPABILITY_FAILURES:
            return (
                PropertyResolutionStatus.RESOLUTION_ERROR,
                _CAPABILITY_FAILURES[capability_status],
                capability_status.lower(),
            )
        if capability_status in {"BLOCKED_BY_REVIEW", "REJECTED_REVIEW_REQUIRED"}:
            return PropertyResolutionStatus.CONFIGURATION_REQUIRED, None, "configuration_review_required"
        if capability_status in {"STALE", "UNAVAILABLE", "NORMALIZED", "MATCHED"}:
            return PropertyResolutionStatus.UNAVAILABLE_TEMPORARY, None, "temporarily_unavailable"
        if capability_status == "MISSING":
            return PropertyResolutionStatus.UNSUPPORTED_BY_SOURCE, None, "source_capability_missing"

        declared = set(declared_producer_types(definition))
        if declared and declared <= {"CONFIGURED", "PROFILE"}:
            return PropertyResolutionStatus.CONFIGURATION_REQUIRED, None, "configuration_required"
        if "RELATIONSHIP" in declared and not (declared & {"SOURCE", "CONTROL_READBACK", "DERIVED"}):
            return PropertyResolutionStatus.CONFIGURATION_REQUIRED, None, "relationship_required"
        if declared & {"SOURCE", "CONTROL_READBACK"}:
            return PropertyResolutionStatus.UNSUPPORTED_BY_SOURCE, None, "unsupported_by_source"
        if "DERIVED" in declared:
            return PropertyResolutionStatus.UNAVAILABLE_TEMPORARY, None, "derived_dependencies_unavailable"
        return PropertyResolutionStatus.UNSUPPORTED_BY_SOURCE, None, "no_available_producer"

    def _alias_resolution(self, asset_id: str, property_id: str, canonical: str) -> PropertyResolution:
        target = self.resolve(asset_id, canonical)
        reference = dict(target.source_reference)
        reference["compatibility_alias_of"] = canonical
        return PropertyResolution(
            asset_id=asset_id,
            property_id=property_id,
            value=target.value,
            producer_kind=PropertyProducerKind.ALIAS,
            status=target.status,
            quality=target.quality,
            reason_code=target.reason_code,
            error_kind=target.error_kind,
            observed_at=target.observed_at,
            source_binding_id=target.source_binding_id,
            source_reference=reference,
            dependencies=(canonical,),
            configuration_revision=target.configuration_revision,
            build_input_revision=target.build_input_revision,
        )

    def resolve(self, asset_id: str, property_id: str) -> PropertyResolution:
        asset = self.manager.assets.get(asset_id)
        if asset is None:
            return PropertyResolution(
                asset_id=asset_id,
                property_id=property_id,
                value=None,
                producer_kind=None,
                status=PropertyResolutionStatus.RESOLUTION_ERROR,
                quality=PropertyQuality.INVALID,
                reason_code="asset_not_found",
                error_kind=PropertyResolutionError.INVALID_BINDING,
            )

        aliases = dict(getattr(self.manager.registry, "legacy_aliases", {}) or {})
        canonical_alias = str(aliases.get(property_id, property_id))
        if canonical_alias != property_id:
            return self._alias_resolution(asset_id, property_id, canonical_alias)

        definition = self._definition(asset_id, property_id)
        if definition is None:
            return PropertyResolution(
                asset_id=asset_id,
                property_id=property_id,
                value=None,
                producer_kind=None,
                status=PropertyResolutionStatus.NOT_APPLICABLE,
                quality=PropertyQuality.UNKNOWN,
                reason_code="not_applicable",
            )

        snap = self.manager.snapshots.get(asset_id)
        candidate_provider = getattr(self.manager, "producer_candidates", None)
        candidates = candidate_provider(asset_id, property_id) if callable(candidate_provider) else {}
        try:
            selected = _select_declared_candidate(definition, dict(candidates or {}))
        except ValueError as exc:
            return PropertyResolution(
                asset_id=asset_id,
                property_id=property_id,
                value=None,
                producer_kind=None,
                status=PropertyResolutionStatus.RESOLUTION_ERROR,
                quality=PropertyQuality.INVALID,
                reason_code="producer_precedence_error",
                error_kind=PropertyResolutionError.UNRESOLVED_OWNER,
                source_reference={"producer_policy_error": str(exc)},
                build_input_revision=0 if snap is None else int(getattr(snap, "build_input_revision", 0) or 0),
            )

        if selected is not None:
            candidate, producer = selected
            value = candidate.get("value")
            reference = dict(candidate.get("source_reference") or {})
            reference["selected_by_truth_precedence"] = True
        else:
            value = self.public.property_value(asset_id, property_id)
            reference = dict(self.public.property_provenance(asset_id, property_id) or {})
            producer = _single_declared_producer(definition) if value is not None else None

        capability_status = self._capability_status(asset_id, property_id)
        if value is not None and producer is None:
            status = PropertyResolutionStatus.RESOLUTION_ERROR
            error_kind = PropertyResolutionError.UNRESOLVED_OWNER
            reason = "available_value_without_explicit_producer"
        elif value is not None:
            status = PropertyResolutionStatus.AVAILABLE
            error_kind = None
            reason = None
        else:
            status, error_kind, reason = self._absence_status(definition, capability_status)

        return PropertyResolution(
            asset_id=asset_id,
            property_id=property_id,
            value=value if status == PropertyResolutionStatus.AVAILABLE else None,
            producer_kind=producer,
            status=status,
            quality=_quality_for(producer=producer, status=status, capability_status=capability_status),
            reason_code=reason,
            error_kind=error_kind,
            observed_at=reference.get("observed_at"),
            source_binding_id=reference.get("source_binding_id"),
            source_reference=reference,
            dependencies=tuple(str(x) for x in reference.get("derived_from") or ()),
            configuration_revision=int(reference.get("configuration_revision", 0) or 0),
            build_input_revision=0 if snap is None else int(getattr(snap, "build_input_revision", 0) or 0),
        )

    def resolve_asset(self, asset_id: str) -> dict[str, PropertyResolution]:
        return {
            property_id: self.resolve(asset_id, property_id)
            for property_id in self.public.available_property_keys(asset_id)
        }
