from __future__ import annotations
from typing import Any
import logging

_LOGGER = logging.getLogger(__name__)


from .energy import MobilityEnergyV2Provider


class MobilityEnergyReadOnlyProvider:
    """Backward-compatible provider ID backed by the V2 Energy projection."""
    CONTRACT_ID = "MOBILITY_ENERGY_READ_ONLY_V1"

    def __init__(self, manager, registry, controller=None, public_provider=None) -> None:
        self.manager = manager
        self.registry = registry
        self.controller = controller
        self._v2 = MobilityEnergyV2Provider(manager, controller, registry, public_provider) if controller is not None else None

    def snapshot(self) -> dict[str, Any]:
        if self._v2 is None:
            return {"contract_id": self.CONTRACT_ID,"publisher":"rhi_mobility","read_only":True,"contains_commands":False,"contains_source_bindings":False,"assets":[],"relationships":[]}
        v2 = self._v2.snapshot()
        assets = []
        for row in v2["consumer_assets"]:
            facts = {"vehicle.soc_pct": row.get("soc_pct"), "vehicle.target_soc_pct": row.get("target_soc_pct"), "vehicle.required_energy_kwh": row.get("required_energy_kwh"), "vehicle.ready_by": row.get("ready_by"), "vehicle.charge_power_kw": row.get("power_kw"), "vehicle.charging_state": row.get("operating_state")}
            assets.append({"asset_id": row["asset_id"], "concept_id": "vehicle", "health": row["health"], "facts": {k:v for k,v in facts.items() if v is not None}})
        for row in v2["connection_assets"]:
            facts = {"charger.power_kw": row.get("power_kw"), "charger.energy_total_kwh": (row.get("metering") or {}).get("lifetime_energy_kwh"), "charger.connection_state": row.get("connection_state"), "charger.operating_state": row.get("operating_state")}
            assets.append({"asset_id": row["asset_id"], "concept_id": "charger", "health": row["health"], "facts": {k:v for k,v in facts.items() if v is not None}})
        return {"contract_id": self.CONTRACT_ID, "publisher": "rhi_mobility", "read_only": True, "contains_commands": False, "contains_source_bindings": False, "assets": assets, "relationships": [{"relationship_id": r.relationship_id,"relationship_type": r.relationship_type,"from_asset_id": r.from_asset_id,"to_asset_id": r.to_asset_id,"health": r.health} for r in self.manager.effective_relationships.values()], "canonical_successor": "MOBILITY_ENERGY_V2"}
