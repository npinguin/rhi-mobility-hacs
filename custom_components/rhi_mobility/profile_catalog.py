from __future__ import annotations

from typing import Any


class MobilityProfileCatalogProvider:
    """Read-only local profile catalog for product consumers.

    This is an index surface only.  It never resolves canonical truth and never reads
    integrations.  Runtime truth remains owned by MobilityRuntimeManager/Property
    semantics; UX uses this catalog only for browsing and product knowledge.
    """

    CONTRACT_ID = "MOBILITY_PROFILE_CATALOG_V2"

    def __init__(self, registry) -> None:
        self.registry = registry

    @staticmethod
    def _row(profile: dict[str, Any]) -> dict[str, Any]:
        identity = {
            "brand": profile.get("brand"),
            "model": profile.get("model"),
            "variant": profile.get("variant"),
            "model_year": profile.get("model_year"),
        }
        excluded = {
            "profile_id", "profile_type", "brand", "manufacturer", "vendor", "model",
            "variant", "model_year", "display_name", "short_name", "image_key",
            "auto_resolve", "catalog_role",
        }
        technical = {key: value for key, value in profile.items() if key not in excluded and value is not None}
        return {
            "profile_id": str(profile["profile_id"]),
            "asset_type": str(profile["profile_type"]),
            "identity": identity,
            "technical_specification": technical,
            "auto_resolve": bool(profile.get("auto_resolve", False)),
            "catalog_role": str(profile.get("catalog_role") or "product"),
        }

    def snapshot(self) -> dict[str, Any]:
        rows = []
        for profile_type in ("vehicle", "charger"):
            rows.extend(self._row(row) for row in self.registry.profiles_for_type(profile_type))
        return {
            "contract_id": self.CONTRACT_ID,
            "publisher": "rhi_mobility",
            "local_only": True,
            "internet_required": False,
            "profiles": sorted(rows, key=lambda row: (row["asset_type"], row["profile_id"])),
        }
