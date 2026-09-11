from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class RelationshipStatus(StrEnum):
    CONSISTENT = "CONSISTENT"
    CONFIGURED_ONLY = "CONFIGURED_ONLY"
    OBSERVED_ONLY = "OBSERVED_ONLY"
    CONFLICT = "CONFLICT"
    UNKNOWN = "UNKNOWN"


@dataclass(frozen=True, slots=True)
class VehicleChargerRelationship:
    vehicle_id: str
    configured_charger_id: str | None
    effective_charger_id: str | None
    physically_connected_charger_id: str | None
    status: RelationshipStatus
    observed_identity_proven: bool = False
    reason: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "vehicle_id": self.vehicle_id,
            "configured_charger_id": self.configured_charger_id,
            "effective_charger_id": self.effective_charger_id,
            "physically_connected_charger_id": self.physically_connected_charger_id,
            "relationship_status": self.status.value,
            "observed_identity_proven": self.observed_identity_proven,
            "reason": self.reason,
        }


def _configured_charger(manager: Any, vehicle_id: str) -> str | None:
    configured = manager.configuration_value(vehicle_id, "vehicle.selected_charger", None)
    if configured not in (None, ""):
        return str(configured)
    for rel in getattr(manager, "relationships", {}).values():
        if (
            getattr(rel, "relationship_type", None) == "configured_assignment"
            and getattr(rel, "from_asset_id", None) == vehicle_id
        ):
            return str(rel.to_asset_id)
    return None


def _explicit_observed_charger(manager: Any, vehicle_id: str) -> str | None:
    """Return a physical charger only when runtime carries explicit vehicle identity.

    Generic connector state such as `asset_connected` proves occupancy, not which
    vehicle is connected, and therefore must never be promoted to observed identity.
    """
    for rel in getattr(manager, "relationships", {}).values():
        relation_type = str(getattr(rel, "relationship_type", ""))
        if relation_type not in {"physical_connection", "observed_connection"}:
            continue
        if getattr(rel, "from_asset_id", None) == vehicle_id:
            return str(rel.to_asset_id)
    return None


def resolve_vehicle_charger_relationship(manager: Any, vehicle_id: str) -> VehicleChargerRelationship:
    configured = _configured_charger(manager, vehicle_id)
    effective_fn = getattr(manager, "effective_charger_for_vehicle", None)
    effective = effective_fn(vehicle_id) if callable(effective_fn) else configured
    effective = None if effective in (None, "") else str(effective)
    observed = _explicit_observed_charger(manager, vehicle_id)

    if configured and observed and configured != observed:
        status = RelationshipStatus.CONFLICT
        reason = "configured_and_observed_charger_differ"
    elif observed and effective and observed == effective:
        status = RelationshipStatus.CONSISTENT
        reason = None
    elif configured or effective:
        status = RelationshipStatus.CONFIGURED_ONLY
        reason = "no_explicit_physical_vehicle_identity"
    elif observed:
        status = RelationshipStatus.OBSERVED_ONLY
        reason = "physical_relationship_not_configured"
    else:
        status = RelationshipStatus.UNKNOWN
        reason = "no_relationship_evidence"

    return VehicleChargerRelationship(
        vehicle_id=vehicle_id,
        configured_charger_id=configured,
        effective_charger_id=effective,
        physically_connected_charger_id=observed,
        status=status,
        observed_identity_proven=observed is not None,
        reason=reason,
    )
