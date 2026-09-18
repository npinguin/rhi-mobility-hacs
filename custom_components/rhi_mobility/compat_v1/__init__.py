"""Removable Mobility V1 compatibility facade over canonical V2 truth."""

from .parity_facade import MobilityV1Facade as _ParityFacade


class MobilityV1Facade(_ParityFacade):
    @property
    def required_entity_ids(self):
        return list(self.contract.get("required_entity_ids") or [])

    def profile_rows(self, profile_type: str):
        self.profiles = tuple(dict(row) for row in (self.registry.profiles or ()))
        return super().profile_rows(profile_type)

    @staticmethod
    def _raw_capability_id(row: dict) -> str:
        provenance = row.get("source_provenance")
        provenance = dict(provenance) if isinstance(provenance, dict) else {}
        return str(row.get("raw_capability_id") or provenance.get("raw_capability_id") or "")

    def _apply_declared_property_aliases(self, rows: list[dict]) -> None:
        projection_contract = getattr(self, "projection_contract", {}) or {}
        aliases = projection_contract.get("property_alias_projection") or {}
        for row in rows:
            if row.get("available"):
                continue
            rule = aliases.get(str(row.get("property_key") or ""))
            if not isinstance(rule, dict) or rule.get("mode") != "same_accepted_fact":
                continue
            asset_id = str(row.get("asset_id") or "")
            source_key = str(rule.get("source_property_key") or "")
            if not asset_id or not source_key:
                continue
            canonical = self.projection.row(asset_id, source_key)
            if not isinstance(canonical, dict) or not canonical.get("available"):
                continue
            required_raw = str(rule.get("required_raw_capability_id") or "")
            if required_raw and self._raw_capability_id(canonical) != required_raw:
                continue
            row.update({"value": canonical.get("value"), "display_value": canonical.get("value"), "available": True, "availability_reason": canonical.get("availability_reason", "AVAILABLE"), "quality": canonical.get("quality", "SOURCE"), "health": "OK", "compatibility_alias_of": source_key, "compatibility_alias_reason": "declared_same_accepted_fact"})

    def property_rows(self, asset_type: str, component: str | None = None):
        rows = super().property_rows(asset_type, component)
        self._apply_declared_property_aliases(rows)
        for row in rows:
            unavailable = not bool(row.get("available"))
            editable = bool(row.get("editable") or row.get("write_supported"))
            hide_empty = str(row.get("empty_state_behavior") or "").strip().lower() == "hide_if_unavailable"
            if unavailable and not editable and hide_empty:
                row["access"] = "internal"
                row["product_visible"] = False
                row["presentation_reason"] = "empty_state_hidden"
        return rows

    def _command_target(self, asset_id: str, legacy_key: str):
        target_id, target_key = super()._command_target(asset_id, legacy_key)
        projection = self.command_projection.get(legacy_key) or {}
        if target_id or projection.get("target_scope") != "effective_charger":
            return target_id, target_key
        for relation in self._public_snapshot().get("relationships", []):
            if not isinstance(relation, dict) or str(relation.get("relationship_type") or "") != "configured_assignment":
                continue
            source = relation.get("from_asset_id") or relation.get("source_asset_id")
            if str(source or "") != str(asset_id):
                continue
            target = relation.get("to_asset_id") or relation.get("target_asset_id")
            if target:
                return str(target), target_key
        return None, target_key

    @staticmethod
    def _ordered_existing(values: list[str], preferred: list[str]) -> list[str]:
        out = [key for key in preferred if key in values]
        out.extend(key for key in values if key not in out)
        return out

    def component_contract(self, asset_type: str):
        contract = dict(super().component_contract(asset_type))
        components = [dict(row) for row in (contract.get("components_json") or [])]
        projection_contract = getattr(self, "projection_contract", {}) or {}
        ordering = (projection_contract.get("component_overview_order") or {}).get(asset_type) or {}
        for component in components:
            preferred = ordering.get(str(component.get("component_id") or ""))
            if isinstance(preferred, list):
                component["overview_properties"] = self._ordered_existing(list(component.get("overview_properties") or []), preferred)
        contract["components_json"] = components
        contract["components_by_id"] = {str(row.get("component_id")): row for row in components}
        return contract


__all__ = ["MobilityV1Facade"]
