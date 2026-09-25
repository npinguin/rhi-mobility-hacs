from __future__ import annotations

from copy import deepcopy
from typing import Any

CONTRACT_ID = "MOBILITY_POLICY_V2"

DEFAULT_POLICY: dict[str, dict[str, Any]] = {
    "range": {"low_range_km": 100.0},
    "maintenance": {"due_soon_days": 90},
    "security": {"required_coverage": ["lock", "doors", "windows"]},
    "charging": {"minimum_demand_kwh": 0.5},
}

_ALLOWED_KEYS = {
    "range.low_range_km",
    "maintenance.due_soon_days",
    "security.required_coverage",
    "charging.minimum_demand_kwh",
}
_SECURITY_COVERAGE = {"lock", "doors", "windows"}

POLICY_EDITORS: dict[str, dict[str, Any]] = {
    "range.low_range_km": {
        "label": "Low range warning",
        "description": "Warn when effective vehicle range falls below this threshold.",
        "control": "number",
        "unit": "km",
        "min": 1,
        "max": 1000,
        "step": 1,
        "write_service_domain": "rhi_mobility",
        "write_service_action": "set_policy",
    },
    "maintenance.due_soon_days": {
        "label": "Maintenance warning",
        "description": "Warn this many days before scheduled maintenance becomes due.",
        "control": "number",
        "unit": "d",
        "min": 0,
        "max": 730,
        "step": 1,
        "write_service_domain": "rhi_mobility",
        "write_service_action": "set_policy",
    },
    "charging.minimum_demand_kwh": {
        "label": "Minimum charging demand",
        "description": "Treat charging demand below this value as satisfied.",
        "control": "number",
        "unit": "kWh",
        "min": 0,
        "max": 200,
        "step": 0.1,
        "write_service_domain": "rhi_mobility",
        "write_service_action": "set_policy",
    },
    "security.required_coverage": {
        "label": "Required security coverage",
        "description": "Security is proven only when every selected coverage family is authoritative.",
        "control": "multi_select",
        "choices": [
            {"value": "lock", "label": "Lock"},
            {"value": "doors", "label": "Doors"},
            {"value": "windows", "label": "Windows"},
        ],
        "write_service_domain": "rhi_mobility",
        "write_service_action": "set_policy",
    },
}


def _validate(key: str, value: Any) -> Any:
    if key not in _ALLOWED_KEYS:
        raise ValueError(f"unsupported Mobility policy key: {key}")
    if key == "range.low_range_km":
        parsed = float(value)
        if parsed <= 0:
            raise ValueError("range.low_range_km must be positive")
        return parsed
    if key == "maintenance.due_soon_days":
        parsed = int(value)
        if parsed < 0:
            raise ValueError("maintenance.due_soon_days must be non-negative")
        return parsed
    if key == "charging.minimum_demand_kwh":
        parsed = float(value)
        if parsed < 0:
            raise ValueError("charging.minimum_demand_kwh must be non-negative")
        return parsed
    raw_values = value.split(",") if isinstance(value, str) else (value or [])
    values = [str(item).strip().lower() for item in raw_values if str(item).strip()]
    if not values or any(item not in _SECURITY_COVERAGE for item in values):
        raise ValueError("security.required_coverage must contain lock, doors and/or windows")
    return sorted(set(values), key=("lock", "doors", "windows").index)


class MobilityPolicyProvider:
    """Small persistent Mobility policy contract.

    Defaults are packaged product policy. User overrides are persisted by
    MobilityDomainConfiguration in the config entry. This provider owns no UI.
    """

    CONTRACT_ID = CONTRACT_ID

    def __init__(self, domain_config) -> None:
        self.domain_config = domain_config

    @property
    def revision(self) -> int:
        return int(getattr(self.domain_config, "policy_revision", 0) or 0)

    def snapshot(self) -> dict[str, Any]:
        policy = deepcopy(DEFAULT_POLICY)
        overrides = getattr(self.domain_config, "policy_overrides", lambda: {})() or {}
        for section, values in overrides.items():
            if section in policy and isinstance(values, dict):
                policy[section].update(values)
        editors = []
        for key in sorted(POLICY_EDITORS):
            section, field = key.split(".", 1)
            editor = deepcopy(POLICY_EDITORS[key])
            editor.update({
                "policy_key": key,
                "value": deepcopy(policy[section][field]),
                "write_service_data": {"policy_key": key},
                "write_value_field": "value",
            })
            editors.append(editor)
        return {
            "contract_id": self.CONTRACT_ID,
            "publisher": "rhi_mobility",
            "revision": self.revision,
            "policy": policy,
            "editors": editors,
        }

    def value(self, key: str) -> Any:
        section, field = key.split(".", 1)
        return self.snapshot()["policy"][section][field]

    async def async_set(self, key: str, value: Any) -> None:
        if value is None:
            await self.domain_config.async_set_policy(key, None)
            return
        await self.domain_config.async_set_policy(key, _validate(key, value))
