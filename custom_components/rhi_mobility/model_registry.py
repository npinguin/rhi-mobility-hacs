from __future__ import annotations

from copy import deepcopy
import json
from importlib.resources import files
from typing import Any


class MobilityModelRegistry:
    """Load generated authoritative Mobility contracts without runtime mutation.

    Contract generation and semantic ownership live in contracts/domain and the
    deterministic generators. This loader must never rewrite matching, versions,
    presentation, aliases, producer ownership, or other contract semantics.
    """

    def __init__(self) -> None:
        spec_root = files("custom_components.rhi_mobility.contracts.build_specifications")
        self.specs: dict[str, dict[str, Any]] = {}
        for item in spec_root.iterdir():
            if item.name.endswith(".json") and item.name != "manifest.json":
                spec = json.loads(item.read_text(encoding="utf-8"))
                self.specs[str(spec["builder_id"])] = spec

        model_root = files("custom_components.rhi_mobility.contracts.runtime")
        self.domain_model = json.loads((model_root / "domain_runtime_model.json").read_text(encoding="utf-8"))
        self.builder_models = self.domain_model["builders"]

        legacy_runtime = json.loads((model_root / "legacy_public_runtime_v1.json").read_text(encoding="utf-8"))
        self.legacy_aliases = dict(legacy_runtime.get("aliases") or {})
        self.legacy_property_definitions = tuple(dict(row) for row in legacy_runtime.get("property_definitions", []))

        self.semantic_catalog = json.loads((model_root / "semantic_property_catalog.json").read_text(encoding="utf-8"))
        profile_catalog = json.loads((model_root / "profile_catalog.json").read_text(encoding="utf-8"))
        self.profiles = tuple(dict(row) for row in profile_catalog.get("profiles", []))
        self._profiles_by_id = {str(row["profile_id"]): dict(row) for row in self.profiles}

        parity_path = model_root / "v1_drop_in_parity.json"
        self.v1_drop_in_parity = json.loads(parity_path.read_text(encoding="utf-8")) if parity_path.is_file() else {}

    def build_spec(self, builder_id: str) -> dict[str, Any]:
        try:
            return deepcopy(self.specs[builder_id])
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
