from __future__ import annotations

from copy import deepcopy

from ..eligibility import broad_all_matching_selection
from .manager import MobilityRuntimeManager as _MobilityRuntimeManager
from .producer_candidates import collect_producer_candidates


def _cupra_canonical_odometer_candidate(candidate: dict) -> bool:
    """Return true only for the integration-native vehicle odometer field.

    cupra_eu_data_act unique ids are ``<VIN>_<field_name>``. The canonical odometer
    fields are ``mileage`` (flat payload) and ``mileage.value`` (dotted payload).
    Trip/start mileage fields deliberately remain different field names. This uses stable
    source identity from Foundation and never current_entity_id/display text or a hardcoded VIN.
    """
    ident = candidate.get("source_identity") if isinstance(candidate, dict) else None
    if not isinstance(ident, dict):
        return False
    unique_id = str(ident.get("unique_id") or "")
    if "_" not in unique_id:
        return False
    field_name = unique_id.split("_", 1)[1]
    return field_name in {"mileage", "mileage.value"}


def _semantic_candidate_filter(payload: dict) -> dict:
    """Apply domain-owned semantic disambiguation after Foundation technical discovery."""
    if not isinstance(payload, dict):
        return payload
    selection = payload.get("selection") or {}
    if (
        payload.get("builder_id") != "mobility.vehicle.connected_vehicle.v1"
        or selection.get("integration_domain") != "cupra_eu_data_act"
    ):
        return payload

    out = deepcopy(payload)
    evidence = {
        str(row.get("candidate_id")): row
        for row in out.get("candidate_evidence") or []
        if isinstance(row, dict) and row.get("candidate_id")
    }
    for group in out.get("candidate_groups") or []:
        if not isinstance(group, dict) or group.get("input_id") != "vehicle_odometer":
            continue
        original_ids = [str(value) for value in group.get("candidate_ids") or []]
        canonical_ids = [cid for cid in original_ids if _cupra_canonical_odometer_candidate(evidence.get(cid) or {})]
        if len(canonical_ids) != 1:
            # Fail closed: zero or multiple canonical fields remain an actual ambiguity.
            continue
        keep = set(canonical_ids)
        group["candidate_ids"] = canonical_ids
        group["candidate_count"] = 1
        group["candidate_matches"] = [
            row for row in group.get("candidate_matches") or []
            if isinstance(row, dict) and str(row.get("candidate_id") or "") in keep
        ]
        group["mobility_semantic_filter"] = {
            "rule": "cupra_eu_data_act_canonical_odometer_field",
            "technical_candidate_count": len(original_ids),
            "accepted_candidate_count": 1,
        }
    return out


class MobilityRuntimeManager(_MobilityRuntimeManager):
    """M0.7 runtime manager with evidence-safe product semantics."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._producer_candidates_by_asset: dict[str, dict] = {}

    async def async_replace_selected_build_inputs(self, payloads):
        rows = [_semantic_candidate_filter(row) for row in list(payloads or [])]
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
