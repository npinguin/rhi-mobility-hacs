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

    def property_rows(self, asset_type: str, component: str | None = None):
        """Apply backend-owned empty-state presentation to the frozen V1 shape.

        V2 retains every typed resolution for diagnostics/coverage.  The frozen UX,
        however, predates ``empty_state_behavior`` and renders every unavailable row as
        the literal word ``Unknown``.  Marking only catalog-declared
        ``hide_if_unavailable`` read-only rows internal keeps those facts available in
        V2/diagnostics without forcing the old product UI to display unsupported or
        temporarily absent capabilities.  Editable configuration rows always stay
        visible so a missing profile/assignment can be corrected by the user.
        """
        rows = super().property_rows(asset_type, component)
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
