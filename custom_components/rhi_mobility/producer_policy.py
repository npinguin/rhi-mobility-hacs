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
    """Return the only authoritative producer declaration for M0.7.0.

    ``producer_type`` is a legacy generated compatibility field. Runtime semantics must
    never consume it. Catalog regeneration can remove it once all retained historical
    contract snapshots have been migrated.
    """
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
