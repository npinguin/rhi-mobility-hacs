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



def _asset_lifecycle(manager: Any, asset_id: str) -> str:
    try:
        return str(manager.configuration_value(asset_id, "asset.lifecycle_status", "active") or "active")
    except Exception:
        return "active"


def _ha_projection_diagnostics(hass: Any, entry_id: str, manager: Any) -> dict[str, Any]:
    try:
        from homeassistant.helpers import device_registry as dr
        from homeassistant.helpers import entity_registry as er
        device_registry = dr.async_get(hass)
        entity_registry = er.async_get(hass)
    except Exception as exc:
        return {"status": "UNAVAILABLE", "error": type(exc).__name__}

    config_entries = er.async_entries_for_config_entry(entity_registry, entry_id)
    rows = []
    for asset_id, asset in sorted(manager.assets.items()):
        logical = device_registry.async_get_device(identifiers={(DOMAIN, asset_id)})
        primary_source_device_id = str(getattr(asset, "source_device_id", "") or "")
        expected_source_device_ids = sorted({
            str(ref.device_id)
            for binding in (getattr(asset, "source_bindings", {}) or {}).values()
            for ref in (getattr(binding, "inputs", {}) or {}).values()
            if getattr(ref, "device_id", None)
        })
        binding_unique_prefix = f"{DOMAIN}:{asset_id}:source_binding:"
        binding_entries = [
            row for row in config_entries
            if str(getattr(row, "unique_id", "") or "").startswith(binding_unique_prefix)
        ]
        actual_binding_device_ids = sorted({
            str(row.device_id) for row in binding_entries if row.device_id
        })
        expected_set = set(expected_source_device_ids)
        actual_set = set(actual_binding_device_ids)
        rows.append({
            "asset_id": asset_id,
            "lifecycle_status": _asset_lifecycle(manager, asset_id),
            "logical_device_id": None if logical is None else logical.id,
            "primary_source_device_id": primary_source_device_id or None,
            "expected_source_device_ids": expected_source_device_ids,
            "source_devices_present": {
                device_id: device_registry.async_get(device_id) is not None
                for device_id in expected_source_device_ids
            },
            "binding_diagnostic_entity_ids": [row.entity_id for row in binding_entries],
            "binding_diagnostic_device_ids": actual_binding_device_ids,
            "missing_binding_source_device_ids": sorted(expected_set - actual_set),
            "unexpected_binding_device_ids": sorted(actual_set - expected_set),
            "binding_on_exact_source_device": expected_set == actual_set,
        })

    allowed_ids = set(manager.assets) | {
        entry_id,
        "mobility_intelligence",
        "vehicle_intelligence",
        "charger_intelligence",
    }
    orphan_ids = []
    for device in dr.async_entries_for_config_entry(device_registry, entry_id):
        identifiers = set(getattr(device, "identifiers", set()) or set())
        mobility_ids = {str(value) for domain, value in identifiers if domain == DOMAIN}
        if mobility_ids & allowed_ids:
            continue
        attached = er.async_entries_for_device(entity_registry, device.id, include_disabled_entities=True)
        if not attached:
            orphan_ids.append(str(device.id))
    return {
        "status": "OK" if not orphan_ids and all(row["binding_on_exact_source_device"] for row in rows) else "DEGRADED",
        "asset_rows": rows,
        "orphan_proxy_device_count": len(orphan_ids),
        "orphan_proxy_device_ids": orphan_ids[:20],
    }


def _publication_diagnostics(hass: Any) -> dict[str, Any]:
    entity_ids = (
        "sensor.mobility_energy_asset_publication",
        "sensor.mobility_energy_contract_registry",
        "sensor.mobility_energy_publication_health",
    )
    rows = []
    for entity_id in entity_ids:
        state = hass.states.get(entity_id)
        rows.append({
            "entity_id": entity_id,
            "live_state_present": state is not None,
            "state": None if state is None else state.state,
            "publication_revision": None if state is None else state.attributes.get("publication_revision"),
            "consumer_asset_count": None if state is None else len(state.attributes.get("consumer_assets") or []),
        })
    return {
        "status": "OK" if all(row["live_state_present"] for row in rows) else "DEGRADED",
        "entities": rows,
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
    lifecycle_counts = {"configured": 0, "active": 0, "disabled": 0}
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
            lifecycle = _asset_lifecycle(manager, asset_id)
            lifecycle_counts["configured"] += 1
            lifecycle_counts["disabled" if lifecycle == "disabled" else "active"] += 1
            resolutions = resolver.resolve_asset(asset_id)
            row = evaluate_asset_readiness(manager, controller, asset_id, resolutions.values()).as_dict()
            row["lifecycle_status"] = lifecycle
            row["operationally_active"] = lifecycle != "disabled"
            readiness.append(row)
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
            "configured_asset_count": lifecycle_counts["configured"],
            "active_runtime_asset_count": lifecycle_counts["active"],
            "disabled_configured_asset_count": lifecycle_counts["disabled"],
            "runtime_asset_count": 0 if manager is None else len(manager.assets),
            "legacy_snapshot_degraded_asset_count": 0 if manager is None else sum(
                1 for asset_id, s in manager.snapshots.items()
                if _asset_lifecycle(manager, asset_id) != "disabled" and s.health != "OK"
            ),
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
        "ha_projection": {} if manager is None else _ha_projection_diagnostics(hass, entry.entry_id, manager),
        "publication": {
            "publisher_domain": None if provider is None else provider.publisher_domain,
            "publication_revision": None if provider is None else provider.publication_revision,
            "specification_count": 0 if provider is None else len(provider.get_build_specifications()),
            "runtime_proof": _publication_diagnostics(hass),
        },
    }
