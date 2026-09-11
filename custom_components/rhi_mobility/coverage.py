from __future__ import annotations

from collections import Counter
from typing import Any

_ALLOWED_ABSENCE = {"UNSUPPORTED_BY_SOURCE", "CONFIGURATION_REQUIRED", "UNAVAILABLE_TEMPORARY", "NOT_APPLICABLE"}
_HARD_FAILURE = {"AMBIGUOUS_SOURCE", "BINDING_ERROR", "NORMALIZATION_ERROR"}


def _producer_bucket(quality: str | None, provenance: dict[str, Any]) -> str:
    q = str(quality or provenance.get("quality") or "").lower()
    if q.startswith("candidate:") or provenance.get("candidate_id"):
        return "resolved_source"
    if q.startswith("mobility_profile:") or "profile" in q:
        return "resolved_profile"
    if "configuration" in q or "manual_profile" in q:
        return "resolved_configuration"
    if q or provenance.get("derived_from"):
        return "resolved_derived"
    return "resolved_derived"


def normalized_property_coverage(manager: Any, public: Any, projection: Any) -> dict[str, Any]:
    totals = Counter()
    by_asset: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    for asset_id, asset in sorted(manager.assets.items()):
        rows = Counter()
        keys = public.available_property_keys(asset_id)
        for key in keys:
            value = public.property_value(asset_id, key)
            provenance = public.property_provenance(asset_id, key)
            quality = public.property_quality(asset_id, key)
            totals["normalized_properties_total"] += 1
            rows["normalized_properties_total"] += 1
            if value is not None:
                bucket = _producer_bucket(quality, provenance)
                totals[bucket] += 1
                rows[bucket] += 1
                continue
            reason = projection.availability_reason(asset_id, key, value, provenance)
            if reason == "UNSUPPORTED_BY_SOURCE":
                bucket = "not_available_source"
            elif reason == "CONFIGURATION_REQUIRED":
                bucket = "not_available_profile_or_configuration"
            elif reason == "UNAVAILABLE_TEMPORARY":
                bucket = "temporarily_unavailable"
            elif reason in _HARD_FAILURE:
                bucket = "hard_resolution_errors"
                failures.append({"asset_id": asset_id, "property_key": key, "reason": reason})
            elif reason in _ALLOWED_ABSENCE:
                bucket = "explicitly_unavailable"
            else:
                bucket = "unresolved_without_reason"
                failures.append({"asset_id": asset_id, "property_key": key, "reason": reason})
            totals[bucket] += 1
            rows[bucket] += 1
        by_asset.append({"asset_id": asset_id, "asset_type": asset.concept_id, **dict(rows)})
    totals.setdefault("hard_resolution_errors", 0)
    totals.setdefault("unresolved_without_reason", 0)
    return {**dict(totals), "by_asset": by_asset, "resolution_failures": failures[:100], "truncated_failures": len(failures) > 100}


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
        if "AMBIGUOUS" in status:
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
        "ambiguous": ambiguous[:100],
        "ambiguous_count": len(ambiguous),
        "unmapped_source_capabilities": unmapped[:100],
        "unmapped_source_capability_count": len(unmapped),
        "unclassified_source_capabilities": unclassified[:100],
        "unclassified_source_capability_count": len(unclassified),
        "truncated": any(len(rows) > 100 for rows in (ambiguous, unmapped, unclassified)),
    }


def completeness_gate(normalized: dict[str, Any], sources: dict[str, Any]) -> dict[str, Any]:
    blockers = {
        "ambiguous": int(sources.get("ambiguous_count", 0) or 0),
        "unmapped_source_capabilities": int(sources.get("unmapped_source_capability_count", 0) or 0),
        "unclassified_source_capabilities": int(sources.get("unclassified_source_capability_count", 0) or 0),
        "hard_resolution_errors": int(normalized.get("hard_resolution_errors", 0) or 0),
        "unresolved_without_reason": int(normalized.get("unresolved_without_reason", 0) or 0),
    }
    return {"status": "PASS" if not any(blockers.values()) else "FAIL", **blockers}
