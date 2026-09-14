from __future__ import annotations

from copy import deepcopy
from typing import Any, Callable

SemanticAdapter = Callable[[dict[str, Any]], dict[str, Any]]


def _integration_supports_input(rule: dict[str, Any], integration_domain: str) -> bool:
    return any(
        isinstance(match, dict) and match.get("integration_domain") == integration_domain
        for match in rule.get("integration_matches") or []
    )


def _prune_not_applicable_optional_groups(payload: dict[str, Any], registry) -> dict[str, Any]:
    """Drop empty optional groups that the selected integration does not implement.

    Foundation reports technical evidence. Mobility owns whether a canonical builder input is
    applicable to one supported integration. An optional input with no published integration
    rule and no evidence is simply not applicable; it is not invalid evidence. Unexpected
    evidence is deliberately retained so strict builder validation can fail closed.

    The returned object stays inside the frozen SelectedDomainBuildInput shape: this policy
    changes only candidate_groups and never adds domain-private fields to the shared contract.
    """
    if not isinstance(payload, dict):
        return payload
    builder_id = str(payload.get("builder_id") or "")
    selection = payload.get("selection") or {}
    integration_domain = str(selection.get("integration_domain") or "")
    if not builder_id or not integration_domain:
        return payload

    try:
        spec = registry.build_spec(builder_id)
    except Exception:
        return payload
    rules = {
        str(row.get("input_id")): row
        for row in ((spec.get("candidate_requirements") or {}).get("normalized_inputs") or [])
        if isinstance(row, dict) and row.get("input_id")
    }

    out = deepcopy(payload)
    kept: list[dict[str, Any]] = []
    for group in out.get("candidate_groups") or []:
        if not isinstance(group, dict):
            kept.append(group)
            continue
        input_id = str(group.get("input_id") or "")
        rule = rules.get(input_id)
        if not isinstance(rule, dict) or rule.get("required") is True:
            kept.append(group)
            continue
        if _integration_supports_input(rule, integration_domain):
            kept.append(group)
            continue
        candidate_ids = list(group.get("candidate_ids") or [])
        candidate_matches = list(group.get("candidate_matches") or [])
        if candidate_ids or candidate_matches:
            # Never hide unexpected technical evidence. The strict builder validates it.
            kept.append(group)
            continue
        # Optional + no rule for this integration + no evidence = not applicable.
    out["candidate_groups"] = kept
    return out


def _cupra_canonical_odometer_candidate(candidate: dict[str, Any]) -> bool:
    ident = candidate.get("source_identity") if isinstance(candidate, dict) else None
    if not isinstance(ident, dict):
        return False
    unique_id = str(ident.get("unique_id") or "")
    if "_" not in unique_id:
        return False
    return unique_id.split("_", 1)[1] in {"mileage", "mileage.value"}


def _candidate_device_group(candidate: dict[str, Any]) -> str | None:
    ident = candidate.get("source_identity") if isinstance(candidate, dict) else None
    if not isinstance(ident, dict):
        return None
    device_id = ident.get("device_registry_id")
    if not isinstance(device_id, str) or not device_id:
        target = ident.get("target") if isinstance(ident.get("target"), dict) else {}
        device_id = target.get("device_registry_id")
    return f"group_{device_id}" if isinstance(device_id, str) and device_id else None


def _adapt_cupra_vehicle(payload: dict[str, Any]) -> dict[str, Any]:
    """Resolve the Data Act canonical odometer field without touching technical identity."""
    out = deepcopy(payload)
    evidence = {
        str(row.get("candidate_id")): row
        for row in out.get("candidate_evidence") or []
        if isinstance(row, dict) and row.get("candidate_id")
    }
    resolved_issue_groups: set[str] = set()
    for group in out.get("candidate_groups") or []:
        if not isinstance(group, dict) or group.get("input_id") != "vehicle_odometer":
            continue
        original_ids = [str(value) for value in group.get("candidate_ids") or []]
        canonical_ids = [
            candidate_id
            for candidate_id in original_ids
            if _cupra_canonical_odometer_candidate(evidence.get(candidate_id) or {})
        ]
        if len(canonical_ids) != 1:
            continue
        accepted = canonical_ids[0]
        keep = {accepted}
        group["candidate_ids"] = canonical_ids
        group["candidate_count"] = 1
        group["candidate_matches"] = [
            row
            for row in group.get("candidate_matches") or []
            if isinstance(row, dict) and str(row.get("candidate_id") or "") in keep
        ]
        issue_group = _candidate_device_group(evidence.get(accepted) or {})
        if issue_group:
            resolved_issue_groups.add(issue_group)

    if not resolved_issue_groups:
        return out

    assessment = dict(out.get("discovery_assessment") or {})
    issues = [str(issue) for issue in assessment.get("issues") or []]
    remaining = []
    for issue in issues:
        is_odometer_cardinality = issue.startswith("cardinality_violation:vehicle_odometer:")
        belongs_to_resolved_group = any(f":{group_id}:" in issue for group_id in resolved_issue_groups)
        if is_odometer_cardinality and belongs_to_resolved_group:
            continue
        remaining.append(issue)
    assessment["issues"] = remaining
    if assessment.get("required_inputs_complete") is True and not remaining:
        assessment["topology_state"] = "unambiguous"
        assessment["review_required"] = False
    out["discovery_assessment"] = assessment
    return out


_ADAPTERS: dict[tuple[str, str], SemanticAdapter] = {
    ("mobility.vehicle.connected_vehicle.v1", "cupra_eu_data_act"): _adapt_cupra_vehicle,
}


def apply_semantic_input_policy(payload: dict[str, Any], registry) -> dict[str, Any]:
    """Apply Mobility-owned applicability and integration semantic disambiguation.

    New integrations extend the DBS first. They need an adapter only when equivalent technical
    evidence requires integration-specific semantic disambiguation; the runtime manager remains
    integration-agnostic.
    """
    out = _prune_not_applicable_optional_groups(payload, registry)
    if not isinstance(out, dict):
        return out
    selection = out.get("selection") or {}
    key = (str(out.get("builder_id") or ""), str(selection.get("integration_domain") or ""))
    adapter = _ADAPTERS.get(key)
    return adapter(out) if adapter is not None else out
