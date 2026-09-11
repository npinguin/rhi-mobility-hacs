from __future__ import annotations

from ..eligibility import broad_all_matching_selection
from .manager import MobilityRuntimeManager as _MobilityRuntimeManager
from .producer_candidates import collect_producer_candidates


class MobilityRuntimeManager(_MobilityRuntimeManager):
    """M0.7.0 runtime manager with evidence-safe product semantics.

    Specific profiles require explicit Mobility configuration. Broad technical
    integrations may not materialize Mobility objects through all-matching selection.
    Producer-native candidates are retained independently from the legacy selected value
    so truth precedence can migrate without losing evidence.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._producer_candidates_by_asset: dict[str, dict] = {}

    async def async_replace_selected_build_inputs(self, payloads):
        rows = list(payloads or [])
        rejected = [row for row in rows if broad_all_matching_selection(row)]
        accepted = [row for row in rows if not broad_all_matching_selection(row)]
        result = await super().async_replace_selected_build_inputs(accepted)
        if rejected:
            diagnostics = list(getattr(self, "_capability_diagnostics", ()) or ())
            for row in rejected:
                selection = row.get("selection") or {}
                diagnostics.append({
                    "builder_id": row.get("builder_id"),
                    "integration_domain": selection.get("integration_domain"),
                    "selection_id": None,
                    "asset_id": "selection_scope",
                    "device_id": None,
                    "input_id": "device_eligibility",
                    "required": True,
                    "status": "REJECTED_REVIEW_REQUIRED",
                    "reason": "broad technical integrations require explicit concrete device selection for Mobility object creation",
                    "candidate_id": None,
                    "source_kind": None,
                    "target_scope": None,
                    "raw_capability_id": None,
                    "published_match": None,
                    "normalized_properties": [],
                })
            self._capability_diagnostics = diagnostics
        return result

    def _refresh(self, asset_id: str) -> None:
        super()._refresh(asset_id)
        if asset_id in self.assets:
            self._producer_candidates_by_asset[asset_id] = collect_producer_candidates(self, asset_id)
        else:
            self._producer_candidates_by_asset.pop(asset_id, None)

    def producer_candidates(self, asset_id: str, property_id: str | None = None):
        rows = self._producer_candidates_by_asset.get(asset_id, {})
        if property_id is None:
            return rows
        return rows.get(property_id, {})

    def clear_all(self) -> None:
        self._producer_candidates_by_asset.clear()
        super().clear_all()

    def effective_profile_id(self, asset_id: str) -> str | None:
        configured = self.configuration_value(asset_id, "asset.profile_id", None)
        if configured in (None, ""):
            return None
        profile_id = str(configured)
        getter = getattr(self.registry, "profile", None)
        profile = getter(profile_id) if callable(getter) else None
        asset = self.assets.get(asset_id)
        if asset is None or not isinstance(profile, dict):
            return None
        if profile.get("profile_type") != asset.concept_id:
            return None
        return profile_id
