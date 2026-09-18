from __future__ import annotations

from typing import Any, Mapping

from .normalization import current_a, normalize, power_kw, voltage_v


_PHASE_KEYS = (("L1", 1), ("L2", 2), ("L3", 3))


def _attribute(attributes: Mapping[str, Any], name: str) -> Any:
    """Read a structured source attribute without depending on entity/friendly names."""
    for key, value in attributes.items():
        if str(key).strip().lower() == name.lower():
            return value
    return None


def _phase_values(
    attributes: Mapping[str, Any],
    converter,
    unit: str | None,
    property_prefix: str,
    property_unit: str,
) -> dict[str, Any]:
    """Normalize structured per-phase attributes while containing bad source data."""
    values: dict[str, Any] = {}
    for attribute, phase in _PHASE_KEYS:
        raw = _attribute(attributes, attribute)
        try:
            value = converter(raw, unit)
        except Exception:
            # The base normalizer already treats malformed source values/units as
            # property-local runtime faults. Structured attributes must preserve the
            # same isolation boundary rather than aborting the asset refresh.
            value = None
        if value is not None:
            values[f"charger.{property_prefix}_l{phase}_{property_unit}"] = value
    return values


def normalize_source_observation(
    rule: str,
    integration_domain: str,
    raw_capability_id: str | None,
    value: Any,
    unit: str | None,
    attributes: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Normalize one accepted source observation.

    This is the single raw-source boundary. Integration-specific knowledge may turn
    one accepted binding into multiple normalized properties here. Callers after
    this boundary consume only the returned normalized properties.
    """
    normalized = normalize(rule, integration_domain, value, unit)
    if str(integration_domain or "").strip().lower() != "ocpp":
        return normalized

    attrs = attributes or {}
    capability = str(raw_capability_id or "").strip().lower()

    if capability == "actual_current_a":
        normalized.update(_phase_values(attrs, current_a, unit or "A", "current", "a"))
    elif capability == "power_kw":
        normalized.update(_phase_values(attrs, power_kw, unit or "kW", "power", "kw"))
    elif capability in {"voltage_v", "phase_voltage_v"}:
        normalized.update(_phase_values(attrs, voltage_v, unit or "V", "voltage", "v"))

    return normalized
