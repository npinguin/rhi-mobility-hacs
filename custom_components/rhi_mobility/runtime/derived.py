from __future__ import annotations
from typing import Any


def _num(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _set(values: dict[str, Any], quality: dict[str, str], key: str, value: Any, reason: str, *, overwrite: bool = False) -> None:
    if value is None:
        return
    if not overwrite and values.get(key) is not None:
        return
    values[key] = value
    quality[key] = reason


def _engine_family(value: Any) -> str | None:
    """Normalize an explicit engine-type fact into an energy family."""
    if value is None:
        return None
    token = str(value).strip().lower().replace("-", "_").replace(" ", "_")
    if token in {"electric", "electricity", "electric_motor", "ev", "bev"}:
        return "electric"
    if token in {"combustion", "internal_combustion", "ice", "gasoline", "petrol", "diesel", "cng", "lng", "lpg"}:
        return "combustion"
    return None


def _vehicle_kind(value: Any) -> str | None:
    if value is None:
        return None
    token=str(value).strip().lower().replace("-","_").replace(" ","_")
    if token in {"ev","bev","electric","battery_electric"}: return "ev"
    if token in {"phev","plug_in_hybrid","plugin_hybrid"}: return "phev"
    return None


def _derive_engine_ranges(values: dict[str, Any], quality: dict[str, str]) -> None:
    """Project primary/secondary engine ranges into explicit EV/fuel semantics."""
    for slot in ("primary", "secondary"):
        family = _engine_family(values.get(f"vehicle.{slot}_engine_type"))
        distance = _num(values.get(f"vehicle.{slot}_range_km"))
        if distance is None:
            continue
        if family == "electric":
            _set(values, quality, "vehicle.ev_range_km", distance, f"derived_from_{slot}_electric_engine_range")
        elif family == "combustion":
            _set(values, quality, "vehicle.fuel_range_km", distance, f"derived_from_{slot}_combustion_engine_range")


def _derive_total_range(values: dict[str, Any], quality: dict[str, str]) -> None:
    """Derive total range only from semantically complete canonical range facts.

    A direct total-range source always wins. For an explicitly typed BEV, EV range is
    the complete propulsion range and therefore also total range. For an explicitly
    typed PHEV, total range may be computed only when both EV and combustion ranges are
    present. Missing components remain unavailable rather than being coerced to zero.
    """
    if _num(values.get("vehicle.range_total_km")) is not None:
        return

    # Some OEMs expose one authoritative combined/total range through the older
    # canonical vehicle.range_km input. Preserve that direct source truth before
    # attempting typed propulsion derivation; this is projection, not estimation.
    direct_range = _num(values.get("vehicle.range_km"))
    if direct_range is not None:
        _set(values, quality, "vehicle.range_total_km", round(direct_range, 3), "canonical_direct_range_projection")
        return

    kind=_vehicle_kind(values.get("vehicle.kind"))
    ev_range=_num(values.get("vehicle.ev_range_km"))
    fuel_range=_num(values.get("vehicle.fuel_range_km"))
    if kind=="ev" and ev_range is not None:
        _set(values,quality,"vehicle.range_total_km",round(ev_range,3),"derived_total_from_explicit_bev_ev_range")
    elif kind=="phev" and ev_range is not None and fuel_range is not None:
        _set(values,quality,"vehicle.range_total_km",round(ev_range+fuel_range,3),"derived_total_from_explicit_phev_ev_fuel_ranges")



def _derive_identity_status(values: dict[str, Any], quality: dict[str, str], prefix: str) -> None:
    """Classify canonical product identity without inventing missing facts."""
    keys = (f"{prefix}.brand", f"{prefix}.model", f"{prefix}.variant", f"{prefix}.model_year")
    identity = [values.get(key) for key in keys]
    profile_id = values.get("asset.profile_id")
    configured_identity = any(quality.get(key) == "mobility_domain_configuration" for key in keys)
    if profile_id not in (None, ""):
        status = "resolved"
    elif identity[0] not in (None, "") and identity[1] not in (None, "") and configured_identity:
        status = "custom"
    elif any(value not in (None, "") for value in identity):
        status = "partial"
    else:
        status = "unresolved"
    _set(values, quality, f"{prefix}.identity_status", status, "derived_identity_completeness", overwrite=True)

def apply_vehicle_derivations(values: dict[str, Any], quality: dict[str, str], *, charging_profile: dict[str, Any] | None = None) -> None:
    """Apply Mobility-owned pure derivations once, after source/profile/config facts exist."""
    soc = _num(values.get("vehicle.soc_pct"))
    target = _num(values.get("vehicle.target_soc_pct"))
    capacity = _num(values.get("vehicle.battery_capacity_kwh"))

    if soc is not None and capacity is not None:
        current = round(capacity * soc / 100.0, 3)
        _set(values, quality, "vehicle.battery_energy_kwh", current, "derived_from_soc_capacity")
        _set(values, quality, "vehicle.current_energy_kwh", current, "derived_from_soc_capacity")
    elif values.get("vehicle.battery_energy_kwh") is not None:
        _set(values, quality, "vehicle.current_energy_kwh", values.get("vehicle.battery_energy_kwh"), "canonical_battery_energy_projection")

    if target is not None and capacity is not None:
        _set(values, quality, "vehicle.target_energy_kwh", round(capacity * target / 100.0, 3), "derived_from_target_soc_capacity")

    current = _num(values.get("vehicle.current_energy_kwh"))
    target_energy = _num(values.get("vehicle.target_energy_kwh"))
    if current is not None and target_energy is not None:
        needed = round(max(0.0, target_energy - current), 3)
        _set(values, quality, "vehicle.required_energy_kwh", needed, "derived_from_soc_target_capacity", overwrite=True)
        _set(values, quality, "vehicle.energy_needed_kwh", needed, "derived_from_soc_target_capacity", overwrite=True)

    if charging_profile:
        phases = charging_profile.get("phase_count")
        max_power = charging_profile.get("max_power_kw")
        if phases is not None:
            _set(values, quality, "vehicle.effective_phase_count", int(phases), "derived_from_vehicle_and_selected_charger_profile", overwrite=True)
        if max_power is not None:
            _set(values, quality, "vehicle.effective_max_charge_power_kw", round(float(max_power), 3), "derived_from_vehicle_and_selected_charger_profile", overwrite=True)

    charging = values.get("vehicle.charging_state")
    if soc is None:
        battery_state = None
    elif charging == "charging":
        battery_state = "charging"
    elif soc >= 99.0:
        battery_state = "full"
    elif soc <= 10.0:
        battery_state = "critical"
    elif soc <= 20.0:
        battery_state = "low"
    else:
        battery_state = "ok"
    _set(values, quality, "vehicle.battery_state", battery_state, "derived_vehicle_battery_summary", overwrite=True)

    _derive_engine_ranges(values, quality)
    _derive_total_range(values, quality)

    ev_range = _num(values.get("vehicle.ev_range_km"))
    fuel_range = _num(values.get("vehicle.fuel_range_km"))
    total_range = _num(values.get("vehicle.range_total_km"))
    if total_range is not None:
        range_state = "available"
    elif ev_range is not None or fuel_range is not None:
        range_state = "partial"
    else:
        range_state = None
    _set(values, quality, "vehicle.range_state", range_state, "derived_vehicle_range_summary", overwrite=True)

    source_connectivity = values.get("vehicle.source_connectivity_state")
    if source_connectivity is not None:
        connectivity = source_connectivity
    else:
        connectivity = None
    _set(values, quality, "vehicle.connectivity_state", connectivity, "derived_from_source_connectivity", overwrite=True)
    _derive_identity_status(values, quality, "vehicle")


def apply_charger_derivations(values: dict[str, Any], quality: dict[str, str]) -> None:
    """Apply deterministic charger summaries and aggregate readback facts."""
    _derive_identity_status(values, quality, "charger")
    phase_currents = [_num(values.get(f"charger.current_l{phase}_a")) for phase in (1, 2, 3)]
    observed_phase_currents = [current for current in phase_currents if current is not None]
    if values.get("charger.actual_current_a") is None and observed_phase_currents:
        _set(values, quality, "charger.actual_current_a", round(max(observed_phase_currents), 3), "derived_from_phase_current_readback")

    # Canonical selected power keeps direct positive measured power authoritative.
    # When a direct source reports zero while normalized phase current proves active
    # charging, power may be calculated only from normalized voltage evidence or the
    # explicit canonical nominal voltage supplied by accepted source/profile truth.
    # No anonymous 230 V assumption is allowed.
    measured_power = _num(values.get("charger.power_kw"))
    active_phases = [
        (phase, current)
        for phase, current in zip((1, 2, 3), phase_currents)
        if current is not None and current > 0.05
    ]
    if active_phases and (measured_power is None or measured_power <= 0.0):
        measured_voltage = _num(values.get("charger.voltage_v"))
        nominal_voltage = _num(values.get("charger.nominal_voltage_v"))
        phase_power_w = 0.0
        voltage_mode = "phase"
        complete_voltage_evidence = True
        for phase, current in active_phases:
            voltage = _num(values.get(f"charger.voltage_l{phase}_v"))
            if voltage is None and measured_voltage is not None:
                voltage = measured_voltage
                voltage_mode = "measured_aggregate"
            if voltage is None and nominal_voltage is not None:
                voltage = nominal_voltage
                voltage_mode = "canonical_nominal"
            if voltage is None or voltage <= 0.0:
                complete_voltage_evidence = False
                break
            phase_power_w += current * voltage
        if complete_voltage_evidence and phase_power_w > 0.0:
            reason = {
                "phase": "derived_from_normalized_phase_current_voltage",
                "measured_aggregate": "derived_from_normalized_phase_current_measured_voltage",
                "canonical_nominal": "derived_from_normalized_phase_current_canonical_nominal_voltage",
            }[voltage_mode]
            _set(values, quality, "charger.power_kw", round(phase_power_w / 1000.0, 3), reason, overwrite=True)

    vendor = values.get("charger.vendor")
    model = values.get("charger.model")
    profile_id = values.get("asset.profile_id")
    identity = "configured" if any(x not in (None, "") for x in (vendor, model, profile_id)) else None
    _set(values, quality, "charger.identity_state", identity, "derived_charger_identity_summary", overwrite=True)

    raw_electrical = values.get("charger.source_electrical_state")
    if raw_electrical is not None:
        electrical = raw_electrical
    elif any(values.get(k) is not None for k in ("charger.voltage_l1_v", "charger.voltage_l2_v", "charger.voltage_l3_v", "charger.current_l1_a", "charger.current_l2_a", "charger.current_l3_a", "charger.power_kw")):
        electrical = "available"
    else:
        electrical = None
    _set(values, quality, "charger.electrical_state", electrical, "derived_charger_electrical_summary", overwrite=True)

    raw_session = values.get("charger.source_session_value_state")
    if raw_session is not None:
        session_state = raw_session
    elif values.get("charger.session_energy_kwh") is not None or values.get("charger.session_cost") is not None:
        session_state = "available"
    else:
        session_state = None
    _set(values, quality, "charger.session_value_state", session_state, "derived_charger_session_summary", overwrite=True)
