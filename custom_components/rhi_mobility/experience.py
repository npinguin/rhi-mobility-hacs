from __future__ import annotations
from typing import Any

try:
    from .visual_catalog import resolve_visual_ref
except ImportError:  # standalone contract tests load this file outside package context
    from pathlib import Path as _Path
    import runpy as _runpy
    resolve_visual_ref = _runpy.run_path(str(_Path(__file__).with_name("visual_catalog.py")))["resolve_visual_ref"]


def _vehicle_charger_relationship(manager, vehicle_id: str):
    # Keep relationship semantics owned by relationship_resolution. Import lazily so
    # this pure provider remains import-safe for contract/unit tooling.
    try:
        from .relationship_resolution import resolve_vehicle_charger_relationship
    except ImportError:
        # Standalone contract tests load this module outside package context.
        import importlib.util
        import sys
        from pathlib import Path
        path = Path(__file__).with_name("relationship_resolution.py")
        name = "_rhi_mobility_relationship_resolution"
        module = sys.modules.get(name)
        if module is None:
            spec = importlib.util.spec_from_file_location(name, path)
            module = importlib.util.module_from_spec(spec)
            sys.modules[name] = module
            spec.loader.exec_module(module)
        resolve_vehicle_charger_relationship = module.resolve_vehicle_charger_relationship
    return resolve_vehicle_charger_relationship(manager, vehicle_id)


class MobilityExperienceProvider:
    """Backend-owned Mobility conclusions matching the R43.2.65 intelligence families."""
    CONTRACT_ID = "MOBILITY_EXPERIENCE_V2"

    # Vehicle access security only. The charging-plug lock belongs to connector/
    # charging semantics and must never make an otherwise secured vehicle unsafe.
    _SECURITY_SUMMARY_KEYS = ("vehicle.security_state",)
    _ACCESS_KEYS = (
        "vehicle.lock_state",
        "vehicle.doors_locked", "vehicle.windows_locked", "vehicle.trunk_state", "vehicle.hood_state",
        "vehicle.door_front_left_state", "vehicle.door_front_right_state", "vehicle.door_rear_left_state", "vehicle.door_rear_right_state",
        "vehicle.window_fl_state", "vehicle.window_fr_state", "vehicle.window_rl_state", "vehicle.window_rr_state",
    )

    def __init__(self, manager, controller, registry, policy_provider=None) -> None:
        self.manager = manager
        self.controller = controller
        from .property_resolver import PropertyResolver
        self.resolver = PropertyResolver(manager, controller, registry=registry)
        self.policy = policy_provider
        contract = registry.domain_model["experience_contract"]
        self.unsafe = set(contract["security_unsafe_values"])
        self.maintenance_attention = set(contract["maintenance_attention_values"])

    @staticmethod
    def _intel(state: str, severity: str, summary: str, reason: str, reason_type: str, source_quality: str, inputs: list[str], **extra) -> dict[str, Any]:
        return {"state": state, "severity": severity, "summary": summary, "reason": reason, "reason_type": reason_type, "source_quality": source_quality, "input_properties": inputs, **extra}

    def _v(self, aid: str, key: str):
        resolution = self.resolver.resolve(aid, key)
        return resolution.value if resolution.available else None

    def _policy(self, key: str, default: Any) -> Any:
        if self.policy is None:
            return default
        try:
            return self.policy.value(key)
        except Exception:
            return default

    @property
    def policy_revision(self) -> int:
        return int(getattr(self.policy, "revision", 0) or 0)

    def _configuration_status(self, asset_id: str, asset_type: str) -> dict[str, Any]:
        identity_state = str(self._v(asset_id, f"{asset_type}.identity_status") or "unresolved").lower()
        profile_id = self._v(asset_id, "asset.profile_id")
        brand = self._v(asset_id, f"{asset_type}.brand")
        if brand is None and asset_type == "vehicle":
            brand = self._v(asset_id, "vehicle.manufacturer")
        if brand is None and asset_type == "charger":
            brand = self._v(asset_id, "charger.vendor")
        model = self._v(asset_id, f"{asset_type}.model")
        missing = []
        if profile_id in (None, ""):
            if brand in (None, ""):
                missing.append(f"{asset_type}.brand")
            if model in (None, ""):
                missing.append(f"{asset_type}.model")
        complete = identity_state in {"resolved", "custom"} or (profile_id not in (None, ""))
        return {
            "state": "complete" if complete else "incomplete",
            "missing_required_fields": [] if complete else missing or ["product_identity_confirmation"],
            "reasons": [] if complete else [f"identity_status:{identity_state}"],
            "profile_id": profile_id,
        }

    def _runtime_data_health(self, asset_id: str, lifecycle: str) -> dict[str, Any]:
        if lifecycle == "disabled":
            return {"state": "unavailable", "reasons": ["lifecycle_disabled"]}
        manager = self.manager
        if manager is None:
            return {"state": "unavailable", "reasons": ["runtime_manager_unavailable"]}
        snap = manager.snapshots.get(asset_id)
        if snap is None:
            return {"state": "unavailable", "reasons": ["runtime_snapshot_missing"]}
        attempt = dict(getattr(manager, "last_build_attempt", {}) or {})
        if str(attempt.get("status") or "").upper() == "STALE":
            return {"state": "stale", "reasons": [str(attempt.get("reason") or "foundation_handoff_stale")]}
        stale_inputs = sorted({
            str(row.get("input_id") or "capability")
            for row in getattr(manager, "_capability_diagnostics", ()) or ()
            if isinstance(row, dict)
            and str(row.get("asset_id") or "") == asset_id
            and str(row.get("status") or "").upper() == "STALE"
        })
        if stale_inputs:
            return {"state": "stale", "reasons": [f"{key}:stale" for key in stale_inputs]}
        if str(getattr(snap, "health", "UNKNOWN")).upper() != "OK":
            reason = str(getattr(snap, "health_reason", "") or "runtime_health_not_ok")
            return {"state": "partial", "reasons": [reason]}
        return {"state": "healthy", "reasons": []}

    def _charging_relationship(self, asset_id: str) -> dict[str, Any]:
        manager = self.manager
        if manager is None:
            return {
                "vehicle_id": asset_id,
                "configured_charger_id": None,
                "effective_charger_id": None,
                "physically_connected_charger_id": None,
                "relationship_status": "UNKNOWN",
                "observed_identity_proven": False,
                "reason": "runtime_manager_unavailable",
            }
        return _vehicle_charger_relationship(manager, asset_id).as_dict()

    def _charge_demand(self, asset_id: str, lifecycle: str) -> dict[str, Any]:
        if lifecycle == "disabled":
            return {"state": "unknown", "energy_needed_kwh": None, "target_soc_pct": self._v(asset_id, "vehicle.target_soc_pct"), "ready_by": self._v(asset_id, "vehicle.ready_by"), "reason": "lifecycle_disabled"}
        need = self._v(asset_id, "vehicle.energy_needed_kwh")
        target = self._v(asset_id, "vehicle.target_soc_pct")
        ready_by = self._v(asset_id, "vehicle.ready_by")
        inputs = {
            "vehicle.soc_pct": self._v(asset_id, "vehicle.soc_pct"),
            "vehicle.target_soc_pct": target,
            "vehicle.battery_capacity_kwh": self._v(asset_id, "vehicle.battery_capacity_kwh"),
        }
        if need is None:
            missing = [key for key, value in inputs.items() if value is None]
            state = "incomplete" if missing else "unknown"
            reason = "missing:" + ",".join(missing) if missing else "derived_energy_need_unavailable"
            return {"state": state, "energy_needed_kwh": None, "target_soc_pct": target, "ready_by": ready_by, "reason": reason}
        threshold = float(self._policy("charging.minimum_demand_kwh", 0.5))
        state = "needed" if float(need) > threshold else "satisfied"
        return {"state": state, "energy_needed_kwh": float(need), "target_soc_pct": target, "ready_by": ready_by, "reason": f"minimum_demand_kwh:{threshold:g}"}

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
        low_range_km = float(self._policy("range.low_range_km", 100.0))
        effective_range = total_range if total_range is not None else ev_range
        if effective_range is not None:
            range_state = "low" if float(effective_range) < low_range_km else "ok"
            severity = "warning" if range_state == "low" else "normal"
            if total_range is not None:
                summary = f"{float(total_range):g} km total"
                reason = f"{ev_range:g} km electric" if isinstance(ev_range, (int, float)) else f"Low-range threshold {low_range_km:g} km"
            else:
                summary = f"{float(ev_range):g} km electric"
                reason = f"Low-range threshold {low_range_km:g} km"
            range_i = self._intel(range_state, severity, summary, reason, "policy_classified_range", "derived", ["vehicle.range_total_km", "vehicle.ev_range_km", "vehicle.range_ev_km", "vehicle.nominal_range_km"], threshold_km=low_range_km, policy_revision=self.policy_revision)
        else:
            range_i = self._intel("unknown", "unknown", "No range data", "No range data", "no_range_data", "missing", ["vehicle.range_total_km", "vehicle.ev_range_km", "vehicle.nominal_range_km"], threshold_km=low_range_km, policy_revision=self.policy_revision)

        soc = self._v(asset_id, "vehicle.soc_pct")
        charge_demand = self._charge_demand(asset_id, str(lifecycle).lower())
        need = charge_demand.get("energy_needed_kwh")
        if soc is not None:
            reason = f"{float(need):.2f} kWh to target" if need is not None else charge_demand.get("reason", "Target energy unresolved")
            energy_i = self._intel("attention" if charge_demand["state"] == "needed" else ("ok" if charge_demand["state"] == "satisfied" else "unknown"), "warning" if charge_demand["state"] == "needed" else ("normal" if charge_demand["state"] == "satisfied" else "unknown"), f"{float(soc):.1f}%", str(reason), "charge_demand_v2", "derived", ["vehicle.soc_pct", "vehicle.target_soc_pct", "vehicle.energy_needed_kwh", "vehicle.current_energy_kwh"], charge_demand_state=charge_demand["state"], policy_revision=self.policy_revision)
        else:
            energy_i = self._intel("unknown", "unknown", "No battery data", "SoC unavailable", "soc_unavailable", "missing", ["vehicle.soc_pct", "vehicle.target_soc_pct", "vehicle.energy_needed_kwh"], charge_demand_state=charge_demand["state"], policy_revision=self.policy_revision)

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
        summary_access = {k: self._v(asset_id, k) for k in self._SECURITY_SUMMARY_KEYS}
        summary_access = {k: v for k, v in summary_access.items() if v is not None}
        # Only explicit access/opening evidence may assert an unsafe vehicle.
        # Generic integration security summaries are advisory: some providers fold
        # charge-port/flap state into them. Treating such an aggregate as proof of
        # an unlocked cabin creates false security alarms (observed on VW ID.4).
        unsafe = sorted(k for k, v in access.items() if str(v).lower() in self.unsafe)

        lock_keys = ("vehicle.lock_state", "vehicle.doors_locked")
        door_keys = (
            "vehicle.door_front_left_state", "vehicle.door_front_right_state",
            "vehicle.door_rear_left_state", "vehicle.door_rear_right_state",
            "vehicle.trunk_state", "vehicle.hood_state",
        )
        window_keys = ("vehicle.window_fl_state", "vehicle.window_fr_state", "vehicle.window_rl_state", "vehicle.window_rr_state")
        lock_proven = any(k in access and str(access[k]).lower() not in self.unsafe for k in lock_keys)
        # Generic opening aggregates are deliberately excluded from occupant/access
        # security. Integrations may fold charging-port/flap state into such an
        # aggregate; only explicit lock/door/hood/trunk evidence is authoritative.
        doors_closed = (
            ("vehicle.doors_locked" in access and str(access["vehicle.doors_locked"]).lower() not in self.unsafe)
            or all(k in access and str(access[k]).lower() not in self.unsafe for k in door_keys)
        )
        windows_closed = (
            ("vehicle.windows_locked" in access and str(access["vehicle.windows_locked"]).lower() not in self.unsafe)
            or all(k in access and str(access[k]).lower() not in self.unsafe for k in window_keys)
        )
        coverage = {"lock": lock_proven, "doors": doors_closed, "windows": windows_closed}
        required_coverage = list(self._policy("security.required_coverage", ["lock", "doors", "windows"]))
        missing_coverage = [name for name in required_coverage if not coverage.get(name, False)]
        secure_proven = not missing_coverage

        security_inputs = [*self._ACCESS_KEYS, *self._SECURITY_SUMMARY_KEYS]
        if unsafe:
            security_i = self._intel("unsafe", "warning", "Unsafe", "Unsafe/open state: " + ", ".join(unsafe), "property_backed_security", "measured", security_inputs, unsafe_properties=unsafe, missing_coverage=missing_coverage, required_coverage=required_coverage, advisory_summary=summary_access, policy_revision=self.policy_revision)
        elif access and secure_proven:
            security_i = self._intel("secure", "normal", "Secure", "Required security coverage confirms the vehicle is secured", "property_backed_security", "derived", security_inputs, unsafe_properties=[], missing_coverage=[], required_coverage=required_coverage, advisory_summary=summary_access, policy_revision=self.policy_revision)
        elif access:
            security_i = self._intel("incomplete", "unknown", "Security incomplete", "Missing authoritative coverage: " + ", ".join(missing_coverage), "partial_security_coverage", "partial", security_inputs, unsafe_properties=[], missing_coverage=missing_coverage, required_coverage=required_coverage, advisory_summary=summary_access, policy_revision=self.policy_revision)
        elif summary_access:
            security_i = self._intel("incomplete", "unknown", "Security incomplete", "Only a generic security summary is available; explicit access evidence is required", "generic_security_summary_not_authoritative", "partial", security_inputs, unsafe_properties=[], missing_coverage=required_coverage, required_coverage=required_coverage, advisory_summary=summary_access, policy_revision=self.policy_revision)
        else:
            security_i = self._intel("unknown", "unknown", "No security data", "No security data", "no_security_data", "missing", security_inputs, unsafe_properties=[], missing_coverage=required_coverage, required_coverage=required_coverage, advisory_summary={}, policy_revision=self.policy_revision)

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
            "vehicle.engine_warning_state", "vehicle.coolant_level_warning_state",
            "vehicle.brake_fluid_warning_state", "vehicle.wash_water_warning_state",
            "vehicle.starter_battery_state",
            "vehicle.tire_pressure_delta_fl_bar", "vehicle.tire_pressure_delta_fr_bar", "vehicle.tire_pressure_delta_rl_bar", "vehicle.tire_pressure_delta_rr_bar",
            "vehicle.tire_pressure_fl_bar", "vehicle.tire_pressure_fr_bar", "vehicle.tire_pressure_rl_bar", "vehicle.tire_pressure_rr_bar",
            "vehicle.tire_pressure_delta_spare_bar", "vehicle.tire_pressure_spare_bar",
        ]
        due_fields = {k: self._v(asset_id, k) for k in maintenance_keys}
        present = {k: v for k, v in due_fields.items() if v is not None}
        due_soon_days = int(self._policy("maintenance.due_soon_days", 90))
        numeric_due = {
            k: float(v) for k, v in present.items()
            if isinstance(v, (int, float)) and (k.endswith("due_days") or k.endswith("due_km") or "due_distance" in k)
        }
        explicit_states = {k: str(v).lower() for k, v in present.items() if not isinstance(v, (int, float))}
        overdue_properties = sorted(
            [k for k, v in numeric_due.items() if v < 0]
            + [k for k, v in explicit_states.items() if v in {"due", "critical", "service_required"}]
        )
        due_soon_properties = sorted(
            [k for k, v in numeric_due.items() if k.endswith("due_days") and 0 <= v <= due_soon_days]
            + [k for k, v in explicit_states.items() if v == "warning"]
        )
        scheduled_properties = sorted(
            k for k, v in numeric_due.items()
            if (k.endswith("due_days") and v > due_soon_days)
            or (not k.endswith("due_days") and v >= 0)
        )
        if overdue_properties:
            maint_state, sev = "overdue", "warning"
        elif due_soon_properties:
            maint_state, sev = "due_soon", "warning"
        elif scheduled_properties:
            maint_state, sev = "scheduled", "normal"
        elif present:
            maint_state, sev = "ok", "normal"
        else:
            maint_state, sev = "unknown", "unknown"

        oil_days = due_fields.get("vehicle.oil_service_due_days") if due_fields.get("vehicle.oil_service_due_days") is not None else due_fields.get("vehicle.oil_change_due_days")
        oil_km = due_fields.get("vehicle.oil_service_due_km") if due_fields.get("vehicle.oil_service_due_km") is not None else due_fields.get("vehicle.oil_change_due_distance_km")
        insp_days = due_fields.get("vehicle.inspection_due_days")
        insp_km = due_fields.get("vehicle.inspection_due_km")
        def countdown_phrase(label, value, unit):
            if not isinstance(value, (int, float)):
                return None
            n = int(value)
            if n < 0:
                return f"{label} {abs(n)} {unit} overdue"
            if n == 0:
                return f"{label} due now"
            return f"{label} in {n} {unit}"

        summaries=[]
        oil_summary = countdown_phrase("Oil", oil_days, "d") if oil_days is not None else countdown_phrase("Oil", oil_km, "km")
        inspection_summary = countdown_phrase("Inspection", insp_days, "d") if insp_days is not None else countdown_phrase("Inspection", insp_km, "km")
        if oil_summary: summaries.append(oil_summary)
        if inspection_summary: summaries.append(inspection_summary)
        summary = "; ".join(summaries) if summaries else ("No maintenance data" if not present else maint_state.replace("_", " ").title())

        def service_state(days, km, extra_state=None):
            if isinstance(days, (int, float)):
                if days < 0:
                    return "overdue"
                if days <= due_soon_days:
                    return "due_soon"
                return "scheduled"
            if isinstance(km, (int, float)):
                return "overdue" if km < 0 else "scheduled"
            if str(extra_state or "").lower() in {"due", "critical", "service_required"}:
                return "overdue"
            if str(extra_state or "").lower() == "warning":
                return "due_soon"
            if extra_state not in (None, ""):
                return "ok"
            return "unknown"

        pressure_values={k:v for k,v in due_fields.items() if "tire_pressure_" in k and v is not None}
        tire_raw = due_fields.get("vehicle.tire_health_state")
        tire_state = service_state(None, None, tire_raw) if tire_raw is not None else ("ok" if pressure_values else "unknown")
        actionable = sorted(set(overdue_properties + due_soon_properties))
        maintenance_i = self._intel(maint_state, sev, summary, ", ".join(actionable) if actionable else summary, "structured_vehicle_maintenance" if present else "no_maintenance_data", "derived" if present else "missing", maintenance_keys,
            policy_revision=self.policy_revision, due_soon_days=due_soon_days, actionable_properties=actionable,
            oil_service={"state": service_state(oil_days, oil_km, due_fields.get("vehicle.oil_level_state")), "days_remaining": oil_days, "km_remaining": oil_km, "oil_level_state": due_fields.get("vehicle.oil_level_state"), "oil_dipstick_state": due_fields.get("vehicle.oil_dipstick_state")},
            inspection={"state": service_state(insp_days, insp_km), "days_remaining": insp_days, "km_remaining": insp_km, "interval_days": due_fields.get("vehicle.inspection_interval_days"), "interval_km": due_fields.get("vehicle.inspection_interval_km")},
            general_inspection={"state": service_state(insp_days, insp_km), "days_remaining": insp_days, "km_remaining": insp_km, "interval_days": due_fields.get("vehicle.inspection_interval_days"), "interval_km": due_fields.get("vehicle.inspection_interval_km")},
            tires={"state": tire_state, "pressure_values_by_property": pressure_values, "attention_properties": [k for k in actionable if "tire_" in k], "input_properties": [k for k in maintenance_keys if "tire_" in k]},
            attention_properties=actionable,
            other_actionable_maintenance=[k for k in actionable if not any(token in k for token in ("oil_", "inspection_", "tire_"))])

        freshness_inputs=["vehicle.last_seen", "vehicle.source_timestamp", "vehicle.source_vehicle_clock"]
        freshness_values=[self._v(asset_id,k) for k in freshness_inputs]
        freshness_value=next((v for v in freshness_values if v not in (None,"")), None)
        freshness_i=self._intel("fresh" if freshness_value is not None else "unknown", "normal" if freshness_value is not None else "unknown", "Source observed" if freshness_value is not None else "No freshness data", str(freshness_value) if freshness_value is not None else "No freshness data", "property_backed_freshness" if freshness_value is not None else "no_freshness_data", "measured" if freshness_value is not None else "missing", freshness_inputs)

        if lifecycle == "disabled":
            disabled=lambda inputs: self._intel("disabled", "normal", "Disabled", "Vehicle disabled", "lifecycle_disabled", "configured", inputs)
            range_i=disabled(["lifecycle_status"]); energy_i=disabled(["lifecycle_status"]); charging_i=disabled(["lifecycle_status"]); comfort_i=disabled(["lifecycle_status"])
            security_i=self._intel("unknown", "unknown", "Disabled", "Vehicle disabled", "lifecycle_disabled", "configured", ["lifecycle_status"], unsafe_properties=[], missing_coverage=[], required_coverage=list(self._policy("security.required_coverage", ["lock","doors","windows"])), policy_revision=self.policy_revision)
            maintenance_i=self._intel("unknown", "unknown", "Disabled", "Vehicle disabled", "lifecycle_disabled", "configured", ["lifecycle_status"], oil_service={"state":"unknown","days_remaining":None,"km_remaining":None}, inspection={"state":"unknown","days_remaining":None,"km_remaining":None}, tires={"state":"unknown","pressure_values_by_property":{}}, other_actionable_maintenance=[], policy_revision=self.policy_revision)
            freshness_i=disabled(["lifecycle_status"])

        return {
            "asset_id": asset_id,
            "asset_type": "vehicle",
            "display_name": self._v(asset_id, "asset.display_name") or asset_id,
            "lifecycle_status": lifecycle,
            "availability_state": availability,
            "configuration_status": self._configuration_status(asset_id, "vehicle"),
            "runtime_data_health": self._runtime_data_health(asset_id, str(lifecycle).lower()),
            "charge_demand": charge_demand,
            "charging_relationship": self._charging_relationship(asset_id),
            "readiness_intelligence": readiness,
            "range_intelligence": range_i,
            "energy_intelligence": energy_i,
            "charging_intelligence": charging_i,
            "security_intelligence": security_i,
            "comfort_intelligence": comfort_i,
            "maintenance_intelligence": maintenance_i,
            "freshness_intelligence": freshness_i,
            "policy_revision": self.policy_revision,
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
        fault = {
            "state": "active" if operating == "fault" else ("unknown" if operating in (None, "unknown") else "none"),
            "code": None,
            "reason": "charger.operating_state=fault" if operating == "fault" else ("operating_state_unknown" if operating in (None, "unknown") else None),
        }
        return {
            "asset_id": asset_id, "asset_type": "charger", "display_name": self._v(asset_id, "asset.display_name") or asset_id,
            "lifecycle_status": lifecycle, "availability_state": availability,
            "configuration_status": self._configuration_status(asset_id, "charger"),
            "runtime_data_health": self._runtime_data_health(asset_id, str(lifecycle).lower()),
            "fault": fault,
            "availability_intelligence": availability_i, "connection_intelligence": connection_i,
            "vehicle_intelligence": vehicle_i, "charging_intelligence": charging_i,
            "power_intelligence": power_i, "current_intelligence": current_i,
            "maintenance_intelligence": maintenance_i, "freshness_intelligence": freshness_i,
            "health": health,
            "policy_revision": self.policy_revision,
        }

    def fleet_snapshot(self) -> dict[str, Any]:
        active_vehicles = []
        active_chargers = []
        available = connected = charging = 0
        known_power = 0
        total_power = 0.0
        for asset_id, asset in sorted(self.manager.assets.items()):
            lifecycle = str(self._v(asset_id, "asset.lifecycle_status") or "active").lower()
            if lifecycle == "disabled":
                continue
            if asset.concept_id == "vehicle":
                active_vehicles.append(asset_id)
                continue
            if asset.concept_id != "charger":
                continue
            active_chargers.append(asset_id)
            if self._v(asset_id, "charger.available_for_connection") is True:
                available += 1
            if self._v(asset_id, "charger.connection_state") == "asset_connected":
                connected += 1
            if self._v(asset_id, "charger.operating_state") == "running":
                charging += 1
            power = self._v(asset_id, "charger.power_kw")
            if isinstance(power, (int, float)):
                known_power += 1
                total_power += max(0.0, float(power))
        if not active_chargers or known_power == 0:
            power_state = "unknown"
            aggregate_power = None
        elif known_power == len(active_chargers):
            power_state = "complete"
            aggregate_power = round(total_power, 3)
        else:
            power_state = "partial"
            aggregate_power = round(total_power, 3)
        return {
            "active_vehicle_count": len(active_vehicles),
            "active_charger_count": len(active_chargers),
            "available_charger_count": available,
            "connected_charger_count": connected,
            "charging_charger_count": charging,
            "aggregate_actual_charging_power_kw": aggregate_power,
            "aggregate_power_state": power_state,
            "power_known_charger_count": known_power,
            "power_unknown_charger_count": len(active_chargers) - known_power,
        }

    def snapshot(self) -> dict[str, Any]:
        vehicles = [self._vehicle_row(aid) for aid, asset in sorted(self.manager.assets.items()) if asset.concept_id == "vehicle"]
        chargers = [self._charger_row(aid) for aid, asset in sorted(self.manager.assets.items()) if asset.concept_id == "charger"]
        return {"contract_id": self.CONTRACT_ID, "publisher": "rhi_mobility", "policy_revision": self.policy_revision, "fleet": self.fleet_snapshot(), "vehicles": vehicles, "chargers": chargers, "energy_planning_inference": False, "generic_truthiness_security": False, "not_evaluated_placeholders": False}


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
