from __future__ import annotations
from typing import Any


class MobilityPublicRuntimeProvider:
    """Canonical Mobility V2 projection with complete R43.2.65 semantic coverage.

    The provider never revives V1 computation. It resolves the old property vocabulary
    onto one of the V2 owners: accepted source normalization, Mobility configuration,
    selected profile, relationship, control/readback, derivation or a pure alias.
    """
    CONTRACT_ID = "MOBILITY_PUBLIC_RUNTIME_V2"

    def __init__(self, manager, controller, registry) -> None:
        self.manager = manager
        self.controller = controller
        self.registry = registry
        semantic = dict(getattr(registry, "semantic_catalog", {}) or {})
        self.properties: dict[str, dict[str, Any]] = dict(semantic.get("properties") or {})
        self.aliases = dict(getattr(registry, "legacy_aliases", {}) or {})
        self.parity = dict(getattr(registry, "v1_drop_in_parity", {}) or {})  # reporting/acceptance only
        self._producer_types: dict[tuple[str, str], str] = {}
        for key, definition in self.properties.items():
            producer = definition.get("producer_type")
            for asset_type in definition.get("applicable_asset_types") or []:
                if producer:
                    self._producer_types[(str(asset_type), str(key))] = str(producer)

    def property_definition(self, property_key: str, asset_type: str | None = None) -> dict[str, Any] | None:
        base = self.properties.get(property_key)
        if base is None:
            return None
        out = dict(base)
        if asset_type:
            placement = (base.get("placements") or {}).get(asset_type)
            if isinstance(placement, dict):
                out.update({
                    "component_id": placement.get("component_id", out.get("component_id")),
                    "section_id": placement.get("section_id", out.get("section_id")),
                    "visibility": placement.get("visibility", out.get("visibility")),
                    "render_as": placement.get("render_as", out.get("render_as")),
                    "display_order": placement.get("display_order", out.get("display_order")),
                    "friendly_name": placement.get("friendly_name", out.get("friendly_name")),
                    "unit": placement.get("unit", out.get("unit")),
                    "empty_state_behavior": placement.get("empty_state_behavior", out.get("empty_state_behavior")),
                })
        return out

    def _snap(self, asset_id: str):
        return self.manager.snapshots.get(asset_id)

    def _asset(self, asset_id: str):
        return self.manager.assets.get(asset_id)

    def _canonical(self, key: str) -> str:
        return str(self.aliases.get(key, key))

    def _effective_charger(self, vehicle_id: str) -> str | None:
        return self.manager.effective_charger_for_vehicle(vehicle_id)

    def _source_observed_at(self, asset_id: str) -> str | None:
        asset = self._asset(asset_id)
        if asset is None:
            return None
        timestamps = []
        for binding in asset.source_bindings.values():
            for source in binding.inputs.values():
                if not source.entity_id:
                    continue
                state = self.manager.hass.states.get(source.entity_id)
                stamp = getattr(state, "last_updated", None) if state is not None else None
                if stamp is not None:
                    timestamps.append(stamp)
        if not timestamps:
            return None
        return max(timestamps).isoformat()

    def property_value(self, asset_id: str, property_key: str) -> Any:
        asset = self._asset(asset_id)
        snap = self._snap(asset_id)
        if asset is None:
            return None

        key = str(property_key)
        canonical = self._canonical(key)

        # Exact configuration/identity owners.
        configured = self.manager.configuration_value(asset_id, key, None)
        if configured is not None:
            return configured
        if key == "asset.display_name":
            return (snap.values.get("asset.display_name") if snap else None) or asset.display_name
        if key == "asset.short_name":
            return (snap.values.get("asset.short_name") if snap else None) or asset.display_name
        if key == "lifecycle_status":
            return (snap.values.get("asset.lifecycle_status") if snap else None) or self.manager.configuration_value(asset_id, "asset.lifecycle_status", "active")
        if key == "asset.selected_candidate_id":
            ids = sorted({src.candidate_id for b in asset.source_bindings.values() for src in b.inputs.values()})
            return ids[0] if len(ids) == 1 else None

        # Relationship owner.
        if key in {"vehicle.selected_charger", "vehicle.effective_charger"} and asset.concept_id == "vehicle":
            return self._effective_charger(asset_id)
        if key in {"charger.assigned_vehicle_id", "charger.effective_assigned_vehicle_id"} and asset.concept_id == "charger":
            return self.manager.configured_vehicle_for_charger(asset_id)
        if key == "charger.available_for_connection" and asset.concept_id == "charger":
            state = None if snap is None else snap.values.get("charger.connection_state")
            return None if state is None else state not in {"fault", "unknown"}

        # Physical control/readback owner. Requested intent never substitutes actual power/current.
        if key in {"charger.requested_power_kw", "charger.requested_charge_power_kw"} and asset.concept_id == "charger":
            return self.controller.requested_power_readback(asset_id)
        if key == "vehicle.requested_charge_power_kw" and asset.concept_id == "vehicle":
            cid = self._effective_charger(asset_id)
            return self.controller.requested_power_readback(cid) if cid else None
        if key == "limits.requested_current_limit_a" and asset.concept_id == "charger":
            readback = getattr(self.controller, "requested_current_readback", None)
            return readback(asset_id) if callable(readback) else None
        if key == "charger.available_for_control" and asset.concept_id == "charger":
            descriptors = getattr(self.controller, "command_descriptors", None)
            if not callable(descriptors):
                return None
            return any(r.asset_id == asset_id and r.execution_allowed for r in descriptors().values())
        if key == "vehicle.charge_mode" and asset.concept_id == "vehicle":
            readback = getattr(self.controller, "vehicle_charge_mode_readback", None)
            return readback(asset_id) if callable(readback) else None

        # Runtime health/evidence metadata.
        if key == "charger.snapshot_revision" and snap is not None:
            return snap.build_input_revision
        if key == "charger.observed_at":
            return self._source_observed_at(asset_id)
        if key == "charger.health" and snap is not None:
            return snap.health
        if key == "charger.health_reason" and snap is not None:
            return getattr(snap, "health_reason", None)

        # Canonical source/profile/config values already materialised by the manager.
        if snap is not None:
            if canonical in snap.values:
                return snap.values.get(canonical)
            if key in snap.values:
                return snap.values.get(key)

        # All canonical derivations are materialised by MobilityRuntimeManager.
        return None

    def property_quality(self, asset_id: str, property_key: str) -> str | None:
        asset = self._asset(asset_id)
        snap = self._snap(asset_id)
        if asset is None:
            return None
        key = str(property_key)
        canonical = self._canonical(key)
        if key != canonical:
            underlying = self.property_quality(asset_id, canonical)
            return underlying or f"compatibility_alias:{canonical}"
        if key in {"charger.requested_power_kw", "charger.requested_charge_power_kw", "vehicle.requested_charge_power_kw", "limits.requested_current_limit_a"}:
            return "physical_setpoint_readback" if self.property_value(asset_id, key) is not None else None
        if key in {"vehicle.selected_charger", "vehicle.effective_charger", "charger.assigned_vehicle_id", "charger.effective_assigned_vehicle_id"}:
            return "mobility_relationship" if self.property_value(asset_id, key) is not None else None
        if key in {"charger.available_for_control", "charger.available_for_connection", "charger.health", "charger.health_reason", "charger.snapshot_revision", "charger.observed_at"}:
            return "derived_runtime_evidence" if self.property_value(asset_id, key) is not None else None
        if snap is not None:
            if key in snap.quality:
                return snap.quality.get(key)
            if canonical in snap.quality:
                return snap.quality.get(canonical)
        if self.manager.configuration_value(asset_id, key, None) is not None:
            return "mobility_domain_configuration"
        return None

    @staticmethod
    def _source_ref_attributes(source, input_id: str | None = None) -> dict[str, Any]:
        out = {
            "source_integration": source.integration_domain,
            "source_device_id": source.device_id,
            "source_config_entry_id": source.config_entry_id,
            "source_entity_id": source.entity_id,
            "candidate_id": source.candidate_id,
            "raw_capability_id": source.raw_capability_id,
            "technical_capability": source.technical_capability,
            "source_input_id": input_id,
            "target_scope": source.target_scope,
        }
        return {k: v for k, v in out.items() if v is not None and v != ""}

    def property_provenance(self, asset_id: str, property_key: str) -> dict[str, Any]:
        asset = self._asset(asset_id)
        if asset is None:
            return {}
        key = str(property_key)
        canonical = self._canonical(key)
        if key != canonical:
            out = self.property_provenance(asset_id, canonical)
            out = dict(out)
            out["compatibility_alias_of"] = canonical
            out["normalization_status"] = "AVAILABLE" if self.property_value(asset_id, key) is not None else "UNKNOWN"
            return out

        # Exact controller source for writable/readback properties.
        charger_id = asset_id
        if key == "vehicle.requested_charge_power_kw":
            charger_id = self._effective_charger(asset_id) or ""
        if key in {"charger.requested_power_kw", "charger.requested_charge_power_kw", "vehicle.requested_charge_power_kw", "limits.requested_current_limit_a"} and charger_id:
            descriptor = getattr(self.controller, "requested_power_descriptor", None)
            desc = descriptor(charger_id) if callable(descriptor) else None
            if desc is not None:
                source = getattr(desc, "source", None)
                out = self._source_ref_attributes(source, "charger_current_limit_write" if desc.mode == "current_limit" else "charger_power_limit_write") if source is not None else {}
                out.update({"normalization_status": "AVAILABLE" if self.property_value(asset_id, key) is not None else "UNKNOWN", "quality": "physical_setpoint_readback"})
                return out

        provenance_fn = getattr(self.manager, "property_provenance", None)
        out = dict(provenance_fn(asset_id, key)) if callable(provenance_fn) else {}
        if not out and canonical != key:
            out = dict(self.manager.property_provenance(asset_id, canonical))
        if key in {"vehicle.selected_charger", "vehicle.effective_charger", "charger.assigned_vehicle_id", "charger.effective_assigned_vehicle_id"}:
            out["derived_from"] = ["mobility.configured_assignment"]
            out["quality"] = "mobility_relationship"
        # All other derived dependency provenance is owned by the canonical semantic catalog
        # and already supplied by MobilityRuntimeManager.property_provenance().
        out["normalization_status"] = "AVAILABLE" if self.property_value(asset_id, key) is not None else "UNKNOWN"
        return {k: v for k, v in out.items() if v is not None}

    def _producer_type(self, asset_type: str, property_key: str) -> str | None:
        return self._producer_types.get((asset_type, property_key))

    def _capability_supported_keys(self, asset_id: str) -> set[str]:
        supported = getattr(self.manager, "supported_property_keys", None)
        if callable(supported):
            return set(supported(asset_id))
        # Compatibility for isolated test managers only; production manager always owns this.
        keys: set[str] = set()
        asset = self._asset(asset_id)
        if asset is not None:
            for binding in asset.source_bindings.values():
                model = self.registry.builder_model(binding.builder_id)
                for input_id in binding.inputs:
                    rule = (model.get("input_rules") or {}).get(input_id) or {}
                    keys.update(str(k) for k in rule.get("outputs") or [])
        return keys

    def available_property_keys(self, asset_id: str) -> list[str]:
        asset = self._asset(asset_id)
        if asset is None:
            return []
        typ = asset.concept_id
        snap = self._snap(asset_id)
        supported = set(self._capability_supported_keys(asset_id))
        supported.update((snap.values if snap else {}).keys())

        # Non-source V1 semantics are stable product surfaces and remain present even if
        # their current value is unknown. Source-only properties are projected when the
        # selected object has matched/stale/missing evidence for that capability.
        for key, definition in self.properties.items():
            types = set(definition.get("applicable_asset_types") or [])
            if types and typ not in types:
                continue
            producer = self._producer_type(typ, key)
            if producer and producer != "SOURCE":
                supported.add(key)

        # Aliases follow their canonical supported key instead of becoming a second fact engine.
        for alias, canonical in self.aliases.items():
            definition = self.properties.get(alias) or {}
            types = set(definition.get("applicable_asset_types") or [])
            if (not types or typ in types) and canonical in supported:
                supported.add(alias)

        supported.update({"asset.lifecycle_status", "asset.availability_state", f"{typ}.health", f"{typ}.health_reason"})
        return sorted(k for k in supported if k in self.properties and (not self.properties[k].get("applicable_asset_types") or typ in self.properties[k].get("applicable_asset_types")))

    def available_scalar_properties(self) -> list[dict[str, Any]]:
        rows = []
        for asset_id, asset in sorted(self.manager.assets.items()):
            for key in self.available_property_keys(asset_id):
                definition = self.property_definition(key, asset.concept_id) or {}
                if definition.get("entity_type", "sensor") != "sensor":
                    continue
                rows.append({"asset_id": asset_id, "property_key": key, **definition})
        return rows

    def component_snapshot(self, asset_id: str) -> dict[str, Any]:
        asset = self._asset(asset_id)
        snap = self._snap(asset_id)
        if asset is None or snap is None:
            return {}
        components: dict[str, dict[str, Any]] = {}
        for key in self.available_property_keys(asset_id):
            definition = self.property_definition(key, asset.concept_id) or {}
            component_id = definition.get("component_id") or asset.concept_id
            section_id = definition.get("section_id") or "details"
            component = components.setdefault(component_id, {"component_id": component_id, "sections": {}})
            section = component["sections"].setdefault(section_id, {"section_id": section_id, "properties": {}})
            section["properties"][key] = {
                "value": self.property_value(asset_id, key),
                "unit": definition.get("unit"),
                "visibility": definition.get("visibility", "product"),
                "quality": self.property_quality(asset_id, key),
                "provenance": self.property_provenance(asset_id, key),
                "editable": bool(definition.get("editable", False)),
            }
        return {
            "asset_id": asset_id,
            "concept_id": asset.concept_id,
            "display_name": self.property_value(asset_id, "asset.display_name") or asset.display_name,
            "health": snap.health,
            "primary_source": (self.manager.primary_source_metadata(asset_id) if callable(getattr(self.manager, "primary_source_metadata", None)) else {}),
            "components": [
                {"component_id": c["component_id"], "sections": [c["sections"][k] for k in sorted(c["sections"])]}
                for c in (components[k] for k in sorted(components))
            ],
        }

    def snapshot(self) -> dict[str, Any]:
        return {
            "contract_id": self.CONTRACT_ID,
            "publisher": "rhi_mobility",
            "canonical": True,
            "v1_drop_in_parity": dict(self.parity.get("counts") or {}),
            "assets": [self.component_snapshot(aid) for aid in sorted(self.manager.assets)],
            "relationships": [
                {"relationship_id": r.relationship_id, "relationship_type": r.relationship_type, "from_asset_id": r.from_asset_id, "to_asset_id": r.to_asset_id, "health": r.health}
                for r in sorted(self.manager.effective_relationships.values(), key=lambda x: x.relationship_id)
            ],
            "command_provider_id": "mobility.command.v1",
            "raw_integration_state_public": False,
            "ux_inference_forbidden": True,
        }


class MobilityExperienceProvider:
    """Backend-owned Mobility conclusions matching the R43.2.65 intelligence families."""
    CONTRACT_ID = "MOBILITY_EXPERIENCE_V2"

    _ACCESS_KEYS = (
        "vehicle.security_state", "vehicle.lock_state", "vehicle.opening_state", "vehicle.plug_lock_state",
        "vehicle.doors_locked", "vehicle.windows_locked", "vehicle.trunk_state", "vehicle.hood_state",
        "vehicle.door_front_left_state", "vehicle.door_front_right_state", "vehicle.door_rear_left_state", "vehicle.door_rear_right_state",
        "vehicle.window_fl_state", "vehicle.window_fr_state", "vehicle.window_rl_state", "vehicle.window_rr_state",
    )

    def __init__(self, public_provider: MobilityPublicRuntimeProvider, registry) -> None:
        self.public = public_provider
        contract = registry.domain_model["experience_contract"]
        self.unsafe = set(contract["security_unsafe_values"])
        self.maintenance_attention = set(contract["maintenance_attention_values"])

    @staticmethod
    def _intel(state: str, severity: str, summary: str, reason: str, reason_type: str, source_quality: str, inputs: list[str], **extra) -> dict[str, Any]:
        return {"state": state, "severity": severity, "summary": summary, "reason": reason, "reason_type": reason_type, "source_quality": source_quality, "input_properties": inputs, **extra}

    def _v(self, aid: str, key: str):
        return self.public.property_value(aid, key)

    def _vehicle_row(self, asset_id: str) -> dict[str, Any]:
        lifecycle = self._v(asset_id, "lifecycle_status") or "active"
        availability = self._v(asset_id, "asset.availability_state") or "unknown"
        health = self._v(asset_id, "vehicle.health") or "UNKNOWN"
        if lifecycle == "disabled":
            readiness = self._intel("disabled", "normal", "Disabled", "Lifecycle disabled", "lifecycle_disabled", "configured", ["lifecycle_status"])
        elif availability == "available" and health == "OK":
            readiness = self._intel("ok", "normal", "Ready", "Ready", "ok", "derived", ["lifecycle_status", "asset.availability_state", "vehicle.health"])
        else:
            readiness = self._intel("attention" if health == "DEGRADED" else "unknown", "warning" if health == "DEGRADED" else "unknown", "Needs attention" if health == "DEGRADED" else "Readiness unknown", str(self._v(asset_id, "vehicle.health_reason") or availability), "runtime_health", "derived", ["lifecycle_status", "asset.availability_state", "vehicle.health"])

        total_range = self._v(asset_id, "vehicle.range_total_km")
        ev_range = self._v(asset_id, "vehicle.ev_range_km")
        if total_range is not None:
            reason = f"{ev_range:g} km electric" if isinstance(ev_range, (int, float)) else "Total range available"
            range_i = self._intel("ok", "normal", f"{float(total_range):g} km total", reason, "property_backed_range", "measured", ["vehicle.range_total_km", "vehicle.ev_range_km", "vehicle.range_ev_km", "vehicle.nominal_range_km", "vehicle.soc_pct"])
        elif ev_range is not None:
            range_i = self._intel("ok", "normal", f"{float(ev_range):g} km electric", "Electric range available", "property_backed_range", "measured", ["vehicle.ev_range_km", "vehicle.range_ev_km", "vehicle.nominal_range_km", "vehicle.soc_pct"])
        else:
            range_i = self._intel("unknown", "unknown", "No range data", "No range data", "no_range_data", "missing", ["vehicle.range_total_km", "vehicle.ev_range_km", "vehicle.nominal_range_km"])

        soc = self._v(asset_id, "vehicle.soc_pct")
        need = self._v(asset_id, "vehicle.energy_needed_kwh")
        if soc is not None:
            reason = f"{float(need):.2f} kWh to target" if need is not None else "Target energy unresolved"
            energy_i = self._intel("attention" if need is not None and float(need) > 0.05 else "ok", "warning" if need is not None and float(need) > 0.05 else "normal", f"{float(soc):.1f}%", reason, "soc_and_energy_to_target", "derived", ["vehicle.soc_pct", "vehicle.target_soc_pct", "vehicle.energy_needed_kwh", "vehicle.current_energy_kwh"])
        else:
            energy_i = self._intel("unknown", "unknown", "No battery data", "SoC unavailable", "soc_unavailable", "missing", ["vehicle.soc_pct", "vehicle.target_soc_pct", "vehicle.energy_needed_kwh"])

        charging_state = self._v(asset_id, "vehicle.charging_state") or self._v(asset_id, "vehicle.charge_state")
        power = self._v(asset_id, "vehicle.charge_power_kw")
        requested = self._v(asset_id, "vehicle.requested_charge_power_kw")
        if charging_state is None and power is None:
            charging_i = self._intel("unknown", "unknown", "No charging data", "No charging data", "no_charging_data", "missing", ["vehicle.charge_power_kw", "vehicle.charging_state", "vehicle.requested_charge_power_kw"])
        else:
            state = str(charging_state or ("charging" if isinstance(power, (int, float)) and power > 0.05 else "unknown"))
            summary = state.replace("_", " ").title()
            reason = f"Requested {float(requested):.2f} kW" if requested is not None else (f"{float(power):.2f} kW actual" if power is not None else state)
            charging_i = self._intel(state, "normal" if state not in {"fault", "unknown"} else "warning", summary, reason, "actual_vs_requested_power", "derived", ["vehicle.charge_power_kw", "vehicle.charging_state", "vehicle.requested_charge_power_kw"])

        access = {k: self._v(asset_id, k) for k in self._ACCESS_KEYS}
        access = {k: v for k, v in access.items() if v is not None}
        unsafe = sorted(k for k, v in access.items() if str(v).lower() in self.unsafe)
        if unsafe:
            security_i = self._intel("attention", "warning", "Check vehicle", "Unsafe/open state: " + ", ".join(unsafe), "property_backed_security", "measured", list(self._ACCESS_KEYS))
        elif access:
            security_i = self._intel("ok", "normal", "Secure", "No open/unlocked condition detected", "property_backed_security", "derived", list(self._ACCESS_KEYS))
        else:
            security_i = self._intel("unknown", "unknown", "No security data", "No security data", "no_security_data", "missing", list(self._ACCESS_KEYS))

        climate = self._v(asset_id, "vehicle.climate_state")
        remaining = self._v(asset_id, "vehicle.remaining_climate_time_s")
        if climate is None:
            comfort_i = self._intel("unknown", "unknown", "No comfort data", "Climate state unavailable", "no_comfort_data", "missing", ["vehicle.climate_state", "vehicle.remaining_climate_time_s", "vehicle.window_heating_state"])
        else:
            reason = f"{int(remaining)} s remaining" if isinstance(remaining, (int, float)) else str(climate)
            comfort_i = self._intel(str(climate), "normal", str(climate).replace("_", " ").title(), reason, "property_backed_comfort", "measured", ["vehicle.climate_state", "vehicle.remaining_climate_time_s", "vehicle.window_heating_state"])

        maintenance_keys = [
            "vehicle.oil_service_due_days", "vehicle.oil_service_due_km", "vehicle.oil_change_due_days", "vehicle.oil_change_due_distance_km",
            "vehicle.oil_level_state", "vehicle.oil_dipstick_state",
            "vehicle.inspection_due_days", "vehicle.inspection_due_km", "vehicle.inspection_interval_days", "vehicle.inspection_interval_km",
            "vehicle.tire_health_state", "vehicle.maintenance_state",
            "vehicle.tire_pressure_delta_fl_bar", "vehicle.tire_pressure_delta_fr_bar", "vehicle.tire_pressure_delta_rl_bar", "vehicle.tire_pressure_delta_rr_bar",
            "vehicle.tire_pressure_fl_bar", "vehicle.tire_pressure_fr_bar", "vehicle.tire_pressure_rl_bar", "vehicle.tire_pressure_rr_bar",
            "vehicle.tire_pressure_delta_spare_bar", "vehicle.tire_pressure_spare_bar",
        ]
        due_fields = {k: self._v(asset_id, k) for k in maintenance_keys}
        present = {k: v for k, v in due_fields.items() if v is not None}
        attention = [k for k, v in present.items() if (isinstance(v, (int, float)) and (k.endswith("due_days") or k.endswith("due_km") or "due_distance" in k) and v <= 0) or str(v).lower() in self.maintenance_attention]
        if attention:
            maint_state, sev = "attention", "warning"
        elif present:
            maint_state, sev = "ok", "normal"
        else:
            maint_state, sev = "unknown", "unknown"
        oil_days = due_fields.get("vehicle.oil_service_due_days") if due_fields.get("vehicle.oil_service_due_days") is not None else due_fields.get("vehicle.oil_change_due_days")
        oil_km = due_fields.get("vehicle.oil_service_due_km") if due_fields.get("vehicle.oil_service_due_km") is not None else due_fields.get("vehicle.oil_change_due_distance_km")
        insp_days = due_fields.get("vehicle.inspection_due_days")
        insp_km = due_fields.get("vehicle.inspection_due_km")
        summaries=[]
        if oil_days is not None: summaries.append(f"Oil in {int(oil_days)} d")
        elif oil_km is not None: summaries.append(f"Oil in {int(oil_km)} km")
        if insp_days is not None: summaries.append(f"Inspection in {int(insp_days)} d")
        elif insp_km is not None: summaries.append(f"Inspection in {int(insp_km)} km")
        summary = "; ".join(summaries) if summaries else ("No maintenance data" if not present else "Maintenance data available")
        pressure_values={k:v for k,v in due_fields.items() if "tire_pressure_" in k and v is not None}
        tire_attention=[k for k in attention if "tire_" in k]
        tire_state=due_fields.get("vehicle.tire_health_state") or ("attention" if tire_attention else ("ok" if pressure_values else "unknown"))
        maintenance_i = self._intel(maint_state, sev, summary, ", ".join(attention) if attention else summary, "structured_vehicle_maintenance" if present else "no_maintenance_data", "derived" if present else "missing", maintenance_keys,
            oil_service={"state": "attention" if any(k in attention for k in ("vehicle.oil_service_due_days","vehicle.oil_service_due_km","vehicle.oil_change_due_days","vehicle.oil_change_due_distance_km")) else ("ok" if oil_days is not None or oil_km is not None or due_fields.get("vehicle.oil_level_state") is not None else "unknown"), "days_remaining": oil_days, "km_remaining": oil_km, "oil_level_state": due_fields.get("vehicle.oil_level_state"), "oil_dipstick_state": due_fields.get("vehicle.oil_dipstick_state")},
            general_inspection={"state": "attention" if "vehicle.inspection_due_days" in attention or "vehicle.inspection_due_km" in attention else ("ok" if insp_days is not None or insp_km is not None else "unknown"), "days_remaining": insp_days, "km_remaining": insp_km, "interval_days": due_fields.get("vehicle.inspection_interval_days"), "interval_km": due_fields.get("vehicle.inspection_interval_km")},
            tires={"state": tire_state, "pressure_values_by_property": pressure_values, "attention_properties": tire_attention, "input_properties": [k for k in maintenance_keys if "tire_" in k]})

        freshness_inputs=["vehicle.last_seen", "vehicle.source_timestamp", "vehicle.source_vehicle_clock"]
        freshness_values=[self._v(asset_id,k) for k in freshness_inputs]
        freshness_value=next((v for v in freshness_values if v not in (None,"")), None)
        freshness_i=self._intel("fresh" if freshness_value is not None else "unknown", "normal" if freshness_value is not None else "unknown", "Source observed" if freshness_value is not None else "No freshness data", str(freshness_value) if freshness_value is not None else "No freshness data", "property_backed_freshness" if freshness_value is not None else "no_freshness_data", "measured" if freshness_value is not None else "missing", freshness_inputs)

        if lifecycle == "disabled":
            disabled=lambda inputs: self._intel("disabled", "normal", "Disabled", "Vehicle disabled", "lifecycle_disabled", "configured", inputs)
            range_i=disabled(["lifecycle_status"]); energy_i=disabled(["lifecycle_status"]); charging_i=disabled(["lifecycle_status"]); security_i=disabled(["lifecycle_status"]); comfort_i=disabled(["lifecycle_status"])
            maintenance_i=disabled(["lifecycle_status"]); maintenance_i.update({"oil_service":{"state":"disabled","summary":"Vehicle disabled","days_remaining":None,"km_remaining":None,"oil_level_state":None,"oil_dipstick_state":None},"general_inspection":{"state":"disabled","summary":"Vehicle disabled","days_remaining":None,"km_remaining":None},"tires":{"state":"disabled","summary":"Vehicle disabled","pressure_values_by_property":{},"attention_properties":[]}})
            freshness_i=disabled(["lifecycle_status"])

        return {
            "asset_id": asset_id,
            "asset_type": "vehicle",
            "display_name": self._v(asset_id, "asset.display_name") or asset_id,
            "lifecycle_status": lifecycle,
            "availability_state": availability,
            "readiness_intelligence": readiness,
            "range_intelligence": range_i,
            "energy_intelligence": energy_i,
            "charging_intelligence": charging_i,
            "security_intelligence": security_i,
            "comfort_intelligence": comfort_i,
            "maintenance_intelligence": maintenance_i,
            "freshness_intelligence": freshness_i,
        }

    def _charger_row(self, asset_id: str) -> dict[str, Any]:
        lifecycle = self._v(asset_id, "lifecycle_status") or "active"
        availability = self._v(asset_id, "asset.availability_state") or "unknown"
        assigned = self._v(asset_id, "charger.effective_assigned_vehicle_id")
        connection = self._v(asset_id, "charger.connection_state")
        operating = self._v(asset_id, "charger.operating_state")
        power = self._v(asset_id, "charger.power_kw")
        requested = self._v(asset_id, "charger.requested_charge_power_kw")
        current = self._v(asset_id, "charger.current_limit_a") or self._v(asset_id, "limits.requested_current_limit_a")
        observed = self._v(asset_id, "charger.observed_at")
        health = self._v(asset_id, "charger.health") or "UNKNOWN"

        availability_i = self._intel("ok" if availability == "available" else ("disabled" if lifecycle == "disabled" else "attention"), "normal" if availability == "available" or lifecycle == "disabled" else "warning", "Available" if availability == "available" else str(availability).replace("_", " ").title(), "Available" if availability == "available" else str(availability), "ok" if availability == "available" else "runtime_health", "derived", ["lifecycle_status", "asset.availability_state", "charger.health"])
        if connection in (None, "unknown"):
            connection_i = self._intel("unknown", "unknown", "No connection data", "No connection data", "unknown", "missing", ["charger.connection_state", "charger.connector_status"])
        else:
            connection_i = self._intel(str(connection), "normal" if connection != "fault" else "warning", str(connection).replace("_", " ").title(), str(connection), "connection_state", "measured", ["charger.connection_state", "charger.connector_status"])
        if assigned:
            vehicle_i = self._intel("connected" if connection == "asset_connected" else "assigned", "normal", f"Vehicle {assigned}", f"Assigned vehicle {assigned}", "connected_vehicle_context", "derived", ["charger.effective_assigned_vehicle_id", "charger.connection_state"], connected_vehicle_asset_id=assigned, connected_vehicle_display_name=self._v(assigned, "asset.display_name") or assigned)
        else:
            vehicle_i = self._intel("none", "normal", "No vehicle connected", "No vehicle connected", "connected_vehicle_context", "derived", ["charger.effective_assigned_vehicle_id", "charger.connection_state"], connected_vehicle_asset_id="", connected_vehicle_display_name="")
        if operating is None and power is None:
            charging_i = self._intel("unknown", "unknown", "No charging data", "No charging data", "no_charging_data", "missing", ["charger.power_kw", "charger.operating_state", "charger.requested_charge_power_kw"])
        else:
            state = str(operating or ("running" if isinstance(power, (int,float)) and power > 0.05 else "unknown"))
            reason = f"Requested {float(requested):.2f} kW" if requested is not None else (f"{float(power):.2f} kW actual" if power is not None else state)
            charging_i = self._intel(state, "warning" if state == "fault" else "normal", state.replace("_", " ").title(), reason, "actual_vs_requested_power", "derived", ["charger.power_kw", "charger.operating_state", "charger.requested_charge_power_kw"])
        power_i = self._intel("ok" if power is not None else "unknown", "normal" if power is not None else "unknown", f"{float(power):.2f} kW actual" if power is not None else "No actual power data", f"Requested {float(requested):.2f} kW" if requested is not None else "No requested power configured", "actual_and_requested_power", "measured" if power is not None else "missing", ["charger.power_kw", "charger.requested_charge_power_kw"])
        current_i = self._intel("ok" if current is not None else "unknown", "normal" if current is not None else "unknown", f"{float(current):.1f} A readback" if current is not None else "No current readback", "Physical/readback current" if current is not None else "No requested-current estimate", "integration_current_readback", "measured" if current is not None else "missing", ["charger.current_limit_a", "limits.requested_current_limit_a"])
        maintenance_i = self._intel("unknown", "unknown", "No maintenance data", "No maintenance data", "no_maintenance_data", "missing", ["charger.firmware_version", "charger.telemetry_state", "charger.health"])
        freshness_i = self._intel("fresh" if observed else "unknown", "normal" if observed else "unknown", "Source observed" if observed else "No freshness data", observed or "No freshness data", "source_observed_at" if observed else "no_freshness_data", "measured" if observed else "missing", ["charger.observed_at", "charger.snapshot_revision"])
        return {
            "asset_id": asset_id, "asset_type": "charger", "display_name": self._v(asset_id, "asset.display_name") or asset_id,
            "lifecycle_status": lifecycle, "availability_state": availability,
            "availability_intelligence": availability_i, "connection_intelligence": connection_i,
            "vehicle_intelligence": vehicle_i, "charging_intelligence": charging_i,
            "power_intelligence": power_i, "current_intelligence": current_i,
            "maintenance_intelligence": maintenance_i, "freshness_intelligence": freshness_i,
            "health": health,
        }

    def snapshot(self) -> dict[str, Any]:
        vehicles = [self._vehicle_row(aid) for aid, asset in sorted(self.public.manager.assets.items()) if asset.concept_id == "vehicle"]
        chargers = [self._charger_row(aid) for aid, asset in sorted(self.public.manager.assets.items()) if asset.concept_id == "charger"]
        return {"contract_id": self.CONTRACT_ID, "publisher": "rhi_mobility", "vehicles": vehicles, "chargers": chargers, "energy_planning_inference": False, "generic_truthiness_security": False, "not_evaluated_placeholders": False}


class MobilityActivityProvider:
    CONTRACT_ID = "MOBILITY_ACTIVITY_V2"

    def __init__(self, manager, controller) -> None:
        self.manager = manager
        self.controller = controller

    def snapshot(self) -> dict[str, Any]:
        activities = []
        for aid, snap in sorted(self.manager.snapshots.items()):
            if snap.concept_id == "charger":
                activities.append({"activity_id": f"activity.mobility.{aid}.charging", "asset_id": aid, "activity_type": "charging", "activity_state": snap.values.get("charger.operating_state", "unknown"), "summary": f"{aid} charger state", "power_kw": snap.values.get("charger.power_kw"), "health": snap.health})
            elif snap.concept_id == "vehicle":
                activities.append({"activity_id": f"activity.mobility.{aid}.vehicle", "asset_id": aid, "activity_type": "vehicle", "activity_state": snap.values.get("vehicle.charging_state", "unknown"), "summary": f"{aid} vehicle state", "power_kw": snap.values.get("vehicle.charge_power_kw"), "health": snap.health})
        for row in self.controller.executor.snapshot()["last_results"]:
            activities.append({"activity_id": f"activity.mobility.execution.{row['request_id']}", "asset_id": row["asset_id"], "activity_type": "execution", "activity_state": row["result"], "summary": row["operation_key"], "reason": row["reason"], "write_attempted": row["write_attempted"], "health": "OK" if row["result"] not in {"EXECUTION_UNKNOWN"} else "DEGRADED"})
        return {"contract_id": self.CONTRACT_ID, "publisher": "rhi_mobility", "activities": activities}
