from __future__ import annotations

from math import sqrt
from typing import Any


def _num(value: Any) -> float | None:
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None


def resolve_effective_charging_profile(
    *,
    charger_profile: Any,
    vehicle_profile: Any | None,
    charger_values: dict[str, Any],
) -> dict[str, Any] | None:
    """Resolve current↔power mapping from active electrical truth.

    Observed phase current/voltage is authoritative for an active session.
    Static charger/vehicle capability is only a bounded fallback. A 400 V
    line-to-line nominal value is converted to line-to-neutral before being
    multiplied by phase current.
    """
    if charger_profile is None:
        return None

    active: list[tuple[int, float]] = []
    voltages: list[float] = []
    for phase in (1, 2, 3):
        current = _num(charger_values.get(f"charger.current_l{phase}_a"))
        voltage = _num(charger_values.get(f"charger.voltage_l{phase}_v"))
        if current is not None and current > 0.2:
            active.append((phase, current))
            if voltage is not None and voltage > 0:
                voltages.append(voltage)

    configured_phases = getattr(charger_profile, "phase_count", None)
    vehicle_phases = None if vehicle_profile is None else getattr(vehicle_profile, "ac_phase_count", None)

    if active:
        phases = len(active)
        phase_count_source = "observed_phase_current"
    elif configured_phases is not None and vehicle_phases:
        phases = min(int(configured_phases), int(vehicle_phases))
        phase_count_source = "vehicle_charger_capability_fallback"
    elif configured_phases is not None and charger_values.get("charger.connection_state") != "asset_connected":
        # No active session means there is no vehicle-specific phase negotiation to
        # observe. Charger capability is an explicit idle envelope, not a claim about
        # an active vehicle. This keeps requested-power configuration available while
        # remaining fail-closed once a vehicle is connected without phase evidence.
        phases = int(configured_phases)
        phase_count_source = "charger_capability_idle_fallback"
    else:
        return None

    if phases <= 0:
        return None

    if voltages:
        phase_voltage = sum(voltages) / len(voltages)
        voltage_source = "observed_phase_voltage"
    else:
        nominal = _num(getattr(charger_profile, "nominal_voltage_v", None))
        if nominal is None or nominal <= 0:
            return None
        phase_voltage = nominal / sqrt(3.0) if phases > 1 and nominal > 300.0 else nominal
        voltage_source = (
            "derived_line_to_neutral_from_nominal"
            if phase_voltage != nominal
            else "nominal_phase_voltage"
        )

    min_a = _num(getattr(charger_profile, "min_current_a", None))
    max_a = _num(getattr(charger_profile, "max_current_a", None))
    step_a = _num(getattr(charger_profile, "current_step_a", None))
    vehicle_max_kw = None if vehicle_profile is None else _num(getattr(vehicle_profile, "max_ac_power_kw", None))

    if vehicle_max_kw is not None and max_a is not None:
        max_a = min(max_a, vehicle_max_kw * 1000.0 / (phase_voltage * phases))
    if min_a is None or max_a is None or min_a <= 0 or max_a < min_a:
        return None

    return {
        "phase_voltage_v": phase_voltage,
        "nominal_voltage_v": phase_voltage,
        "phase_count": float(phases),
        "phase_count_source": phase_count_source,
        "voltage_source": voltage_source,
        "min_current_a": min_a,
        "max_current_a": max_a,
        "current_step_a": step_a,
        "min_power_kw": min_a * phase_voltage * phases / 1000.0,
        "max_power_kw": max_a * phase_voltage * phases / 1000.0,
        "step_power_kw": None if step_a is None else step_a * phase_voltage * phases / 1000.0,
    }
