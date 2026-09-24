from __future__ import annotations

from copy import deepcopy
import json
from importlib.resources import files
from typing import Any
import weakref

_PROFILE_OVERLAY_PROVIDER: weakref.ReferenceType | None = None


def set_profile_overlay_provider(provider: Any) -> None:
    """Bind the single loaded Mobility config entry as profile overlay authority.

    The reference is weak so unload cannot leave a live semantic owner behind. Packaged
    catalog profiles remain immutable defaults; Mobility-authored profiles are an overlay
    owned by the integration options store.
    """
    global _PROFILE_OVERLAY_PROVIDER
    _PROFILE_OVERLAY_PROVIDER = weakref.ref(provider)


def _profile_overlay_provider() -> Any | None:
    return None if _PROFILE_OVERLAY_PROVIDER is None else _PROFILE_OVERLAY_PROVIDER()


class MobilityModelRegistry:
    """Load generated authoritative Mobility contracts plus Mobility-owned profiles.

    Contract generation and semantic ownership live in contracts/domain and the
    deterministic generators. Technical matching, versions, aliases and producer ownership
    are immutable at runtime. The only runtime overlay is the domain-owned logical profile
    catalog; it never mutates Foundation evidence or accepted source bindings.
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

        self.semantic_catalog = json.loads((model_root / "semantic_property_catalog.json").read_text(encoding="utf-8"))
        self.semantic_aliases = dict(self.semantic_catalog.get("aliases") or {})
        profile_catalog = json.loads((model_root / "profile_catalog.json").read_text(encoding="utf-8"))
        self.profiles = tuple(dict(row) for row in profile_catalog.get("profiles", []))
        self._profiles_by_id = {str(row["profile_id"]): dict(row) for row in self.profiles}

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
        provider = _profile_overlay_provider()
        disabled = getattr(provider, "is_profile_disabled", None)
        if callable(disabled) and disabled(str(profile_id)):
            return None
        getter = getattr(provider, "profile", None)
        overlay = getter(str(profile_id)) if callable(getter) else None
        if isinstance(overlay, dict):
            return dict(overlay)
        row = self._profiles_by_id.get(str(profile_id))
        return None if row is None else dict(row)

    @staticmethod
    def _identity_token(value: Any) -> str:
        if value in (None, ""):
            return ""
        return " ".join(str(value).strip().casefold().replace("-", " ").split())

    def resolve_profile(self, profile_type: str, identity: dict[str, Any]) -> dict[str, Any] | None:
        """Resolve one local product profile from exact structured identity only.

        Backend truth never uses fuzzy matching, integration names, device labels or
        profile-id parsing.  Incomplete identity remains partial/custom and therefore
        deliberately returns no automatic profile.
        """
        keys = ("brand", "model", "variant", "model_year")
        wanted = {
            "brand": self._identity_token(identity.get("brand")),
            "model": self._identity_token(identity.get("model")),
            "variant": self._identity_token(identity.get("variant")),
            "model_year": str(identity.get("model_year") or "").strip(),
        }
        if not all(wanted.values()):
            return None
        matches = []
        for row in self.profiles_for_type(profile_type):
            if row.get("auto_resolve") is False:
                continue
            candidate = {
                "brand": self._identity_token(row.get("brand")),
                "model": self._identity_token(row.get("model")),
                "variant": self._identity_token(row.get("variant")),
                "model_year": str(row.get("model_year") or "").strip(),
            }
            if all(candidate[key] == wanted[key] for key in keys):
                matches.append(dict(row))
        return matches[0] if len(matches) == 1 else None

    def profiles_for_type(self, profile_type: str) -> list[dict[str, Any]]:
        provider = _profile_overlay_provider()
        disabled_getter = getattr(provider, "disabled_profile_ids", None)
        disabled = disabled_getter() if callable(disabled_getter) else set()
        rows = {
            str(row["profile_id"]): dict(row)
            for row in self.profiles
            if row.get("profile_type") == profile_type and str(row["profile_id"]) not in disabled
        }
        getter = getattr(provider, "profiles_for_type", None)
        for row in getter(profile_type) if callable(getter) else []:
            if isinstance(row, dict) and row.get("profile_id"):
                rows[str(row["profile_id"])] = dict(row)
        return [rows[key] for key in sorted(rows)]
