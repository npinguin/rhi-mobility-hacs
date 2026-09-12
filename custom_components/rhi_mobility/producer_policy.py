from __future__ import annotations

from typing import Any

ALLOWED_PRODUCER_TYPES = frozenset({
    "SOURCE",
    "CONFIGURED",
    "PROFILE",
    "RELATIONSHIP",
    "CONTROL_READBACK",
    "DERIVED",
    "ALIAS",
})


def declared_producer_types(definition: dict[str, Any]) -> tuple[str, ...]:
    """Return the sole authoritative producer declaration for a canonical property."""
    raw = definition.get("producer_types")
    if not isinstance(raw, list) or not raw:
        raise ValueError("canonical property missing producer_types")
    rows = tuple(str(value) for value in raw)
    if len(set(rows)) != len(rows):
        raise ValueError("canonical property producer_types contains duplicates")
    unknown = set(rows) - ALLOWED_PRODUCER_TYPES
    if unknown:
        raise ValueError(f"canonical property has unsupported producer_types: {sorted(unknown)}")
    return rows


def validate_catalog_producer_ownership(properties: dict[str, Any]) -> None:
    for property_id, definition in properties.items():
        if not isinstance(definition, dict):
            raise ValueError(f"invalid canonical property definition: {property_id}")
        declared_producer_types(definition)
