from __future__ import annotations

from copy import deepcopy
from typing import Any

DOMAIN_PRESENTATION: dict[str, str] = {
    "display_name": "Mobility",
    "description": "Builds the Mobility domain model for vehicles, EV chargers and Mobility-related presence from Foundation-selected technical sources.",
    "selection_guidance": "Configure each Mobility concept by selecting the integrations and devices that provide its technical data or control surfaces.",
}

CONCEPT_PRESENTATIONS: dict[str, dict[str, str]] = {
    "vehicle": {
        "concept_id": "vehicle",
        "display_name": "Vehicle",
        "description": "Represents a vehicle managed by the Mobility domain.",
        "selection_guidance": "Select the integrations and devices that provide technical data for this vehicle.",
    },
    "charger": {
        "concept_id": "charger",
        "display_name": "EV Charger",
        "description": "Represents a physical EV charging point managed by the Mobility domain.",
        "selection_guidance": "Select the integrations and devices that expose the charging point and its technical data.",
    },
    "utility_charging_surface": {
        "concept_id": "utility_charging_surface",
        "display_name": "Utility Charging Surface",
        "description": "Represents a limited charging control or measurement surface managed by the Mobility domain when a full EVSE integration is not available.",
        "selection_guidance": "Select the integration and devices that provide the technical charging state, measurement or control surface.",
    },
    "person": {
        "concept_id": "person",
        "display_name": "Person Presence",
        "description": "Represents a person presence or location source used by the Mobility domain.",
        "selection_guidance": "Select the person source that should provide presence or location context to Mobility.",
    },
}

def canonicalize_presentation(specification: dict[str, Any]) -> dict[str, Any]:
    """Apply the one canonical domain/concept presentation block to a loaded specification."""
    concept_id = str(specification["concept"]["concept_id"])
    if concept_id not in CONCEPT_PRESENTATIONS:
        raise ValueError(f"unknown Mobility concept presentation: {concept_id}")
    specification["domain_presentation"] = deepcopy(DOMAIN_PRESENTATION)
    specification["concept"] = deepcopy(CONCEPT_PRESENTATIONS[concept_id])
    return specification
