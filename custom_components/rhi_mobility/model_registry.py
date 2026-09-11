from __future__ import annotations
from copy import deepcopy
import json
from importlib.resources import files
from typing import Any
from .contracts.presentation import canonicalize_presentation

_MUTABLE_NAME_FIELDS = {
    "source_identity.unique_id",
    "source_identity.service_name",
}


def _separate_structural_evidence_from_name_hints(spec: dict[str, Any]) -> dict[str, Any]:
    """Make current HA/integration names supporting evidence, never capability authority.

    Domain adapters still declare the semantic ``raw_capability_id`` for an input, but
    mutable entity/service naming predicates are moved out of authoritative ``all_of``
    and into ``hints``. Foundation may use those hints to rank otherwise equal
    technical candidates; if the hints stop matching after an integration rename the
    result must become ambiguous/unavailable rather than silently bind another fact.
    """
    out = deepcopy(spec)
    inputs = (out.get("candidate_requirements") or {}).get("normalized_inputs") or []
    for row in inputs:
        for match in row.get("integration_matches") or []:
            structural: list[dict[str, Any]] = []
            hints: list[dict[str, Any]] = list(match.get("hints") or [])
            for predicate in match.get("all_of") or []:
                if isinstance(predicate, dict) and predicate.get("field") in _MUTABLE_NAME_FIELDS:
                    hints.append(dict(predicate))
                else:
                    structural.append(dict(predicate) if isinstance(predicate, dict) else predicate)
            match["all_of"] = structural
            if hints:
                match["hints"] = hints
    return out


def _normalize_current_ocpp_contract(spec: dict[str, Any]) -> dict[str, Any]:
    """Apply source-name-independent cardinality corrections only."""
    if spec.get("builder_id") != "mobility.charger.full_evse.v1":
        return spec
    out = deepcopy(spec)
    out["builder_version"] = "1.6.0"
    inputs = (out.get("candidate_requirements") or {}).get("normalized_inputs") or []
    for row in inputs:
        if str(row.get("input_id") or "") == "charger_power":
            row["required"] = False
            row["cardinality"] = "zero_or_one_per_group"
    return out


def _normalize_current_vehicle_contract(spec: dict[str, Any]) -> dict[str, Any]:
    """Keep the generated vehicle contract free of target-specific source rewrites."""
    if spec.get("builder_id") != "mobility.vehicle.connected_vehicle.v1":
        return spec
    out = deepcopy(spec)
    out["builder_version"] = "1.6.0"
    return out


class MobilityModelRegistry:
    """Loads generated copies of authoritative release contracts."""
    def __init__(self) -> None:
        spec_root=files("custom_components.rhi_mobility.contracts.build_specifications"); self.specs={}
        for item in spec_root.iterdir():
            if item.name.endswith(".json") and item.name!="manifest.json":
                spec=json.loads(item.read_text(encoding="utf-8"))
                spec=_normalize_current_ocpp_contract(spec)
                spec=_normalize_current_vehicle_contract(spec)
                spec=_separate_structural_evidence_from_name_hints(spec)
                spec=canonicalize_presentation(spec)
                self.specs[spec["builder_id"]]=spec
        model_root=files("custom_components.rhi_mobility.contracts.runtime")
        self.domain_model=json.loads((model_root/"domain_runtime_model.json").read_text(encoding="utf-8")); self.builder_models=self.domain_model["builders"]
        self.semantic_catalog=json.loads((model_root/"semantic_property_catalog.json").read_text(encoding="utf-8"))
        profile_catalog=json.loads((model_root/"profile_catalog.json").read_text(encoding="utf-8")); self.profiles=tuple(dict(row) for row in profile_catalog.get("profiles",[])); self._profiles_by_id={str(row["profile_id"]):dict(row) for row in self.profiles}
        legacy_runtime=json.loads((model_root/"legacy_public_runtime_v1.json").read_text(encoding="utf-8")); self.legacy_aliases=dict(legacy_runtime.get("aliases") or {}); self.legacy_property_definitions=tuple(dict(row) for row in legacy_runtime.get("property_definitions",[]))
        parity_path=model_root/"v1_drop_in_parity.json"; self.v1_drop_in_parity=json.loads(parity_path.read_text(encoding="utf-8")) if parity_path.is_file() else {}
    def build_spec(self,builder_id: str) -> dict[str,Any]:
        try: return self.specs[builder_id]
        except KeyError as exc: raise ValueError(f"unsupported Mobility builder_id: {builder_id}") from exc
    def builder_model(self,builder_id: str) -> dict[str,Any]:
        try: return self.builder_models[builder_id]
        except KeyError as exc: raise ValueError(f"missing Mobility domain model for builder_id: {builder_id}") from exc
    def profile(self,profile_id: str|None) -> dict[str,Any]|None:
        if not profile_id: return None
        row=self._profiles_by_id.get(str(profile_id)); return None if row is None else dict(row)
    def profiles_for_type(self,profile_type: str) -> list[dict[str,Any]]:
        return [dict(row) for row in self.profiles if row.get("profile_type")==profile_type]
