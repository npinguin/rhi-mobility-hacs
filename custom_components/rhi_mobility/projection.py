from __future__ import annotations

import logging
from typing import Any

from .const import DOMAIN, RELEASE
from .profile_presentation import profile_metadata

_LOGGER = logging.getLogger(__name__)

_ASSET_MARKERS = {"property", "number", "select", "text", "switch", "command"}


def _source_via_identifier(hass: Any, device_id: str | None) -> tuple[str, str] | None:
    """Resolve one already-known source device to an HA device identifier.

    This is an exact lookup of Foundation-provided device_registry_id, never a registry
    discovery scan. If the source device has no identifier HA can use for via_device,
    callers fall back to the Mobility module device.
    """
    if not device_id:
        return None
    try:
        from homeassistant.helpers import device_registry as dr
        registry = dr.async_get(hass)
        device = registry.async_get(device_id)
    except Exception as exc:
        _LOGGER.debug("Mobility exact via-device lookup failed device_id=%s: %s", device_id, exc)
        return None
    identifiers = getattr(device, "identifiers", None) if device is not None else None
    if not identifiers:
        return None
    rows = sorted((str(domain), str(identifier)) for domain, identifier in identifiers if domain and identifier)
    return rows[0] if rows else None


def logical_device_info(hass: Any, entry_id: str, manager: Any, asset_id: str, *, model: str = "Mobility logical asset") -> dict[str, Any]:
    asset = manager.assets.get(asset_id)
    snap = manager.snapshots.get(asset_id)
    name = asset_id.replace("_", " ").title()
    if asset is not None:
        name = asset.display_name
    if snap is not None and snap.values.get("asset.display_name"):
        name = str(snap.values["asset.display_name"])
    source_device_id = None if asset is None else asset.source_device_id
    via = _source_via_identifier(hass, source_device_id) or (DOMAIN, entry_id)
    profile = profile_metadata(manager, asset_id)
    manufacturer = profile.get("manufacturer") or profile.get("vendor") or "Robotix"
    profile_model = profile.get("model") or profile.get("display_name") or model
    return {
        "identifiers": {(DOMAIN, asset_id)},
        "name": name,
        "manufacturer": str(manufacturer),
        "model": str(profile_model),
        "sw_version": RELEASE,
        "via_device": via,
    }


def _asset_id_from_unique_id(unique_id: str | None) -> str | None:
    if not isinstance(unique_id, str) or not unique_id.startswith(f"{DOMAIN}:"):
        return None
    parts = unique_id.split(":", 3)
    if len(parts) < 4 or parts[2] not in _ASSET_MARKERS:
        return None
    return parts[1]


async def async_reconcile_projection(hass: Any, entry_id: str, current_asset_ids: set[str]) -> dict[str, int]:
    removed_entities = 0
    removed_devices = 0
    stale_device_ids: set[str] = set()
    try:
        from homeassistant.helpers import entity_registry as er
        from homeassistant.helpers import device_registry as dr
        entity_registry = er.async_get(hass)
        device_registry = dr.async_get(hass)
        entries = er.async_entries_for_config_entry(entity_registry, entry_id)
        for entity in list(entries):
            asset_id = _asset_id_from_unique_id(getattr(entity, "unique_id", None))
            if asset_id is None or asset_id in current_asset_ids:
                continue
            device_id = getattr(entity, "device_id", None)
            if device_id:
                stale_device_ids.add(str(device_id))
            entity_registry.async_remove(entity.entity_id)
            removed_entities += 1
        for device_id in sorted(stale_device_ids):
            device = device_registry.async_get(device_id)
            if device is None:
                continue
            identifiers = getattr(device, "identifiers", set()) or set()
            mobility_ids = {str(identifier) for domain, identifier in identifiers if domain == DOMAIN}
            if not mobility_ids or any(identifier in current_asset_ids or identifier == entry_id for identifier in mobility_ids):
                continue
            device_registry.async_remove_device(device_id)
            removed_devices += 1
    except Exception as exc:
        _LOGGER.warning("Mobility projection reconciliation could not complete: %s", exc)
    if removed_entities or removed_devices:
        _LOGGER.info("Mobility projection reconciled stale_entities=%s stale_devices=%s", removed_entities, removed_devices)
    return {"removed_entities": removed_entities, "removed_devices": removed_devices}
