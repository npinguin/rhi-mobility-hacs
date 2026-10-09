"""Migration cleanup for retired Mobility aggregate entities.

This module owns only one-way removal of exact obsolete integration-owned entity
IDs. It is not a runtime provider, projection, fallback or compatibility authority.
Canonical native entities and retained producer-contract entities are untouched.
"""
from __future__ import annotations

import importlib
import logging
from typing import Any

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
_RETIRED_MONITOR_ROLES = ("runtime_v2", "public_contract_v2")


async def async_cleanup_retired_entities(hass: Any, entry_id: str) -> dict[str, int]:
    try:
        er = importlib.import_module("homeassistant.helpers.entity_registry")
    except ModuleNotFoundError:
        _LOGGER.debug("Entity registry unavailable in isolated harness; cleanup skipped")
        return {"removed_retired_aggregate_entities": 0}

    registry = er.async_get(hass)
    removed = 0
    for role in _RETIRED_MONITOR_ROLES:
        unique_id = f"{DOMAIN}:{entry_id}:monitor:{role}"
        entity_id = registry.async_get_entity_id("sensor", DOMAIN, unique_id)
        if entity_id is None:
            continue
        registry.async_remove(entity_id)
        removed += 1
        _LOGGER.info("Removed retired Mobility aggregate entity %s", entity_id)
    return {"removed_retired_aggregate_entities": removed}
