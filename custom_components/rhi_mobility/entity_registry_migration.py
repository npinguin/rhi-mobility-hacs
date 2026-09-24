from __future__ import annotations

import logging
from typing import Any

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

_CANONICAL_MONITOR_ENTITY_IDS = {
    "runtime_v2": "sensor.rhi_mobility_runtime_v2",
    "experience_v2": "sensor.rhi_mobility_experience_v2",
    "policy_v2": "sensor.rhi_mobility_policy_v2",
    "command_v2": "sensor.rhi_mobility_command_v2",
    "energy_v2": "sensor.rhi_mobility_energy_v2",
    "activity_v2": "sensor.rhi_mobility_activity_v2",
    "profile_catalog_v2": "sensor.rhi_mobility_profile_catalog_v2",
    "supervision_v2": "sensor.rhi_mobility_supervision_v2",
}


def canonical_monitor_unique_id(entry_id: str, role: str) -> str:
    return f"{DOMAIN}:{entry_id}:monitor:{role}"


def migrate_canonical_v2_entity_ids(hass: Any, entry_id: str) -> dict[str, str]:
    """Move pre-M0.9.44 monitor registry rows onto stable public V2 entity IDs.

    Home Assistant preserves an existing entity_id by unique_id. M0.9.44 only
    changed the desired entity_id on the Entity object, which cannot rename an
    already-registered row. This migration owns that registry transition once.
    """
    import importlib
    try:
        er = importlib.import_module("homeassistant.helpers.entity_registry")
    except ModuleNotFoundError:
        # Repository lifecycle harnesses intentionally run without the full HA
        # registry package. Real Home Assistant always provides this module.
        _LOGGER.debug("Entity registry unavailable in isolated harness; migration skipped")
        return {}

    registry = er.async_get(hass)
    migrated: dict[str, str] = {}
    for role, target in _CANONICAL_MONITOR_ENTITY_IDS.items():
        unique_id = canonical_monitor_unique_id(entry_id, role)
        current = registry.async_get_entity_id("sensor", DOMAIN, unique_id)
        if current is None:
            continue

        current_entry = registry.async_get(current)
        target_entry = registry.async_get(target)
        if target_entry is not None and getattr(target_entry, "unique_id", None) != unique_id:
            raise RuntimeError(
                f"Cannot migrate {unique_id} from {current} to {target}: "
                "target entity_id is owned by another registry entry"
            )

        changes = {}
        if current != target:
            changes["new_entity_id"] = target
        if current_entry is not None and getattr(current_entry, "disabled_by", None) is not None:
            changes["disabled_by"] = None
        if not changes:
            continue

        registry.async_update_entity(current, **changes)
        migrated[current] = target
        _LOGGER.info("Materialized Mobility V2 public entity %s -> %s (enabled)", current, target)

    return migrated
