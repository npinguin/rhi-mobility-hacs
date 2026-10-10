"""Mobility domain capability ownership — no duplicate asset or runtime truth.

Resolves offerings from the sole domain semantic registry and current canonical
asset model. Public consumers may render these definitions but must not infer
supported commands or property visibility from raw integration/entity names.
"""
from __future__ import annotations

from typing import Any


class MobilityCapabilityService:
    def __init__(self, registry: Any) -> None:
        self.registry = registry

    def property_definition(self, asset_type: str, property_key: str) -> dict[str, Any] | None:
        """One definition for HA entity, API consumer and diagnostics."""
        from .model_registry import MobilityModelRegistry
        definition = MobilityModelRegistry.property_definition(self.registry, property_key, asset_type)
        if definition is None:
            return None
        types = set(definition.get("applicable_asset_types") or [])
        if types and asset_type not in types:
            return None
        return {**definition, "property_key": property_key}

    def engineering_only(self, asset_type: str, property_key: str) -> bool:
        definition = self.property_definition(asset_type, property_key)
        return definition is not None and definition.get("visibility") == "engineering"

    def product_visible(self, asset_type: str, property_key: str) -> bool:
        definition = self.property_definition(asset_type, property_key)
        return definition is not None and definition.get("visibility") == "product"

    def supported_property_keys(self, manager: Any, asset_id: str) -> frozenset[str]:
        """Only the canonical runtime may claim live asset support."""
        getter = getattr(manager, "supported_property_keys", None)
        if not callable(getter):
            return frozenset()
        return frozenset(str(key) for key in getter(asset_id))
