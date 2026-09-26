from __future__ import annotations

import logging
from time import perf_counter
from typing import Any

from .const import DOMAIN, RELEASE

_LOGGER = logging.getLogger(__name__)

_ASSET_MARKERS = {"property", "number", "select", "text", "switch", "command", "source_diag", "source_binding"}


def logical_device_info(hass: Any, entry_id: str, manager: Any, asset_id: str, *, model: str = "Mobility logical asset") -> dict[str, Any]:
    """Project a Mobility logical asset into the HA device registry.

    Source provenance is deliberately *not* represented through ``via_device``.
    Home Assistant reserves that relationship for technical topology/gateways; the
    Mobility source relationship is owned by AcceptedSourceBinding and exposed via
    compact diagnostic entities and navigation links instead.
    """
    asset = manager.assets.get(asset_id)
    snap = manager.snapshots.get(asset_id)
    name = asset_id.replace("_", " ").title()
    if asset is not None:
        name = asset.display_name
    if snap is not None and snap.values.get("asset.display_name"):
        name = str(snap.values["asset.display_name"])
    prefix = getattr(asset, "concept_id", "")
    manufacturer = "Robotix"
    profile_model = model
    if snap is not None and prefix in {"vehicle", "charger"}:
        manufacturer = str(snap.values.get(f"{prefix}.brand") or "Robotix")
        profile_model = str(snap.values.get(f"{prefix}.model") or model)
    return {
        "identifiers": {(DOMAIN, asset_id)},
        "name": name,
        "manufacturer": str(manufacturer),
        "model": str(profile_model),
        "sw_version": RELEASE,
        # Semantic Mobility composition is owned by the canonical RHI graph.
        # Do not project Vehicle/Charger parentage into HA via_device/parent_device.
    }


def _asset_id_from_unique_id(unique_id: str | None) -> str | None:
    if not isinstance(unique_id, str) or not unique_id.startswith(f"{DOMAIN}:"):
        return None
    parts = unique_id.split(":", 3)
    if len(parts) < 4 or parts[2] not in _ASSET_MARKERS:
        return None
    return parts[1]


async def async_reconcile_projection(
    hass: Any,
    entry_id: str,
    current_asset_ids: set[str],
    disabled_asset_ids: set[str] | None = None,
) -> dict[str, int]:
    """Remove stale Mobility-owned dynamic entities/devices from prior materialisations.

    Registry access here is projection cleanup only. It does not discover technical
    sources, candidates or bindings. The authoritative runtime asset set remains the
    manager output built from SelectedDomainBuildInput.
    """
    started = perf_counter()
    removed_entities = 0
    removed_devices = 0
    disabled_asset_ids = set(disabled_asset_ids or set())
    stale_device_ids: set[str] = set()
    try:
        from homeassistant.helpers import entity_registry as er
        from homeassistant.helpers import device_registry as dr
        entity_registry = er.async_get(hass)
        device_registry = dr.async_get(hass)
        entries = list(er.async_entries_for_config_entry(entity_registry, entry_id))
        entities_by_device: dict[str, list[Any]] = {}
        for entity in entries:
            device_id = getattr(entity, "device_id", None)
            if device_id:
                entities_by_device.setdefault(str(device_id), []).append(entity)

        # M0.10.15 in-place topology migration. Canonical Vehicle/Charger
        # composition belongs to the RHI semantic graph, not HA Device Registry
        # parentage. Reuse device identities and actively remove historical
        # Mobility-root via_device links without waiting for the root to exist.
        root = device_registry.async_get_device(identifiers={(DOMAIN, entry_id)})
        for asset_id in sorted(current_asset_ids):
            logical = device_registry.async_get_device(identifiers={(DOMAIN, asset_id)})
            if logical is None:
                continue
            changes = {}
            if getattr(logical, "via_device_id", None) is not None:
                changes["via_device_id"] = None
            integration_disabler = getattr(
                getattr(dr, "DeviceEntryDisabler", None),
                "INTEGRATION",
                "integration",
            )
            disabled_by = getattr(logical, "disabled_by", None)
            if asset_id in disabled_asset_ids and disabled_by is None:
                changes["disabled_by"] = integration_disabler
            elif asset_id not in disabled_asset_ids and disabled_by == integration_disabler:
                changes["disabled_by"] = None
            if changes:
                device_registry.async_update_device(logical.id, **changes)

        if root is not None:
            # Previous releases materialised three intelligence summary devices.
            # Their entities now belong on the Mobility root; move the existing
            # registry rows in-place so no duplicate entity identity is created.
            surface_uids = {
                f"{DOMAIN}:surface:mobility_intelligence:status",
                f"{DOMAIN}:surface:vehicle_intelligence:status",
                f"{DOMAIN}:surface:charger_intelligence:status",
            }
            for entity in list(entries):
                if str(getattr(entity, "unique_id", "") or "") in surface_uids and getattr(entity, "device_id", None) != root.id:
                    previous_device_id = getattr(entity, "device_id", None)
                    entity_registry.async_update_entity(entity.entity_id, device_id=root.id)
                    if previous_device_id:
                        previous_rows = entities_by_device.get(str(previous_device_id), [])
                        if entity in previous_rows:
                            previous_rows.remove(entity)
                    entities_by_device.setdefault(str(root.id), []).append(entity)
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

        # Historical source-projection builds could leave an entityless Mobility-owned
        # device behind that only carries copied source identifiers. Home Assistant then
        # renders it as a separate device with a Linked devices card pointing at the real
        # source device. This is neither a logical Mobility asset nor a real source device.
        #
        # Reconcile the complete device set owned by this config entry, not only devices
        # reached through stale entities. The exact accepted source device is managed by
        # its source integration and receives the Mobility Binding Status entity directly;
        # Mobility must never retain an empty identifier-copy proxy.
        allowed_mobility_ids = set(current_asset_ids) | {entry_id}
        entry_devices = list(dr.async_entries_for_config_entry(device_registry, entry_id))
        for device in entry_devices:
            device_id = str(getattr(device, "id", "") or "")
            if not device_id:
                continue
            identifiers = set(getattr(device, "identifiers", set()) or set())
            mobility_ids = {
                str(identifier)
                for domain, identifier in identifiers
                if domain == DOMAIN
            }
            if mobility_ids & allowed_mobility_ids:
                continue
            if entities_by_device.get(device_id):
                continue
            device_registry.async_remove_device(device_id)
            removed_devices += 1
    except Exception as exc:
        _LOGGER.warning("Mobility projection reconciliation could not complete: %s", exc)
    if removed_entities or removed_devices:
        _LOGGER.info(
            "Mobility projection reconciled stale_entities=%s stale_devices=%s",
            removed_entities,
            removed_devices,
        )
    metrics = {
        "removed_entities": removed_entities,
        "removed_devices": removed_devices,
        "last_sync_duration_ms": round((perf_counter() - started) * 1000.0, 3),
        "entry_entities_scanned": len(entries) if "entries" in locals() else 0,
        "entry_devices_scanned": len(entry_devices) if "entry_devices" in locals() else 0,
        "per_device_entity_registry_scans": 0,
    }
    try:
        data = hass.data.get(DOMAIN, {}).get(entry_id)
        if isinstance(data, dict):
            previous = dict(data.get("projection_metrics") or {})
            metrics["sync_count"] = int(previous.get("sync_count") or 0) + 1
            data["projection_metrics"] = dict(metrics)
    except Exception:
        pass
    return metrics
