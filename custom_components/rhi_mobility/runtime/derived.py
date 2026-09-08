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


def apply_vehicle_derivations(values: dict[str, Any], quality: dict[str, str], *, charging_profile: dict[str, Any] | None = None) -> None:
    """Apply Mobility-owned pure derivations once, after source/profile/config facts exist.

    Source facts always win. Missing input never becomes a fabricated zero/state.
    """
    soc = _num(values.get("vehicle.soc_pct"))
    target = _num(values.get("vehicle.target_soc_pct"))
    capacity = _num(values.get("vehicle.battery_capacity_kwh"))

    if soc is not None and capacity is not None:
        current = round(capacity * soc / 100.0, 3)
        _set(values, quality, "vehicle.battery_energy_kwh", current, "derived_from_soc_capacity")
        _set(values, quality, "vehicle.current_energy_kwh", current, "derived_from_soc_capacity")
    elif values.get("vehicle.battery_energy_kwh") is not None:
        # Exact copy of an already authoritative energy fact; no independent computation.
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

    # V1 product summary states are Mobility conclusions, never raw OEM pass-throughs.
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

    # Connectivity is based on explicit canonical runtime evidence only. Do not turn an
    # absent source into disconnected.
    source_connectivity = values.get("vehicle.source_connectivity_state")
    if source_connectivity is not None:
        connectivity = source_connectivity
    else:
        connectivity = None
    _set(values, quality, "vehicle.connectivity_state", connectivity, "derived_from_source_connectivity", overwrite=True)


def apply_charger_derivations(values: dict[str, Any], quality: dict[str, str]) -> None:
    """Apply lightweight charger summaries from canonical facts/profile facts."""
    vendor = values.get("charger.vendor")
    model = values.get("charger.model")
    profile_id = values.get("asset.profile_id")
    identity = "configured" if any(x not in (None, "") for x in (vendor, model, profile_id)) else None
    _set(values, quality, "charger.identity_state", identity, "derived_charger_identity_summary", overwrite=True)

    # Engineering summary retains exact canonical raw status when available, otherwise it
    # derives only from measured electrical facts. Zero power does not imply an operating state.
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
