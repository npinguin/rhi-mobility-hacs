from __future__ import annotations
from copy import deepcopy
import json
from importlib.resources import files
from typing import Any

from .contracts.presentation import canonicalize_presentation


def _normalize_current_ocpp_contract(spec: dict[str, Any]) -> dict[str, Any]:
    """Correct OCPP charger discovery against observed HA 2026.9 source identities.

    Shared Baseline 1.7.0 deliberately exposes ``source_identity.unique_id`` as the
    portable entity identity match surface.  Target Foundation diagnostics prove that
    current OCPP entities retain semantic unique IDs such as
    ``ocpp.<charger>.status_connector.sensor`` and
    ``ocpp.<charger>.energy_active_import_register.sensor``.

    Two defects in the generated M0.5.x charger adapter are corrected here without
    changing the Shared Baseline:

    * the required physical operating-state input used ``status.sensor`` even though
      the physical connector state is ``status_connector.sensor``;
    * measured active-import power was mandatory for every charger, which filtered
      otherwise valid physical OCPP charge points when that optional meter value is
      not exposed by the charger/integration.  Power remains in the canonical product
      contract and can be bound whenever evidence exists; absence no longer prevents
      the physical charger from materializing.

    Physical OCPP identity remains fail-closed because connector status is required on
    the selected device.  Central-system/server objects do not expose connector status
    on their own device and therefore cannot qualify as charger assets.
    """
    if spec.get("builder_id") != "mobility.charger.full_evse.v1":
        return spec

    out = deepcopy(spec)
    out["builder_version"] = "1.6.0"
    inputs = (out.get("candidate_requirements") or {}).get("normalized_inputs") or []

    for row in inputs:
        input_id = str(row.get("input_id") or "")

        if input_id == "charger_operating_state":
            for match in row.get("integration_matches") or []:
                if match.get("integration_domain") != "ocpp" or match.get("source_kind") != "entity":
                    continue
                predicates = match.get("all_of") or []
                if len(predicates) != 1 or not isinstance(predicates[0], dict):
                    continue
                predicate = predicates[0]
                if predicate.get("field") == "source_identity.unique_id" and predicate.get("operator") == "ends_with":
                    predicate["value"] = "status_connector.sensor"

        if input_id == "charger_power":
            # Charger existence must not depend on optional metering.  The semantic
            # charger.power property still exists and becomes unknown/unavailable when
            # no measured power binding is present.
            row["required"] = False
            row["cardinality"] = "zero_or_one_per_group"

    return out


class MobilityModelRegistry:
    """Loads generated copies of authoritative release contracts."""
    def __init__(self) -> None:
        spec_root = files("custom_components.rhi_mobility.contracts.build_specifications")
        self.specs: dict[str, dict[str, Any]] = {}
        for item in spec_root.iterdir():
            if item.name.endswith(".json") and item.name != "manifest.json":
                spec = json.loads(item.read_text(encoding="utf-8"))
                spec = _normalize_current_ocpp_contract(spec)
                spec = canonicalize_presentation(spec)
                self.specs[spec["builder_id"]] = spec
        model_root = files("custom_components.rhi_mobility.contracts.runtime")
        self.domain_model = json.loads((model_root / "domain_runtime_model.json").read_text(encoding="utf-8"))
        self.builder_models = self.domain_model["builders"]

        # Canonical V2 authorities. Compatibility artifacts are validation/facade inputs only.
        self.semantic_catalog = json.loads((model_root / "semantic_property_catalog.json").read_text(encoding="utf-8"))
        profile_catalog = json.loads((model_root / "profile_catalog.json").read_text(encoding="utf-8"))
        self.profiles = tuple(dict(row) for row in profile_catalog.get("profiles", []))
        self._profiles_by_id = {str(row["profile_id"]): dict(row) for row in self.profiles}

        legacy_runtime = json.loads((model_root / "legacy_public_runtime_v1.json").read_text(encoding="utf-8"))
        self.legacy_aliases = dict(legacy_runtime.get("aliases") or {})
        self.legacy_property_definitions = tuple(dict(row) for row in legacy_runtime.get("property_definitions", []))
        parity_path = model_root / "v1_drop_in_parity.json"
        self.v1_drop_in_parity = json.loads(parity_path.read_text(encoding="utf-8")) if parity_path.is_file() else {}

    def build_spec(self, builder_id: str) -> dict[str, Any]:
        try:
            return self.specs[builder_id]
        except KeyError as exc:
            raise ValueError(f"unsupported Mobility builder_id: {builder_id}") from exc

    def builder_model(self, builder_id: str) -> dict[str, Any]:
        try:
            return self.builder_models[builder_id]
        except KeyError as exc:
            raise ValueError(f"missing Mobility domain model for builder_id: {builder_id}") from exc

    def profile(self, profile_id: str | None) -> dict[str, Any] | None:
        if not profile_id:
            return None
        row = self._profiles_by_id.get(str(profile_id))
        return None if row is None else dict(row)

    def profiles_for_type(self, profile_type: str) -> list[dict[str, Any]]:
        return [dict(row) for row in self.profiles if row.get("profile_type") == profile_type]
