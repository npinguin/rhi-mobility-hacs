from __future__ import annotations
from typing import Any
import logging

_LOGGER = logging.getLogger(__name__)


class MobilityEnergyV2Provider:
    """Producer-owned Mobility -> Energy boundary.

    The contract contains Mobility semantics, readiness and exact command references only.
    Energy remains owner of planning, periodization, optimisation and value/accounting.
    """
    CONTRACT_ID = "MOBILITY_ENERGY_V2"

    def __init__(self, manager, controller, registry, public_provider=None) -> None:
        self.manager = manager
        self.controller = controller
        self.registry = registry
        self.public = public_provider

    def _v(self, aid: str, key: str):
        if self.public is not None:
            return self.public.property_value(aid, key)
        snap = self.manager.snapshots.get(aid)
        return None if snap is None else snap.values.get(key)

    def _source_metadata(self, asset_id: str) -> dict[str, Any]:
        fn = getattr(self.manager, "primary_source_metadata", None)
        return dict(fn(asset_id)) if callable(fn) else {}

    def _profile_exists(self, profile_id: Any) -> bool:
        if profile_id is None:
            return False
        fn = getattr(self.registry, "profile", None)
        if callable(fn):
            return fn(str(profile_id)) is not None
        profiles = getattr(self.registry, "profiles", None)
        if isinstance(profiles, dict):
            return str(profile_id) in profiles
        return False

    def _configured_charger(self, vehicle_id: str) -> str | None:
        return self.manager.effective_charger_for_vehicle(vehicle_id)

    def _mobility_editor_entity(self, asset_id: str) -> str | None:
        """Resolve the exact Mobility-owned requested-power editor entity when registered.

        This is an exact lookup by the V2 entity unique-id. It is never source discovery and
        never exposes the physical integration write target to Energy.
        """
        hass = getattr(self.manager, "hass", None)
        if hass is None:
            return None
        try:
            from homeassistant.helpers import entity_registry as er
            registry = er.async_get(hass)
            unique_id = f"rhi_mobility:{asset_id}:number:requested_power"
            return registry.async_get_entity_id("number", "rhi_mobility", unique_id)
        except Exception as exc:
            _LOGGER.debug("Mobility exact editor entity lookup unavailable asset_id=%s: %s", asset_id, exc)
            return None

    def _requested_power_write_contract(self, asset_id: str | None, desc: Any) -> dict[str, Any]:
        if not asset_id or desc is None:
            return {
                "requested_power_kw_write_owner": "rhi_mobility",
                "requested_power_kw_write_supported": False,
                "requested_power_kw_write_source_index": "sensor.mobility_charger_property_index",
                "requested_power_kw_write_asset_id": asset_id,
                "requested_power_kw_write_property_key": "charger.requested_charge_power_kw",
                "requested_power_kw_write_target_entity": None,
                "requested_power_kw_write_service_domain": "rhi_mobility",
                "requested_power_kw_write_service_action": "set_requested_power",
                "requested_power_kw_write_value_field": "power_kw",
                "requested_power_kw_write_min": None,
                "requested_power_kw_write_max": None,
                "requested_power_kw_write_step": None,
                "requested_power_kw_readback_property_key": "charger.requested_charge_power_kw",
                "requested_power_kw_readback_source_index": "sensor.mobility_charger_property_index",
                "physical_write_owner": "rhi_mobility",
                "physical_write_target_exposed_to_consumer": False,
                "physical_mapping_mode": None,
                "current_limit_a_write_supported": False,
            }
        return {
            "requested_power_kw_write_owner": "rhi_mobility",
            "requested_power_kw_write_supported": True,
            "requested_power_kw_write_source_index": "sensor.mobility_charger_property_index",
            "requested_power_kw_write_asset_id": asset_id,
            "requested_power_kw_write_property_key": "charger.requested_charge_power_kw",
            "requested_power_kw_write_target_entity": self._mobility_editor_entity(asset_id),
            "requested_power_kw_editor_unique_id": f"rhi_mobility:{asset_id}:number:requested_power",
            "requested_power_kw_write_service_domain": "rhi_mobility",
            "requested_power_kw_write_service_action": "set_requested_power",
            "requested_power_kw_write_value_field": "power_kw",
            "requested_power_kw_write_asset_field": "asset_id",
            "requested_power_kw_write_min": float(desc.min_power_kw),
            "requested_power_kw_write_max": float(desc.max_power_kw),
            "requested_power_kw_write_step": float(desc.step_power_kw),
            "requested_power_kw_readback_property_key": "charger.requested_charge_power_kw",
            "requested_power_kw_readback_source_index": "sensor.mobility_charger_property_index",
            "physical_write_owner": "rhi_mobility",
            "physical_write_target_exposed_to_consumer": False,
            "physical_mapping_mode": str(desc.mode),
            "current_limit_a_write_supported": bool(desc.mode == "current_limit"),
        }

    def _energy_need_resolution(self, lifecycle: str, snap: Any, soc: Any, target: Any, cap: Any, profile_id: Any, profile_resolved: bool) -> str:
        if lifecycle == "disabled":
            return "not_applicable_lifecycle_disabled"
        if getattr(snap, "health", None) == "STALE":
            return "stale_source"
        if soc is None:
            return "soc_unavailable"
        if target is None:
            return "target_unavailable"
        if cap is None:
            return "profile_invalid" if profile_id and not profile_resolved else "capacity_unavailable"
        return "resolved"

    @staticmethod
    def _lifecycle_reason(lifecycle: str) -> str:
        return "mobility_disabled" if lifecycle == "disabled" else "none"

    def _command_resolution(self, vehicle_id: str, charger_id: str | None, operation: str) -> dict[str, Any]:
        key = f"charger.command.{operation}"
        desc = self.controller.command_descriptors().get(f"{charger_id}:{key}") if charger_id else None
        return {
            "source_index": "sensor.mobility_command_index",
            "command_id": f"{vehicle_id}:vehicle.command.{operation}_charging",
            "consumer_asset_id": vehicle_id,
            "command_source_asset_id": charger_id,
            "logical_command_owner_asset_id": vehicle_id,
            "command_owner_asset_id": vehicle_id,
            "physical_executor_asset_id": charger_id,
            "command_key": f"vehicle.command.{operation}_charging",
            "binding_available": desc is not None,
            "action_available": bool(desc and desc.execution_allowed),
            "action_reason": desc.blocked_reason if desc and not desc.execution_allowed else ("binding_ready" if desc else "binding_missing"),
            "frontend_allowed": desc is not None,
            "execution_allowed": bool(desc and desc.execution_allowed),
            "blocked_reason": desc.blocked_reason if desc and not desc.execution_allowed else ("none" if desc else "binding_missing"),
            "effective_connection_id": charger_id,
            "physical_connection_id": charger_id if desc is not None else None,
            "proxy_target_connection_id": charger_id,
        }

    def _consumer(self, aid: str, snap) -> dict[str, Any]:
        charger_id = self._configured_charger(aid)
        charger = self.manager.snapshots.get(charger_id) if charger_id else None
        cvals = {} if charger is None else charger.values
        lifecycle = self._v(aid, "lifecycle_status") or "active"
        availability = self._v(aid, "asset.availability_state") or "unknown"
        profile_id = self._v(aid, "asset.profile_id")
        cap = self._v(aid, "vehicle.battery_capacity_kwh")
        soc = self._v(aid, "vehicle.soc_pct")
        target = self._v(aid, "vehicle.target_soc_pct")
        stored = self._v(aid, "vehicle.current_energy_kwh")
        target_energy = self._v(aid, "vehicle.target_energy_kwh")
        need = self._v(aid, "vehicle.energy_needed_kwh")
        if need is None:
            need = self._v(aid, "vehicle.required_energy_kwh")
        ready_by = self._v(aid, "vehicle.ready_by")
        present = self._v(aid, "vehicle.present")
        connection_state = cvals.get("charger.connection_state") if charger_id else None
        physical_connection = charger_id if connection_state == "asset_connected" else None
        operating = self._v(aid, "vehicle.charging_state")
        if operating is None and physical_connection:
            operating = cvals.get("charger.operating_state")
        power = self._v(aid, "vehicle.charge_power_kw")
        if power is None and physical_connection:
            power = cvals.get("charger.power_kw")
        flow = "unknown" if power is None else ("charging" if float(power) > 0.05 else "idle")
        planning_ready = lifecycle != "disabled" and soc is not None and target is not None and cap is not None
        profile_resolved = self._profile_exists(profile_id)
        energy_need_resolution = self._energy_need_resolution(lifecycle, snap, soc, target, cap, profile_id, profile_resolved)
        desc = self.controller.requested_power_descriptor(charger_id) if charger_id else None
        write_contract = self._requested_power_write_contract(charger_id, desc)
        requested_power = self.controller.requested_power_readback(charger_id) if charger_id else None
        requested_current = self.controller.requested_current_readback(charger_id) if charger_id else None
        effective = self.manager.effective_charging_profile(charger_id) if charger_id else None
        power_status = self.controller.requested_power_status(charger_id) if charger_id else {"pending_intent_power_kw": None, "unresolved_intent_power_kw": None}
        readback_ready = requested_power is not None
        mapping_ready = desc is not None
        execution_ready = bool(desc and physical_connection and lifecycle != "disabled")
        start = self._command_resolution(aid, charger_id, "start")
        stop = self._command_resolution(aid, charger_id, "stop")
        policy = self._v(aid, "vehicle.mobility_charge_policy") or "Automatic"
        mode = "disabled" if lifecycle == "disabled" else {"Automatic":"automatic","Forced":"forced","Paused":"paused"}.get(str(policy), "automatic")
        automation_allowed = bool(lifecycle != "disabled" and planning_ready and physical_connection and execution_ready)
        blocked = "none" if automation_allowed else ("lifecycle_disabled" if lifecycle == "disabled" else "planning_input_not_ready" if not planning_ready else "physical_connection_missing" if not physical_connection else "execution_not_ready")
        min_power = effective.get("min_power_kw") if effective else None
        max_power = effective.get("max_power_kw") if effective else None
        limits = {
            "min_power_kw": min_power,
            "max_power_kw": max_power,
            "capability_min_power_kw": min_power,
            "capability_max_power_kw": max_power,
            "requested_power_kw": requested_power,
            "requested_power_kw_effective_source": "mobility_physical_setpoint_readback" if requested_power is not None else None,
            "requested_power_kw_current_coherence": "ok" if requested_power is not None else "unresolved",
            "requested_current_limit_a": requested_current,
            "requested_current_limit_a_from_power_kw": requested_current,
            "current_limit_a": cvals.get("charger.current_limit_a") or requested_current,
            "current_limit_a_source": "physical_current_limit_readback" if requested_current is not None else None,
            "requested_power_kw_editable": desc is not None,
            **write_contract,
            "requested_power_edit_ready": mapping_ready and lifecycle != "disabled",
            "requested_power_physical_mapping_ready": mapping_ready,
            "requested_power_physical_readback_ready": readback_ready,
            "requested_power_feedback_mode": "physical_setpoint_readback" if readback_ready else "unavailable",
            "requested_power_execution_ready": execution_ready,
            "accepted_power_kw": requested_power,
            "setpoint_state": "UNRESOLVED" if power_status.get("unresolved_intent_power_kw") is not None else ("WRITE_PENDING" if power_status.get("pending_intent_power_kw") is not None else ("CONVERGED" if requested_power is not None else "UNKNOWN")),
            "setpoint_reason": "execution_unknown" if power_status.get("unresolved_intent_power_kw") is not None else ("write_pending" if power_status.get("pending_intent_power_kw") is not None else ("physical_readback" if requested_power is not None else "physical_readback_unavailable")),
            "nominal_voltage_v": effective.get("nominal_voltage_v") if effective else None,
            "effective_phase_count": effective.get("phase_count") if effective else None,
            "current_step_a": effective.get("current_step_a") if effective else None,
            "writable_min_current_a": effective.get("min_current_a") if effective else None,
            "writable_max_current_a": effective.get("max_current_a") if effective else None,
            "current_limit_a_readback": requested_current,
            "current_limit_a_physical_mapping_ready": bool(desc and desc.mode == "current_limit" and desc.effective_voltage_v is not None and desc.effective_phase_count is not None),
            "current_limit_a_physical_readback_ready": requested_current is not None,
        }
        readiness = {
            "planning_input_ready": planning_ready,
            "requested_power_edit_ready": limits["requested_power_edit_ready"],
            "requested_power_physical_mapping_ready": mapping_ready,
            "requested_power_physical_readback_ready": readback_ready,
            "requested_power_feedback_mode": limits["requested_power_feedback_mode"],
            "requested_power_execution_ready": execution_ready,
        }
        return {
            "asset_id": aid,
            "display_name": self._v(aid, "asset.display_name") or aid,
            "source_domain": "mobility",
            "source_asset_kind": "vehicle",
            "asset_type": "vehicle",
            "energy_asset_role": "flexible_load",
            "cluster_role": "standalone",
            "lifecycle_status": lifecycle,
            "lifecycle_reason": self._lifecycle_reason(lifecycle),
            "availability_state": availability,
            "availability_reason": "lifecycle_disabled" if lifecycle == "disabled" else ("none" if availability == "available" else str(self._v(aid, "vehicle.health_reason") or availability)),
            "energy_control_mode": mode,
            "energy_control_hold_state": "none",
            "energy_control_priority": "normal",
            "connection_state": connection_state or ("disconnected" if present is False else "unknown"),
            "assigned_connection_id": charger_id,
            "effective_connection_id": charger_id,
            "physical_connection_id": physical_connection,
            "operating_state": operating or "unknown",
            "power_kw": power,
            "energy_flow_direction": flow,
            "capacity_kwh": cap,
            "soc_pct": soc,
            "target_soc_pct": target,
            "stored_energy_kwh": stored,
            "target_energy_kwh": target_energy,
            "energy_to_target_kwh": need,
            "required_energy_kwh": need,
            "ready_by": ready_by,
            "energy_need_source": "mobility_derived_vehicle_target" if need is not None else None,
            "energy_need_resolution_state": energy_need_resolution,
            "soc_resolution_state": "resolved" if soc is not None else ("stale_source" if getattr(snap, "health", None) == "STALE" else "unresolved"),
            "soc_source": "mobility_property" if soc is not None else "unavailable",
            "profile_id": profile_id,
            "effective_profile_id": profile_id if profile_resolved else None,
            "profile_resolution_state": "resolved" if profile_resolved else "unresolved",
            "capacity_source": ("configuration" if self.manager.configuration_value(aid, "vehicle.battery_capacity_kwh", None) is not None else ("profile" if cap is not None and profile_resolved else ("source" if cap is not None else "unavailable"))),
            "planning_input_ready": planning_ready,
            "available_export_energy_kwh": None,
            "limits": limits,
            "readiness": readiness,
            "capabilities": {"start_supported": start["binding_available"], "stop_supported": stop["binding_available"], "adjust_power_supported": desc is not None},
            "automation": {"allowed": automation_allowed, "blocked_reason": blocked},
            "command_refs": {"start": "vehicle.command.start_charging", "stop": "vehicle.command.stop_charging"},
            "command_resolution": {"start": start, "stop": stop},
            "command_feedback": {"command_target_asset_id": aid, "command_target_connection_id": charger_id, "physical_connection_id": physical_connection, "feedback_property": "power_kw", "feedback_timeout_s": 120},
            "source_context": {"mobility": {"vehicle_present_at_home": present, "vehicle_physically_connected_to_charger": physical_connection is not None, "vehicle_can_receive_energy_now": automation_allowed, "legacy_energy_needed_kwh": need, "selected_charger": charger_id, "effective_charger": charger_id, "charger_available_for_control": self._v(charger_id, "charger.available_for_control") if charger_id else None}},
            "source_provenance": self._source_metadata(aid),
            "health": snap.health,
            "health_reason": getattr(snap, "health_reason", "none"),
        }

    def _connection(self, aid: str, snap) -> dict[str, Any]:
        vals = snap.values
        lifecycle = self._v(aid, "lifecycle_status") or "active"
        requested = self.controller.requested_power_readback(aid)
        requested_current = self.controller.requested_current_readback(aid)
        desc = self.controller.requested_power_descriptor(aid)
        write_contract = self._requested_power_write_contract(aid, desc)
        profile = self.manager.effective_charging_profile(aid)
        assigned = self.manager.configured_vehicle_for_charger(aid)
        commands = self.controller.command_descriptors()
        start = commands.get(f"{aid}:charger.command.start")
        stop = commands.get(f"{aid}:charger.command.stop")
        return {
            "asset_id": aid, "asset_type": "connection", "connection_type": "charger",
            "display_name": self._v(aid, "asset.display_name") or aid,
            "source_domain": "mobility", "source_asset_kind": "charger", "energy_asset_role": "connection",
            "lifecycle_status": lifecycle, "lifecycle_reason": self._lifecycle_reason(lifecycle),
            "availability_state": self._v(aid, "asset.availability_state") or "unknown",
            "availability_reason": getattr(snap, "health_reason", "none"),
            "connection_state": vals.get("charger.connection_state") or "unknown",
            "connected_asset_id": assigned,
            "operating_state": vals.get("charger.operating_state") or "unknown",
            "power_kw": vals.get("charger.power_kw"),
            "energy_flow_direction": "unknown" if vals.get("charger.power_kw") is None else ("to_connected_asset" if float(vals.get("charger.power_kw")) > 0.05 else "idle"),
            "limits": {
                "min_power_kw": profile.get("min_power_kw") if profile else None,
                "max_power_kw": profile.get("max_power_kw") if profile else None,
                "requested_power_kw": requested,
                "requested_current_limit_a": requested_current,
                "current_limit_a": vals.get("charger.current_limit_a") or requested_current,
                "requested_power_kw_editable": desc is not None,
                **write_contract,
                "requested_power_execution_ready": desc is not None and lifecycle != "disabled",
                "nominal_voltage_v": profile.get("nominal_voltage_v") if profile else self._v(aid, "charger.nominal_voltage_v"),
                "effective_phase_count": profile.get("phase_count") if profile else self._v(aid, "charger.phase_capability"),
                "current_limit_a_readback": requested_current,
                "current_limit_a_physical_mapping_ready": bool(desc and desc.mode == "current_limit" and desc.effective_voltage_v is not None and desc.effective_phase_count is not None),
                "current_limit_a_physical_readback_ready": requested_current is not None,
            },
            "readiness": {"requested_power_edit_ready": desc is not None and lifecycle != "disabled", "requested_power_physical_mapping_ready": desc is not None, "requested_power_physical_readback_ready": requested is not None, "requested_power_feedback_mode": "physical_setpoint_readback" if requested is not None else "unavailable", "requested_power_execution_ready": desc is not None and lifecycle != "disabled"},
            "capabilities": {"start_supported": start is not None, "stop_supported": stop is not None, "adjust_power_supported": desc is not None},
            "command_refs": {"start": "charger.command.start_charging", "stop": "charger.command.stop_charging"},
            "metering": {"lifetime_energy_kwh": self._v(aid, "charger.lifetime_energy_kwh"), "session_energy_kwh": self._v(aid, "charger.session_energy_kwh")},
            "source_provenance": self._source_metadata(aid),
            "health": snap.health, "health_reason": getattr(snap, "health_reason", "none"),
        }

    def snapshot(self) -> dict[str, Any]:
        consumer_assets = []
        connection_assets = []
        charging_relations = []
        counters = []
        for aid, snap in sorted(self.manager.snapshots.items()):
            if snap.concept_id == "vehicle":
                consumer_assets.append(self._consumer(aid, snap))
            elif snap.concept_id == "charger":
                connection_assets.append(self._connection(aid, snap))
        for rel in sorted(self.manager.effective_relationships.values(), key=lambda x: x.relationship_id):
            if rel.relationship_type != "configured_assignment":
                continue
            charger = self.manager.snapshots.get(rel.to_asset_id)
            cvals = charger.values if charger else {}
            desc = self.controller.requested_power_descriptor(rel.to_asset_id)
            commands = self.controller.command_descriptors()
            charging_relations.append({
                "relationship_id": rel.relationship_id, "vehicle_asset_id": rel.from_asset_id, "charger_asset_id": rel.to_asset_id,
                "relationship_health": rel.health, "connection_state": cvals.get("charger.connection_state"), "operating_state": cvals.get("charger.operating_state"),
                "actual_power_kw": cvals.get("charger.power_kw"), "actual_current_a": cvals.get("charger.actual_current_a"),
                "requested_power_kw": self.controller.requested_power_readback(rel.to_asset_id), "requested_current_limit_a": self.controller.requested_current_readback(rel.to_asset_id),
                "requested_power_supported": desc is not None,
                "command_ids": {key: cid for cid, row in commands.items() if row.asset_id == rel.to_asset_id for key in [row.command_key]},
                "vehicle_health": self.manager.snapshots.get(rel.from_asset_id).health if self.manager.snapshots.get(rel.from_asset_id) else None,
                "charger_health": None if charger is None else charger.health,
            })
            if charger and cvals.get("charger.energy_total_kwh") is not None:
                counters.append({"counter_id": f"counter.mobility.{rel.to_asset_id}.delivered_energy_total", "charger_asset_id": rel.to_asset_id, "connected_asset_id": rel.from_asset_id, "counter_key": "charger.energy_total_kwh", "value_kwh": cvals.get("charger.energy_total_kwh"), "direction": "to_connected_asset", "periodization_owner": "rhi_energy", "attribution_owner": "rhi_energy"})
        return {
            "contract_id": self.CONTRACT_ID, "publisher": "rhi_mobility",
            "consumer_assets": consumer_assets, "connection_assets": connection_assets,
            "charging_relations": charging_relations, "directional_connection_counters": counters,
            "command_provider_id": "mobility.command.v1", "contains_physical_bindings": False,
            "periodization_owner": "rhi_energy", "attribution_owner": "rhi_energy",
            "planning_owner": "rhi_energy", "physical_execution_owner": "rhi_mobility",
        }


class MobilityEnergyReadOnlyProvider:
    """Backward-compatible provider ID backed by the V2 Energy projection."""
    CONTRACT_ID = "MOBILITY_ENERGY_READ_ONLY_V1"

    def __init__(self, manager, registry, controller=None, public_provider=None) -> None:
        self.manager = manager
        self.registry = registry
        self.controller = controller
        self._v2 = MobilityEnergyV2Provider(manager, controller, registry, public_provider) if controller is not None else None

    def snapshot(self) -> dict[str, Any]:
        if self._v2 is None:
            return {"contract_id": self.CONTRACT_ID,"publisher":"rhi_mobility","read_only":True,"contains_commands":False,"contains_source_bindings":False,"assets":[],"relationships":[]}
        v2 = self._v2.snapshot()
        assets = []
        for row in v2["consumer_assets"]:
            facts = {"vehicle.soc_pct": row.get("soc_pct"), "vehicle.target_soc_pct": row.get("target_soc_pct"), "vehicle.required_energy_kwh": row.get("required_energy_kwh"), "vehicle.ready_by": row.get("ready_by"), "vehicle.charge_power_kw": row.get("power_kw"), "vehicle.charging_state": row.get("operating_state")}
            assets.append({"asset_id": row["asset_id"], "concept_id": "vehicle", "health": row["health"], "facts": {k:v for k,v in facts.items() if v is not None}})
        for row in v2["connection_assets"]:
            facts = {"charger.power_kw": row.get("power_kw"), "charger.energy_total_kwh": (row.get("metering") or {}).get("lifetime_energy_kwh"), "charger.connection_state": row.get("connection_state"), "charger.operating_state": row.get("operating_state")}
            assets.append({"asset_id": row["asset_id"], "concept_id": "charger", "health": row["health"], "facts": {k:v for k,v in facts.items() if v is not None}})
        return {"contract_id": self.CONTRACT_ID, "publisher": "rhi_mobility", "read_only": True, "contains_commands": False, "contains_source_bindings": False, "assets": assets, "relationships": [{"relationship_id": r.relationship_id,"relationship_type": r.relationship_type,"from_asset_id": r.from_asset_id,"to_asset_id": r.to_asset_id,"health": r.health} for r in self.manager.effective_relationships.values()], "canonical_successor": "MOBILITY_ENERGY_V2"}
