"""Frozen Mobility V1 compatibility facade.

This package is the complete removable compatibility boundary after UX consumers
migrate to MOBILITY_PUBLIC_RUNTIME_V2. No canonical Mobility semantics are owned here.
"""

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
        """Project explicitly declared V1 aliases from already-published V2 facts only.

        Alias rules live in the V1 projection contract. They cannot bind sources,
        calculate values, infer readiness or mutate canonical V2 truth. Decommissioning
        V1 therefore removes this package and its projection contract without touching V2.
        """
        projection_contract = getattr(self, "projection_contract", {}) or {}
        aliases = projection_contract.get("property_alias_projection") or {}
        for row in rows:
            if row.get("available"):
                continue
            target_key = str(row.get("property_key") or "")
            rule = aliases.get(target_key)
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
            row.update(
                {
                    "value": canonical.get("value"),
                    "display_value": canonical.get("value"),
                    "available": True,
                    "availability_reason": canonical.get("availability_reason", "AVAILABLE"),
                    "quality": canonical.get("quality", "SOURCE"),
                    "health": "OK",
                    "compatibility_alias_of": source_key,
                    "compatibility_alias_reason": "declared_same_accepted_fact",
                }
            )

    def property_rows(self, asset_type: str, component: str | None = None):
        """Apply bounded V1 presentation compatibility over canonical V2 properties.

        V2 retains every typed resolution for diagnostics/coverage. The frozen UX
        predates ``empty_state_behavior`` and renders every unavailable row as the
        literal word ``Unknown``. Catalog-declared ``hide_if_unavailable`` read-only
        rows are therefore hidden only at this removable V1 boundary. Editable
        configuration rows remain visible so missing configuration can be corrected.

        Any V1 property alias is declared in ``v1_facade_projection.json`` and can only
        copy the same already-published V2 fact under an exact provenance condition.
        The facade never rereads Home Assistant state, Foundation internals or the
        Mobility runtime manager.
        """
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


__all__ = ["MobilityV1Facade"]
