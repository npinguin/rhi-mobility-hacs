"""Home Assistant config-entry diagnostics for RHI Mobility."""
from __future__ import annotations

from typing import Any

from .const import DOMAIN, FOUNDATION_DOMAIN_ID, RELEASE, SHARED_BASELINE_VERSION, SELECTED_BUILD_INPUT_REGISTRY_KEY
from .coverage import completeness_gate, normalized_property_coverage, source_capability_coverage
from .profile_presentation import profile_metadata
from .property_resolver import PropertyResolver
from .readiness import evaluate_asset_readiness
from .relationship_resolution import resolve_vehicle_charger_relationship


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


def _charging_control_diagnostics(manager: Any, controller: Any) -> list[dict[str, Any]]:
    """Expose the resolved Mobility charging-control chain without source reinterpretation."""
    rows: list[dict[str, Any]] = []
    for asset_id, asset in sorted(manager.assets.items()):
        if asset.concept_id != "charger":
            continue
        snap = manager.snapshots.get(asset_id)
        values = {} if snap is None else snap.values
        quality = {} if snap is None else snap.quality
        profile = manager.control_profile(asset_id)
        envelope = manager.effective_charging_profile(asset_id)
        current = controller.requested_current_descriptor(asset_id)
        power = controller.requested_power_descriptor(asset_id)
        rows.append({
            "asset_id": asset_id,
            "profile_id": manager.effective_profile_id(asset_id),
            "measured_voltage_v": values.get("charger.voltage_v"),
            "measured_voltage_quality": quality.get("charger.voltage_v"),
            "nominal_voltage_v": values.get("charger.nominal_voltage_v"),
            "nominal_voltage_quality": quality.get("charger.nominal_voltage_v"),
            "profile_control_ready": profile is not None,
            "profile_phase_count": None if profile is None else profile.phase_count,
            "profile_min_current_a": None if profile is None else profile.min_current_a,
            "profile_max_current_a": None if profile is None else profile.max_current_a,
            "profile_current_step_a": None if profile is None else profile.current_step_a,
            "charging_envelope": None if envelope is None else dict(envelope),
            "physical_current_control_ready": current is not None,
            "physical_current_entity_id": None if current is None else current.source.entity_id,
            "physical_min_current_a": None if current is None else current.min_current_a,
            "physical_max_current_a": None if current is None else current.max_current_a,
            "physical_current_step_a": None if current is None else current.current_step_a,
            "requested_power_supported": power is not None,
            "requested_power_mode": None if power is None else power.mode,
            "requested_power_min_kw": None if power is None else power.min_power_kw,
            "requested_power_max_kw": None if power is None else power.max_power_kw,
            "requested_power_step_kw": None if power is None else power.step_power_kw,
            "effective_voltage_v": None if power is None else power.effective_voltage_v,
            "effective_phase_count": None if power is None else power.effective_phase_count,
            "requested_power_readback_kw": controller.requested_power_readback(asset_id),
            "power_kw": values.get("charger.power_kw"),
            "power_quality": quality.get("charger.power_kw"),
        })
    return rows


async def async_get_config_entry_diagnostics(hass: Any, entry: Any) -> dict[str, Any]:
    data = hass.data.get(DOMAIN, {}).get(entry.entry_id, {})
    manager = data.get("runtime")
    controller = data.get("controller")
    provider = data.get("provider")
    public = data.get("public_provider")
    domain_config = data.get("domain_config")
    handoff = _bounded_handoff(hass)
    normalized: dict[str, Any] = {}
    sources: dict[str, Any] = {}
    completeness: dict[str, Any] = {"status": "NOT_READY"}
    profiles: list[dict[str, Any]] = []
    readiness: list[dict[str, Any]] = []
    relationships: list[dict[str, Any]] = []
    resolution_evidence: list[dict[str, Any]] = []
    charging_control: list[dict[str, Any]] = []
    if manager is not None and public is not None and controller is not None:
        resolver = PropertyResolver(manager, public)
        normalized = normalized_property_coverage(manager, public)
        sources = source_capability_coverage(manager)
        completeness = completeness_gate(
            normalized,
            sources,
            configured_input_count=int(handoff.get("input_count", 0) or 0),
            materialized_asset_count=len(manager.assets),
        )
        profiles = [
            {"asset_id": asset_id, "asset_type": asset.concept_id, **profile_metadata(manager, asset_id)}
            for asset_id, asset in sorted(manager.assets.items())
        ]
        relationships = [
            resolve_vehicle_charger_relationship(manager, asset_id).as_dict()
            for asset_id, asset in sorted(manager.assets.items())
            if asset.concept_id == "vehicle"
        ]
        charging_control = _charging_control_diagnostics(manager, controller)
        for asset_id in sorted(manager.assets):
            resolutions = resolver.resolve_asset(asset_id)
            readiness.append(evaluate_asset_readiness(manager, controller, asset_id, resolutions.values()).as_dict())
            for property_id, resolution in resolutions.items():
                if len(resolution_evidence) >= 200:
                    break
                if resolution.failed or not resolution.available:
                    resolution_evidence.append(resolution.as_dict())
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
            "legacy_snapshot_degraded_asset_count": 0 if manager is None else sum(1 for s in manager.snapshots.values() if s.health != "OK"),
            "asset_readiness": readiness,
        },
        "configuration": {
            "foundation_handoff": handoff,
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
        "relationships": {
            "vehicle_charger": relationships,
            "typed_relationship_count": len(relationships),
        },
        "coverage": {
            "gate": completeness,
            "normalized_properties": normalized,
            "source_capabilities": sources,
            "typed_resolution_evidence": resolution_evidence,
            "typed_resolution_evidence_truncated": len(resolution_evidence) >= 200,
        },
        "presentation": {
            "profiles": profiles,
            "profile_count": len(profiles),
        },
        "charging_control": charging_control,
        "execution": {} if controller is None else controller.executor.snapshot(),
        "publication": {
            "publisher_domain": None if provider is None else provider.publisher_domain,
            "publication_revision": None if provider is None else provider.publication_revision,
            "specification_count": 0 if provider is None else len(provider.get_build_specifications()),
        },
    }
