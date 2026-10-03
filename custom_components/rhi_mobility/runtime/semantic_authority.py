from __future__ import annotations

from typing import Any

_KIND_FROM_QUALITY = {
    "mobility_domain_configuration": "CONFIGURED",
    "mobility_manual_profile": "CONFIGURED",
    "configured_assignment": "RELATIONSHIP",
    "mobility_domain_configuration_or_foundation_assignment": "RELATIONSHIP",
    "physical_setpoint_readback": "CONTROL_READBACK",
}


def producer_kind_from_quality(value: Any) -> str | None:
    text = str(value or "")
    if text.startswith("candidate:") or text in {"source_device_identity", "logical_asset_identity"}:
        return "SOURCE"
    if text.startswith("mobility_profile:"):
        return "PROFILE"
    if text == "mobility_profile_identity_match":
        return "DERIVED"
    if text.startswith("derived_from") or text.startswith("derived_") or text == "canonical_runtime_health":
        return "DERIVED"
    return _KIND_FROM_QUALITY.get(text)


def begin_source_paths(
    values: dict[str, Any],
    quality: dict[str, str],
) -> dict[str, dict[str, Any]]:
    paths: dict[str, dict[str, Any]] = {}
    for key in values:
        kind = producer_kind_from_quality(quality.get(key)) or "SOURCE"
        paths[key] = {
            "semantic_owner": "rhi_mobility",
            "candidate_producers": [kind],
            "selected_producer": kind,
            "selected_owner": "runtime/prebound.py",
            "resolution_owner": "runtime/semantic_authority.py",
            "conflicts": [],
        }
    return paths


def write_canonical(
    *,
    values: dict[str, Any],
    quality: dict[str, str],
    definitions: dict[str, Any],
    paths: dict[str, dict[str, Any]],
    conflicts: list[dict[str, Any]],
    key: str,
    value: Any,
    producer_kind: str,
    owner: str,
    quality_value: str,
) -> bool:
    """Resolve one candidate through the declared canonical precedence.

    This is the only post-source canonical write authority.  Callers contribute a
    candidate; this function decides whether it becomes effective truth.
    """
    if value is None:
        return False
    definition = definitions.get(key) or {}
    declared = [str(item) for item in definition.get("producer_types") or ()]
    precedence = [str(item) for item in definition.get("truth_precedence") or ()]

    path = paths.setdefault(
        key,
        {
            "semantic_owner": "rhi_mobility",
            "candidate_producers": [],
            "selected_producer": None,
            "selected_owner": None,
            "resolution_owner": "runtime/semantic_authority.py",
            "conflicts": [],
        },
    )
    if producer_kind not in path["candidate_producers"]:
        path["candidate_producers"].append(producer_kind)

    if declared and producer_kind not in declared:
        issue = {
            "property_id": key,
            "reason": "UNDECLARED_WRITER",
            "producer_kind": producer_kind,
            "owner": owner,
            "declared_producers": declared,
        }
        path["conflicts"].append(issue)
        conflicts.append(issue)
        return False

    current = path.get("selected_producer")
    current_owner = path.get("selected_owner")
    if key not in values or current is None:
        values[key] = value
        quality[key] = quality_value
        path["selected_producer"] = producer_kind
        path["selected_owner"] = owner
        return True

    if current == producer_kind:
        if current_owner not in (None, owner) and values.get(key) != value:
            issue = {
                "property_id": key,
                "reason": "MULTIPLE_EFFECTIVE_PRODUCERS",
                "producer_kind": producer_kind,
                "owners": sorted({str(current_owner), owner}),
            }
            path["conflicts"].append(issue)
            conflicts.append(issue)
            return False
        values[key] = value
        quality[key] = quality_value
        path["selected_owner"] = owner
        return True

    if not precedence or current not in precedence or producer_kind not in precedence:
        issue = {
            "property_id": key,
            "reason": "RESOLUTION_POLICY_MISSING",
            "current_producer": current,
            "candidate_producer": producer_kind,
            "owner": owner,
        }
        path["conflicts"].append(issue)
        conflicts.append(issue)
        return False

    if precedence.index(producer_kind) < precedence.index(current):
        values[key] = value
        quality[key] = quality_value
        path["selected_producer"] = producer_kind
        path["selected_owner"] = owner
        return True
    return False


def apply_derived_candidates(
    *,
    before_values: dict[str, Any],
    before_quality: dict[str, str],
    derived_values: dict[str, Any],
    derived_quality: dict[str, str],
    definitions: dict[str, Any],
    paths: dict[str, dict[str, Any]],
    conflicts: list[dict[str, Any]],
    owner: str,
) -> None:
    """Commit only values actually produced/changed by one derivation owner."""
    keys = set(derived_values) | set(before_values)
    for key in sorted(keys):
        if derived_values.get(key) == before_values.get(key) and derived_quality.get(key) == before_quality.get(key):
            continue
        write_canonical(
            values=before_values,
            quality=before_quality,
            definitions=definitions,
            paths=paths,
            conflicts=conflicts,
            key=key,
            value=derived_values.get(key),
            producer_kind="DERIVED",
            owner=owner,
            quality_value=str(derived_quality.get(key) or "derived"),
        )
