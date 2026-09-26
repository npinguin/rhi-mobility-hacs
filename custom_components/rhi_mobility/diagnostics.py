"""Home Assistant config-entry diagnostics for RHI Mobility."""
from __future__ import annotations

from typing import Any

from .const import DOMAIN, FOUNDATION_DOMAIN_ID, RELEASE, SHARED_BASELINE_VERSION, SELECTED_BUILD_INPUT_REGISTRY_KEY
from .coverage import completeness_gate, normalized_property_coverage, source_capability_coverage
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
        return "unknown"


def _ha_projection_diagnostics(hass: Any, entry_id: str, manager: Any) -> dict[str, Any]:
    try:
        from homeassistant.helpers import device_registry as dr
        from homeassistant.helpers import entity_registry as er
        device_registry = dr.async_get(hass)
        entity_registry = er.async_get(hass)
    except Exception as exc:
        return {"status": "UNAVAILABLE", "error": type(exc).__name__}

    root = device_registry.async_get_device(identifiers={(DOMAIN, entry_id)})
    root_id = None if root is None else str(root.id)
    config_entries = list(er.async_entries_for_config_entry(entity_registry, entry_id))
    entities_by_device: dict[str, list[Any]] = {}
    binding_entries_by_asset: dict[str, list[Any]] = {}
    for row in config_entries:
        device_id = getattr(row, "device_id", None)
        if device_id:
            entities_by_device.setdefault(str(device_id), []).append(row)
        unique_id = str(getattr(row, "unique_id", "") or "")
        prefix = f"{DOMAIN}:"
        marker = ":source_binding:"
        if unique_id.startswith(prefix) and marker in unique_id:
            asset_id = unique_id[len(prefix):].split(marker, 1)[0]
            binding_entries_by_asset.setdefault(asset_id, []).append(row)
    device_entries = list(dr.async_entries_for_config_entry(device_registry, entry_id))
    rows = []
    source_reparenting = []

    for asset_id, asset in sorted(manager.assets.items()):
        logical = device_registry.async_get_device(identifiers={(DOMAIN, asset_id)})
        actual_parent_id = None if logical is None else getattr(logical, "via_device_id", None)
        expected_source_device_ids = sorted({
            str(ref.device_id)
            for binding in (getattr(asset, "source_bindings", {}) or {}).values()
            for ref in (getattr(binding, "inputs", {}) or {}).values()
            if getattr(ref, "device_id", None)
        })
        for source_device_id in expected_source_device_ids:
            source_device = device_registry.async_get(source_device_id)
            if source_device is not None and getattr(source_device, "via_device_id", None) == root_id:
                source_reparenting.append(source_device_id)

        binding_entries = list(binding_entries_by_asset.get(asset_id, ()))
        actual_binding_device_ids = sorted({
            str(row.device_id) for row in binding_entries if row.device_id
        })
        expected_set = set(expected_source_device_ids)
        actual_set = set(actual_binding_device_ids)
        topology_match = logical is not None and actual_parent_id is None
        rows.append({
            "asset_id": asset_id,
            "asset_type": getattr(asset, "concept_id", None),
            "lifecycle_status": _asset_lifecycle(manager, asset_id),
            "logical_device_id": None if logical is None else str(logical.id),
            "canonical_parent_asset_id": "mobility",
            "expected_parent_device_id": None,
            "actual_parent_device_id": actual_parent_id,
            "topology_match": topology_match,
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

    allowed_ids = set(manager.assets) | {entry_id}
    orphan_ids = []
    for device in device_entries:
        identifiers = set(getattr(device, "identifiers", set()) or set())
        mobility_ids = {str(value) for domain, value in identifiers if domain == DOMAIN}
        if mobility_ids & allowed_ids:
            continue
        if not entities_by_device.get(str(device.id)):
            orphan_ids.append(str(device.id))

    topology_mismatches = [row["asset_id"] for row in rows if not row["topology_match"]]
    binding_mismatches = [row["asset_id"] for row in rows if not row["binding_on_exact_source_device"]]
    status = "OK" if (
        root_id
        and not topology_mismatches
        and not binding_mismatches
        and not orphan_ids
        and not source_reparenting
    ) else "DEGRADED"
    return {
        "status": status,
        "root_device_id": root_id,
        "canonical_device_count": len(rows),
        "topology_match_count": len(rows) - len(topology_mismatches),
        "topology_mismatch_count": len(topology_mismatches),
        "topology_mismatch_asset_ids": topology_mismatches,
        "source_reparenting_count": len(set(source_reparenting)),
        "source_reparenting_device_ids": sorted(set(source_reparenting)),
        "binding_mismatch_count": len(binding_mismatches),
        "asset_rows": rows,
        "orphan_proxy_device_count": len(orphan_ids),
        "orphan_proxy_device_ids": orphan_ids[:20],
        "entry_entities_scanned": len(config_entries),
        "entry_devices_scanned": len(device_entries),
        "per_device_entity_registry_scans": 0,
    }


def _publication_diagnostics(hass: Any, energy_provider: Any = None) -> dict[str, Any]:
    entity_ids = (
        "sensor.rhi_mobility_energy_v2",
        "sensor.mobility_energy_asset_publication",
        "sensor.mobility_energy_contract_registry",
        "sensor.mobility_energy_publication_health",
    )
    direct_snapshot = (
        dict(energy_provider.snapshot() or {})
        if energy_provider is not None and callable(getattr(energy_provider, "snapshot", None))
        else {}
    )
    expected_consumers = list(direct_snapshot.get("consumer_assets") or [])
    expected_connections = list(direct_snapshot.get("connection_assets") or [])
    expected_consumer_ids = sorted(
        str(row.get("asset_id"))
        for row in expected_consumers
        if isinstance(row, dict) and row.get("asset_id")
    )
    expected_connection_ids = sorted(
        str(row.get("asset_id"))
        for row in expected_connections
        if isinstance(row, dict) and row.get("asset_id")
    )

    rows = []
    publication_match = True
    for entity_id in entity_ids:
        state = hass.states.get(entity_id)
        attrs = {} if state is None else dict(state.attributes or {})
        row = {
            "entity_id": entity_id,
            "live_state_present": state is not None,
            "state": None if state is None else state.state,
            "publication_revision": None if state is None else attrs.get("publication_revision"),
            "consumer_asset_count": None if state is None else len(attrs.get("consumer_assets") or []),
        }
        if entity_id in {"sensor.rhi_mobility_energy_v2", "sensor.mobility_energy_asset_publication"}:
            live_consumers = list(attrs.get("consumer_assets") or [])
            live_connections = list(attrs.get("connection_assets") or [])
            live_consumer_ids = sorted(
                str(item.get("asset_id"))
                for item in live_consumers
                if isinstance(item, dict) and item.get("asset_id")
            )
            live_connection_ids = sorted(
                str(item.get("asset_id"))
                for item in live_connections
                if isinstance(item, dict) and item.get("asset_id")
            )
            match = (
                live_consumer_ids == expected_consumer_ids
                and live_connection_ids == expected_connection_ids
            )
            publication_match = publication_match and match
            row.update({
                "direct_consumer_asset_count": len(expected_consumers),
                "direct_connection_asset_count": len(expected_connections),
                "live_consumer_asset_ids": live_consumer_ids,
                "direct_consumer_asset_ids": expected_consumer_ids,
                "missing_consumer_asset_ids": sorted(set(expected_consumer_ids) - set(live_consumer_ids)),
                "unexpected_consumer_asset_ids": sorted(set(live_consumer_ids) - set(expected_consumer_ids)),
                "live_connection_asset_ids": live_connection_ids,
                "direct_connection_asset_ids": expected_connection_ids,
                "publication_matches_direct_provider": match,
            })
        rows.append(row)
    return {
        "status": "OK" if all(row["live_state_present"] for row in rows) and publication_match else "DEGRADED",
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


def _v2_contract_diagnostics(data: dict[str, Any]) -> dict[str, Any]:
    """Bounded proof that canonical first-party V2 authorities are live."""
    public = data.get("public_provider")
    policy = data.get("policy_provider")
    experience = data.get("experience_provider")
    command = data.get("command_provider")
    energy = data.get("energy_provider")
    profile = data.get("profile_catalog_provider")
    activity = data.get("activity_provider")
    product_supervision = data.get("product_supervision_provider")

    public_snap = dict(public.snapshot() or {}) if public and callable(getattr(public, "snapshot", None)) else {}
    policy_snap = dict(policy.snapshot() or {}) if policy and callable(getattr(policy, "snapshot", None)) else {}
    experience_snap = dict(experience.snapshot() or {}) if experience and callable(getattr(experience, "snapshot", None)) else {}
    command_snap = dict(command.command_snapshot() or {}) if command and callable(getattr(command, "command_snapshot", None)) else {}
    energy_snap = dict(energy.snapshot() or {}) if energy and callable(getattr(energy, "snapshot", None)) else {}
    profile_snap = dict(profile.snapshot() or {}) if profile and callable(getattr(profile, "snapshot", None)) else {}
    activity_snap = dict(activity.snapshot() or {}) if activity and callable(getattr(activity, "snapshot", None)) else {}
    supervision_snap = dict(product_supervision.snapshot() or {}) if product_supervision and callable(getattr(product_supervision, "snapshot", None)) else {}

    return {
        "public_runtime": {
            "available": bool(public_snap),
            "contract_id": public_snap.get("contract_id"),
            "asset_count": len(public_snap.get("assets") or []),
            "relationship_count": len(public_snap.get("vehicle_charger_relationships") or []),
            "canonical": bool(public_snap.get("canonical")),
        },
        "policy": {
            "available": bool(policy_snap),
            "contract_id": policy_snap.get("contract_id"),
            "revision": policy_snap.get("revision"),
            "policy": policy_snap.get("policy") or {},
        },
        "experience": {
            "available": bool(experience_snap),
            "contract_id": experience_snap.get("contract_id"),
            "vehicle_count": len(experience_snap.get("vehicles") or []),
            "charger_count": len(experience_snap.get("chargers") or []),
        },
        "command": {
            "available": bool(command_snap),
            "contract_id": command_snap.get("contract_id"),
            "command_count": len(command_snap.get("commands") or []),
            "provider_id": "mobility.command.v2",
            "v1_provider_id_role": "compatibility_alias_same_provider",
        },
        "energy": {
            "available": bool(energy_snap),
            "contract_id": energy_snap.get("contract_id"),
            "consumer_asset_count": len(energy_snap.get("consumer_assets") or []),
            "connection_asset_count": len(energy_snap.get("connection_assets") or []),
            "command_provider_id": energy_snap.get("command_provider_id"),
            "contains_physical_bindings": bool(energy_snap.get("contains_physical_bindings")),
        },
        "profile_catalog": {
            "available": bool(profile_snap),
            "contract_id": profile_snap.get("contract_id"),
            "profile_count": len(profile_snap.get("profiles") or []),
        },
        "activity": {
            "available": bool(activity_snap),
            "contract_id": activity_snap.get("contract_id"),
            "activity_count": len(activity_snap.get("activities") or []),
        },
        "product_supervision": {
            "available": bool(supervision_snap),
            "contract_id": supervision_snap.get("contract_id"),
            "status": (supervision_snap.get("status") or {}).get("value"),
        },
        "configuration_surface": {
            "contract_id": "MOBILITY_PUBLIC_RUNTIME_V2",
            "transport": "canonical_property_entities",
            "write_metadata_owner": "rhi_mobility",
            "v1_semantic_owner": False,
        },
    }


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
            {
                "asset_id": asset_id,
                "asset_type": asset.concept_id,
                "profile_id": manager.effective_profile_id(asset_id),
                "identity": manager._profile_resolution_identity(asset_id),
            }
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
        "performance": {
            "setup_timings_ms": dict(data.get("setup_timings_ms") or {}),
            "setup_metrics": dict(data.get("setup_metrics") or {}),
            "startup_convergence_rebuild_required": bool(data.get("startup_convergence_rebuild_required")),
            "startup_handoff_revision_changed": bool(data.get("startup_handoff_revision_changed")),
            "projection": dict(data.get("projection_metrics") or {}),
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
        "v2_contracts": _v2_contract_diagnostics(data),
        "execution": {} if controller is None else controller.executor.snapshot(),
        "ha_projection": {} if manager is None else _ha_projection_diagnostics(hass, entry.entry_id, manager),
        "publication": {
            "publisher_domain": None if provider is None else provider.publisher_domain,
            "publication_revision": None if provider is None else provider.publication_revision,
            "specification_count": 0 if provider is None else len(provider.get_build_specifications()),
            "runtime_proof": _publication_diagnostics(hass, data.get("energy_provider")),
        },
    }
