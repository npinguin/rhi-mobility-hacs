from __future__ import annotations

from collections import Counter
from typing import Any

from .property_resolution import PropertyProducerKind, PropertyResolutionStatus
from .property_resolver import PropertyResolver


def normalized_property_coverage(manager: Any, public: Any, projection: Any = None) -> dict[str, Any]:
    """Audit canonical properties from typed PropertyResolution only."""
    totals = Counter()
    by_asset: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    resolver = PropertyResolver(manager, public)
    bucket_by_producer = {
        PropertyProducerKind.SOURCE: "resolved_source",
        PropertyProducerKind.PROFILE: "resolved_profile",
        PropertyProducerKind.CONFIGURATION: "resolved_configuration",
        PropertyProducerKind.RELATIONSHIP: "resolved_relationship",
        PropertyProducerKind.CONTROL_READBACK: "resolved_control_readback",
        PropertyProducerKind.DERIVED: "resolved_derived",
        PropertyProducerKind.ALIAS: "resolved_alias",
    }

    for asset_id, asset in sorted(manager.assets.items()):
        rows = Counter()
        resolutions = resolver.resolve_asset(asset_id)
        for key, resolution in resolutions.items():
            totals["normalized_properties_total"] += 1
            rows["normalized_properties_total"] += 1

            if resolution.status == PropertyResolutionStatus.AVAILABLE:
                bucket = bucket_by_producer.get(resolution.producer_kind)
                if bucket is None:
                    bucket = "unresolved_owner"
                    failures.append({"asset_id": asset_id, "property_key": key, "reason": "UNRESOLVED_OWNER"})
                totals[bucket] += 1
                rows[bucket] += 1
                continue

            if resolution.status == PropertyResolutionStatus.UNSUPPORTED_BY_SOURCE:
                bucket = "not_available_source"
            elif resolution.status == PropertyResolutionStatus.CONFIGURATION_REQUIRED:
                bucket = "not_available_profile_or_configuration"
            elif resolution.status == PropertyResolutionStatus.UNAVAILABLE_TEMPORARY:
                bucket = "temporarily_unavailable"
            elif resolution.status == PropertyResolutionStatus.NOT_APPLICABLE:
                bucket = "explicitly_unavailable"
            elif resolution.status == PropertyResolutionStatus.RESOLUTION_ERROR:
                bucket = "hard_resolution_errors"
                failures.append({
                    "asset_id": asset_id,
                    "property_key": key,
                    "reason": None if resolution.error_kind is None else resolution.error_kind.value,
                })
            else:
                bucket = "unresolved_without_reason"
                failures.append({"asset_id": asset_id, "property_key": key, "reason": resolution.status.value})
            totals[bucket] += 1
            rows[bucket] += 1

        by_asset.append({"asset_id": asset_id, "asset_type": asset.concept_id, **dict(rows)})

    for key in ("hard_resolution_errors", "unresolved_without_reason", "unresolved_owner"):
        totals.setdefault(key, 0)
    return {
        **dict(totals),
        "by_asset": by_asset,
        "resolution_failures": failures[:100],
        "truncated_failures": len(failures) > 100,
    }


def source_capability_coverage(manager: Any) -> dict[str, Any]:
    accepted: dict[str, dict[str, Any]] = {}
    for asset_id, asset in manager.assets.items():
        for binding in asset.source_bindings.values():
            model = manager.registry.builder_model(binding.builder_id)
            rules = model.get("input_rules") or {}
            for input_id, source in binding.inputs.items():
                rule = rules.get(input_id) or {}
                outputs = [str(x) for x in rule.get("outputs") or []]
                accepted[source.candidate_id] = {
                    "candidate_id": source.candidate_id,
                    "asset_id": asset_id,
                    "integration_domain": source.integration_domain,
                    "input_id": input_id,
                    "raw_capability_id": source.raw_capability_id,
                    "usage": rule.get("usage", "observation"),
                    "normalized_outputs": outputs,
                    "classification": "mapped_command" if rule.get("usage") != "observation" else "mapped_property",
                }
    unmapped: list[dict[str, Any]] = []
    unclassified: list[dict[str, Any]] = []
    ambiguous: list[dict[str, Any]] = []
    classified_rejections: list[dict[str, Any]] = []
    for row in getattr(manager, "_capability_diagnostics", []) or []:
        if not isinstance(row, dict):
            continue
        status = str(row.get("status") or "").upper()
        candidate_id = str(row.get("candidate_id") or "")
        if candidate_id and candidate_id in accepted:
            continue
        record = {
            "candidate_id": candidate_id or None,
            "integration_domain": row.get("integration_domain"),
            "input_id": row.get("input_id"),
            "raw_capability_id": row.get("raw_capability_id"),
            "status": status or "UNKNOWN",
        }
        # Object-eligibility rows are explicit domain classifications, not unknown
        # technical source capabilities. They intentionally have no candidate_id or
        # published_match and must never make source-capability closure look incomplete.
        if status in {"REJECTED_UNSUPPORTED_DEVICE_TYPE", "REJECTED_REVIEW_REQUIRED", "REJECTED_LEGACY_MANUAL_PROFILE"}:
            classified_rejections.append(record)
        elif "AMBIGUOUS" in status:
            ambiguous.append(record)
        elif any(token in status for token in ("UNMAPPED", "NO_MATCH", "UNMATCHED")):
            unmapped.append(record)
        elif row.get("published_match"):
            continue
        else:
            unclassified.append(record)
    return {
        "accepted_source_capability_count": len(accepted),
        "mapped_source_capabilities": list(accepted.values()),
        "classified_rejections": classified_rejections[:100],
        "classified_rejection_count": len(classified_rejections),
        "ambiguous": ambiguous[:100],
        "ambiguous_count": len(ambiguous),
        "unmapped_source_capabilities": unmapped[:100],
        "unmapped_source_capability_count": len(unmapped),
        "unclassified_source_capabilities": unclassified[:100],
        "unclassified_source_capability_count": len(unclassified),
        "truncated": any(len(rows) > 100 for rows in (ambiguous, unmapped, unclassified, classified_rejections)),
    }


def completeness_gate(normalized: dict[str, Any], sources: dict[str, Any]) -> dict[str, Any]:
    blockers = {
        "ambiguous": int(sources.get("ambiguous_count", 0) or 0),
        "unmapped_source_capabilities": int(sources.get("unmapped_source_capability_count", 0) or 0),
        "unclassified_source_capabilities": int(sources.get("unclassified_source_capability_count", 0) or 0),
        "hard_resolution_errors": int(normalized.get("hard_resolution_errors", 0) or 0),
        "unresolved_owner": int(normalized.get("unresolved_owner", 0) or 0),
        "unresolved_without_reason": int(normalized.get("unresolved_without_reason", 0) or 0),
    }
    return {"status": "PASS" if not any(blockers.values()) else "FAIL", **blockers}
