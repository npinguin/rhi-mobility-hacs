from __future__ import annotations
from copy import deepcopy
import json
from importlib.resources import files
from typing import Any
from .contracts.presentation import canonicalize_presentation

_MUTABLE_RUNTIME_NAME_FIELDS = {"source_identity.current_entity_id"}


def _separate_runtime_names_from_capability_evidence(spec: dict[str, Any]) -> dict[str, Any]:
    """Keep stable integration capability identity structural; demote only HA runtime names."""
    out = deepcopy(spec)
    inputs = (out.get("candidate_requirements") or {}).get("normalized_inputs") or []
    for row in inputs:
        for match in row.get("integration_matches") or []:
            structural: list[dict[str, Any]] = []
            hints: list[dict[str, Any]] = list(match.get("hints") or [])
            for predicate in match.get("all_of") or []:
                if isinstance(predicate, dict) and predicate.get("field") in _MUTABLE_RUNTIME_NAME_FIELDS:
                    hints.append(dict(predicate))
                else:
                    structural.append(dict(predicate) if isinstance(predicate, dict) else predicate)
            match["all_of"] = structural
            if hints:
                match["hints"] = hints
    return out


def _replace_entity_matches(row: dict[str, Any], domain: str, suffixes: tuple[str, ...]) -> None:
    matches = list(row.get("integration_matches") or [])
    owned = [m for m in matches if m.get("integration_domain") == domain and m.get("source_kind") == "entity"]
    if not owned:
        return
    raw_id = str(owned[0].get("raw_capability_id") or row.get("input_id") or "")
    matches = [m for m in matches if not (m.get("integration_domain") == domain and m.get("source_kind") == "entity")]
    for suffix in suffixes:
        matches.append({
            "integration_domain": domain,
            "raw_capability_id": raw_id,
            "source_kind": "entity",
            "all_of": [{"field": "source_identity.unique_id", "operator": "ends_with", "value": suffix}],
        })
    row["integration_matches"] = matches


def _replace_service_match(row: dict[str, Any], domain: str, service_name: str) -> None:
    matches = list(row.get("integration_matches") or [])
    owned = [m for m in matches if m.get("integration_domain") == domain and m.get("source_kind") == "service"]
    if not owned:
        return
    raw_id = str(owned[0].get("raw_capability_id") or row.get("input_id") or "")
    matches = [m for m in matches if not (m.get("integration_domain") == domain and m.get("source_kind") == "service")]
    matches.append({
        "integration_domain": domain,
        "raw_capability_id": raw_id,
        "source_kind": "service",
        "all_of": [{"field": "source_identity.service_name", "operator": "equals", "value": service_name}],
    })
    row["integration_matches"] = matches


_AUDI_ENTITY_SUFFIXES: dict[str, tuple[str, ...]] = {
    "vehicle_range": ("sensor_range",),
    "vehicle_location": ("device_tracker_position",),
    "vehicle_odometer": ("sensor_mileage",),
    "vehicle_security_state": ("lock_lock",),
    "vehicle_climate_state": ("sensor_climatisation_state",),
    "vehicle_plug_state": ("binary_sensor_plug_state",),
    "vehicle_remaining_charge_time": ("sensor_remaining_charging_time",),
    "vehicle_charging_complete_time": ("sensor_charging_complete_time",),
    "vehicle_doors_locked": ("lock_lock",),
    "vehicle_trunk_state": ("binary_sensor_trunk_open",),
    "vehicle_hood_state": ("binary_sensor_hood_open",),
    "vehicle_door_front_left_state": ("binary_sensor_left_front_door_open",),
    "vehicle_door_front_right_state": ("binary_sensor_right_front_door_open",),
    "vehicle_door_rear_left_state": ("binary_sensor_left_rear_door_open",),
    "vehicle_door_rear_right_state": ("binary_sensor_right_rear_door_open",),
    "vehicle_window_fl_state": ("binary_sensor_left_front_window_open",),
    "vehicle_window_fr_state": ("binary_sensor_right_front_window_open",),
    "vehicle_window_rl_state": ("binary_sensor_left_rear_window_open",),
    "vehicle_window_rr_state": ("binary_sensor_right_rear_window_open",),
    "vehicle_remaining_climate_time": ("sensor_remaining_climatisation_time",),
    "vehicle_inspection_due_days": ("sensor_service_inspection_time",),
    "vehicle_inspection_due_km": ("sensor_service_inspection_distance",),
    "vehicle_oil_service_due_days": ("sensor_oil_change_time",),
    "vehicle_oil_service_due_km": ("sensor_oil_change_distance",),
    "compat_vehicle_lock_state": ("lock_lock",),
    "compat_vehicle_plug_lock_state": ("binary_sensor_plug_lock_state",),
    "compat_vehicle_charge_mode": ("sensor_charging_mode",),
    "compat_vehicle_primary_engine_range": ("sensor_primary_engine_range",),
    "compat_vehicle_secondary_engine_range": ("sensor_secondary_engine_range",),
    "compat_vehicle_doors_trunk_state": ("sensor_doors_trunk_status",),
}

_CUPRA_ENTITY_SUFFIXES: dict[str, tuple[str, ...]] = {
    "vehicle_range": ("cruising_range_combined", "value_of_the_primary_range"),
    "vehicle_charging_state": ("charging_state", "charging_state_report.current_charge_state"),
    "vehicle_odometer": ("_mileage",),
    "vehicle_security_state": ("_lock_state", "_locked"),
    "vehicle_charge_power": ("battery_state_report.charge_power",),
    "vehicle_remaining_charge_time": ("remaining_charging_time", "battery_state_report.remaining_charging_time_complete"),
    "vehicle_remaining_climate_time": ("remaining_climate_time",),
    "vehicle_trunk_state": ("open_state_tailgate",),
    "vehicle_hood_state": ("open_state_front_engine_bonnet",),
    "vehicle_door_front_left_state": ("open_state_front_left_door",),
    "vehicle_door_front_right_state": ("open_state_front_right_door",),
    "vehicle_door_rear_left_state": ("open_state_rear_left_door",),
    "vehicle_door_rear_right_state": ("open_state_rear_right_door",),
    "vehicle_window_fl_state": ("state_front_left_door_window_lifter",),
    "vehicle_window_fr_state": ("state_front_right_door_window_lifter",),
    "vehicle_window_rl_state": ("state_rear_left_door_window_lifter",),
    "vehicle_window_rr_state": ("state_rear_right_door_window_lifter",),
    "vehicle_inspection_due_days": ("maintenance_interval__time_until_inspection",),
    "vehicle_inspection_due_km": ("maintenance_interval_distance_until_inspection",),
    "vehicle_oil_service_due_days": ("maintenance_interval__time_until_oil_change",),
    "vehicle_oil_service_due_km": ("maintenance_interval_distance_until_oil_change",),
    "compat_vehicle_charge_mode": ("charging_mode", "charging_state_report.charge_mode"),
    "compat_vehicle_primary_engine_range": ("cruising_range_primary_engine", "value_of_the_primary_range"),
    "compat_vehicle_secondary_engine_range": ("cruising_range_secondary_engine",),
}

_MERCEDES_ENTITY_SUFFIXES: dict[str, tuple[str, ...]] = {
    "vehicle_range": ("_rangeelectrickm",),
    "vehicle_charging_state": ("_chargingstatus",),
    "vehicle_odometer": ("_odometer",),
    "vehicle_security_state": ("_lock",),
    "vehicle_climate_state": ("_preclimatestatus",),
    "vehicle_charge_power": ("_chargingpowerkw",),
    "vehicle_charging_complete_time": ("_endofchargetime",),
    "vehicle_trunk_state": ("_decklidstatus",),
    "vehicle_window_fl_state": ("_windowstatusfrontleft",),
    "vehicle_window_fr_state": ("_windowstatusfrontright",),
    "vehicle_window_rl_state": ("_windowstatusrearleft",),
    "vehicle_window_rr_state": ("_windowstatusrearright",),
    "compat_vehicle_lock_state": ("_lock",),
    "compat_vehicle_primary_engine_range": ("_rangeelectrickm",),
    "compat_vehicle_secondary_engine_range": ("_rangeliquid",),
}


def _normalize_current_ocpp_contract(spec: dict[str, Any]) -> dict[str, Any]:
    if spec.get("builder_id") != "mobility.charger.full_evse.v1":
        return spec
    out = deepcopy(spec)
    out["builder_version"] = "1.7.0"
    inputs = (out.get("candidate_requirements") or {}).get("normalized_inputs") or []
    for row in inputs:
        input_id = str(row.get("input_id") or "")
        if input_id == "charger_operating_state":
            for match in row.get("integration_matches") or []:
                if match.get("integration_domain") != "ocpp" or match.get("source_kind") != "entity":
                    continue
                for predicate in match.get("all_of") or []:
                    if isinstance(predicate, dict) and predicate.get("field") == "source_identity.unique_id" and predicate.get("operator") == "ends_with" and predicate.get("value") == "status.sensor":
                        predicate["value"] = "status_connector.sensor"
        if input_id == "charger_power":
            row["required"] = False
            row["cardinality"] = "zero_or_one_per_group"
    return out


def _normalize_current_vehicle_contract(spec: dict[str, Any]) -> dict[str, Any]:
    """Align generated aliases with technical identities observed on supported integrations."""
    if spec.get("builder_id") != "mobility.vehicle.connected_vehicle.v1":
        return spec
    out = deepcopy(spec)
    out["builder_version"] = "1.8.0"
    inputs = (out.get("candidate_requirements") or {}).get("normalized_inputs") or []
    for row in inputs:
        input_id = str(row.get("input_id") or "")
        if input_id in _AUDI_ENTITY_SUFFIXES:
            _replace_entity_matches(row, "audiconnect", _AUDI_ENTITY_SUFFIXES[input_id])
        if input_id in _CUPRA_ENTITY_SUFFIXES:
            _replace_entity_matches(row, "cupra_eu_data_act", _CUPRA_ENTITY_SUFFIXES[input_id])
        if input_id in _MERCEDES_ENTITY_SUFFIXES:
            _replace_entity_matches(row, "mbapi2020", _MERCEDES_ENTITY_SUFFIXES[input_id])
        if input_id in {"vehicle_lock_surface", "vehicle_unlock_surface", "vehicle_climate_start_surface", "vehicle_climate_stop_surface"}:
            _replace_service_match(row, "audiconnect", "execute_vehicle_action")
        if input_id == "vehicle_refresh_surface":
            _replace_service_match(row, "audiconnect", "refresh_vehicle_data")
            _replace_service_match(row, "cupra_eu_data_act", "refresh_now")
        if input_id == "vehicle_lock_surface":
            _replace_service_match(row, "mbapi2020", "doors_lock")
        elif input_id == "vehicle_unlock_surface":
            _replace_service_match(row, "mbapi2020", "doors_unlock")
        elif input_id == "vehicle_climate_start_surface":
            _replace_service_match(row, "mbapi2020", "preheat_start")
        elif input_id == "vehicle_climate_stop_surface":
            _replace_service_match(row, "mbapi2020", "preheat_stop")
    return out


class MobilityModelRegistry:
    """Loads generated copies of authoritative release contracts."""
    def __init__(self) -> None:
        spec_root=files("custom_components.rhi_mobility.contracts.build_specifications"); self.specs={}
        for item in spec_root.iterdir():
            if item.name.endswith(".json") and item.name!="manifest.json":
                spec=json.loads(item.read_text(encoding="utf-8"))
                spec=_normalize_current_ocpp_contract(spec)
                spec=_normalize_current_vehicle_contract(spec)
                spec=_separate_runtime_names_from_capability_evidence(spec)
                spec=canonicalize_presentation(spec)
                self.specs[spec["builder_id"]]=spec
        model_root=files("custom_components.rhi_mobility.contracts.runtime")
        self.domain_model=json.loads((model_root/"domain_runtime_model.json").read_text(encoding="utf-8")); self.builder_models=self.domain_model["builders"]
        self.semantic_catalog=json.loads((model_root/"semantic_property_catalog.json").read_text(encoding="utf-8"))
        profile_catalog=json.loads((model_root/"profile_catalog.json").read_text(encoding="utf-8")); self.profiles=tuple(dict(row) for row in profile_catalog.get("profiles",[])); self._profiles_by_id={str(row["profile_id"]):dict(row) for row in self.profiles}
        legacy_runtime=json.loads((model_root/"legacy_public_runtime_v1.json").read_text(encoding="utf-8")); self.legacy_aliases=dict(legacy_runtime.get("aliases") or {}); self.legacy_property_definitions=tuple(dict(row) for row in legacy_runtime.get("property_definitions",[]))
        parity_path=model_root/"v1_drop_in_parity.json"; self.v1_drop_in_parity=json.loads(parity_path.read_text(encoding="utf-8")) if parity_path.is_file() else {}
    def build_spec(self,builder_id: str) -> dict[str,Any]:
        try: return self.specs[builder_id]
        except KeyError as exc: raise ValueError(f"unsupported Mobility builder_id: {builder_id}") from exc
    def builder_model(self,builder_id: str) -> dict[str,Any]:
        try: return self.builder_models[builder_id]
        except KeyError as exc: raise ValueError(f"missing Mobility domain model for builder_id: {builder_id}") from exc
    def profile(self,profile_id: str|None) -> dict[str,Any]|None:
        if not profile_id: return None
        row=self._profiles_by_id.get(str(profile_id)); return None if row is None else dict(row)
    def profiles_for_type(self,profile_type: str) -> list[dict[str,Any]]:
        return [dict(row) for row in self.profiles if row.get("profile_type")==profile_type]
