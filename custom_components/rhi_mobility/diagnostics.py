"""Home Assistant config-entry diagnostics for RHI Mobility."""
from __future__ import annotations

from typing import Any

from .const import DOMAIN, FOUNDATION_DOMAIN_ID, RELEASE, SHARED_BASELINE_VERSION, SELECTED_BUILD_INPUT_REGISTRY_KEY
from .coverage import completeness_gate, normalized_property_coverage, source_capability_coverage
from .profile_presentation import profile_metadata


def _bounded_handoff(hass: Any) -> dict[str, Any]:
    registry = hass.data.get(SELECTED_BUILD_INPUT_REGISTRY_KEY, {}) or {}
    entry = registry.get(FOUNDATION_DOMAIN_ID)
    if not isinstance(entry, dict):
        return {"present": False, "input_count": 0}
    inputs = entry.get("inputs") if isinstance(entry.get("inputs"), list) else []
    summaries = []
    for item in inputs[:20]:
        if not isinstance(item, dict):
            continue
        groups = item.get("candidate_groups") if isinstance(item.get("candidate_groups"), list) else []
        evidence = item.get("candidate_evidence") if isinstance(item.get("candidate_evidence"), list) else []
        match_count = sum(len(g.get("candidate_matches") or []) for g in groups if isinstance(g, dict))
        summaries.append({
            "builder_id": item.get("builder_id"),
            "contract_version": item.get("contract_version"),
            "configuration_revision": item.get("configuration_revision"),
            "build_input_revision": item.get("build_input_revision"),
            "integration_domain": (item.get("selection") or {}).get("integration_domain"),
            "candidate_group_count": len(groups),
            "candidate_evidence_count": len(evidence),
            "candidate_match_count": match_count,
            "assessment": item.get("discovery_assessment"),
        })
    return {
        "present": True,
        "foundation_entry_id": entry.get("foundation_entry_id"),
        "configuration_revision": entry.get("configuration_revision"),
        "input_count": len(inputs),
        "inputs": summaries,
        "truncated": len(inputs) > 20,
    }


async def async_get_config_entry_diagnostics(hass: Any, entry: Any) -> dict[str, Any]:
    data = hass.data.get(DOMAIN, {}).get(entry.entry_id, {})
    manager = data.get("runtime")
    controller = data.get("controller")
    provider = data.get("provider")
    public = data.get("public_provider")
    domain_config = data.get("domain_config")
    normalized: dict[str, Any] = {}
    sources: dict[str, Any] = {}
    completeness: dict[str, Any] = {"status": "NOT_READY"}
    profiles: list[dict[str, Any]] = []
    if manager is not None and public is not None and controller is not None:
        from .property_projection import MobilityPropertyProjection
        projection = MobilityPropertyProjection(hass, manager, controller, public)
        normalized = normalized_property_coverage(manager, public, projection)
        sources = source_capability_coverage(manager)
        completeness = completeness_gate(normalized, sources)
        profiles = [
            {"asset_id": asset_id, "asset_type": asset.concept_id, **profile_metadata(manager, asset_id)}
            for asset_id, asset in sorted(manager.assets.items())
        ]
    return {
        "identity": {
            "domain": DOMAIN,
            "release": RELEASE,
            "shared_baseline_version": SHARED_BASELINE_VERSION,
            "entry_id": entry.entry_id,
        },
        "health": {
            "last_build_attempt": {} if manager is None else dict(manager.last_build_attempt),
            "runtime_asset_count": 0 if manager is None else len(manager.assets),
            "degraded_asset_count": 0 if manager is None else sum(1 for s in manager.snapshots.values() if s.health != "OK"),
        },
        "configuration": {
            "foundation_handoff": _bounded_handoff(hass),
            "domain_configuration_available": domain_config is not None,
        },
        "build_handoff": {} if manager is None else manager.diagnostics_snapshot(),
        "binding": {
            "accepted_binding_count": 0 if manager is None else len(manager.bindings),
            "selection_count": 0 if manager is None else len(manager._selection_asset_roles),
        },
        "compile": {
            "runtime_snapshot_count": 0 if manager is None else len(manager.snapshots),
            "relationship_count": 0 if manager is None else len(manager.effective_relationships),
        },
        "coverage": {
            "gate": completeness,
            "normalized_properties": normalized,
            "source_capabilities": sources,
        },
        "presentation": {
            "profiles": profiles,
            "profile_count": len(profiles),
        },
        "execution": {} if controller is None else controller.executor.snapshot(),
        "publication": {
            "publisher_domain": None if provider is None else provider.publisher_domain,
            "publication_revision": None if provider is None else provider.publication_revision,
            "specification_count": 0 if provider is None else len(provider.get_build_specifications()),
        },
    }
