"""Manual vehicle-page actions delegate to exactly one existing physical charger.

They are *assigned charger* controls, not synthetic vehicle API commands and
do not infer vehicle identity from connector occupancy.
"""
from __future__ import annotations
from typing import Any, Mapping

from .relationship_resolution import (
    RelationshipStatus,
    resolve_charger_vehicle_relationship,
    resolve_vehicle_charger_relationship,
)


def resolve_vehicle_charge_route(
    manager: Any,
    descriptors: Mapping[str, Any],
    vehicle_id: str,
    action: str,
) -> dict[str, Any]:
    if action not in {"start", "stop"}:
        raise ValueError("unsupported_assigned_charger_action")
    assets = getattr(manager, "assets", {}) or {}
    vehicle = assets.get(vehicle_id)
    result = {
        "consumer_asset_id": vehicle_id,
        "operation": action,
        "command_owner": "rhi_mobility",
        "execution_owner": "assigned_physical_charger",
        "charger_asset_id": None,
        "charger_display_name": None,
        "command_key": f"charger.command.{action}",
        "supported": False,
        "execution_allowed": False,
        "blocked_reason": "vehicle_not_found",
        "observed_identity_proven": False,
        "assigned_not_identified": True,
    }
    if vehicle is None or getattr(vehicle, "concept_id", None) != "vehicle":
        return result
    effective = getattr(manager, "effective_charger_for_vehicle", None)
    charger_id = effective(vehicle_id) if callable(effective) else None
    if not charger_id or charger_id not in assets or getattr(assets[charger_id], "concept_id", None) != "charger":
        result["blocked_reason"] = "assigned_charger_missing"
        return result
    result["charger_asset_id"] = charger_id
    result["charger_display_name"] = getattr(assets[charger_id], "display_name", charger_id)
    vehicle_relation = resolve_vehicle_charger_relationship(manager, vehicle_id)
    charger_relation = resolve_charger_vehicle_relationship(manager, charger_id)
    result["observed_identity_proven"] = charger_relation.physically_connected_vehicle_id == vehicle_id
    result["assigned_not_identified"] = not result["observed_identity_proven"]
    result["relationship_status"] = charger_relation.status.value
    result["charger_occupied"] = charger_relation.charger_occupied
    if charger_relation.assigned_vehicle_count != 1 or charger_relation.assigned_vehicle_id != vehicle_id:
        result["blocked_reason"] = "charger_assignment_not_unique"
        return result
    if vehicle_relation.status == RelationshipStatus.CONFLICT or charger_relation.status == RelationshipStatus.CONFLICT:
        result["blocked_reason"] = "vehicle_charger_identity_conflict"
        return result
    snapshots = getattr(manager, "snapshots", {}) or {}
    for aid in (vehicle_id, charger_id):
        snap = snapshots.get(aid)
        values = getattr(snap, "values", {}) if snap is not None else {}
        if isinstance(values, dict) and values.get("asset.lifecycle_status") == "disabled":
            result["blocked_reason"] = "lifecycle_disabled"
            return result
    cid = f"{charger_id}:charger.command.{action}"
    descriptor = descriptors.get(cid)
    if descriptor is None:
        result["blocked_reason"] = "physical_charger_command_not_supported"
        return result
    result["supported"] = True
    result["physical_command_id"] = cid
    if not bool(getattr(descriptor, "execution_allowed", False)):
        result["blocked_reason"] = str(getattr(descriptor, "blocked_reason", None) or "charger_command_unavailable")
        return result
    result["execution_allowed"] = True
    result["blocked_reason"] = None
    return result
