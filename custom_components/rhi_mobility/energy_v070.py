from __future__ import annotations

from typing import Any

from .interop import MobilityEnergyV2Provider as _LegacyEnergyV2Provider
from .property_resolver import PropertyResolver
from .readiness import evaluate_asset_readiness
from .relationship_resolution import resolve_vehicle_charger_relationship


class MobilityEnergyV2Provider(_LegacyEnergyV2Provider):
    """M0.7.0 Energy boundary backed by typed Mobility property resolutions.

    The legacy V2 shape remains intact for compatibility. New resolved_facts and typed
    readiness/relationship fields are added without exposing HA source bindings or raw
    service targets to Energy.
    """

    CONTRACT_ID = "MOBILITY_ENERGY_V2"

    def __init__(self, manager, controller, registry, public_provider=None) -> None:
        super().__init__(manager, controller, registry, public_provider)
        self._resolver = PropertyResolver(manager, public_provider) if public_provider is not None else None

    def _resolution(self, asset_id: str, property_id: str):
        if self._resolver is None:
            return None
        return self._resolver.resolve(asset_id, property_id)

    def _v(self, aid: str, key: str):
        resolution = self._resolution(aid, key)
        if resolution is not None:
            return resolution.value if resolution.available else None
        return super()._v(aid, key)

    def _resolved_fact(self, asset_id: str, property_id: str) -> dict[str, Any]:
        resolution = self._resolution(asset_id, property_id)
        if resolution is None:
            return {
                "asset_id": asset_id,
                "property_id": property_id,
                "value": None,
                "status": "RESOLUTION_ERROR",
                "quality": "UNKNOWN",
                "reason_code": "typed_resolver_unavailable",
            }
        row = resolution.as_dict()
        source = dict(row.pop("source_reference", {}) or {})
        row["source_reference"] = {
            key: source[key]
            for key in (
                "candidate_id",
                "raw_capability_id",
                "technical_capability",
                "profile_id",
                "compatibility_alias_of",
            )
            if source.get(key) not in (None, "")
        }
        return row

    def _energy_fact_ids(self, asset_type: str) -> tuple[str, ...]:
        if asset_type == "vehicle":
            return (
                "asset.availability_state",
                "vehicle.soc_pct",
                "vehicle.battery_capacity_kwh",
                "vehicle.target_soc_pct",
                "vehicle.required_energy_kwh",
                "vehicle.energy_needed_kwh",
                "vehicle.ready_by",
                "vehicle.charging_state",
                "vehicle.charge_power_kw",
                "vehicle.selected_charger",
                "vehicle.effective_charger",
            )
        return (
            "asset.availability_state",
            "charger.connection_state",
            "charger.operating_state",
            "charger.power_kw",
            "charger.energy_total_kwh",
            "charger.requested_charge_power_kw",
            "charger.available_for_control",
        )

    def snapshot(self) -> dict[str, Any]:
        out = super().snapshot()
        resolved_assets: list[dict[str, Any]] = []
        for asset_id, asset in sorted(self.manager.assets.items()):
            if asset.concept_id not in {"vehicle", "charger"}:
                continue
            resolutions = [] if self._resolver is None else list(self._resolver.resolve_asset(asset_id).values())
            readiness = evaluate_asset_readiness(self.manager, self.controller, asset_id, resolutions).as_dict()
            facts = [self._resolved_fact(asset_id, key) for key in self._energy_fact_ids(asset.concept_id)]
            resolved_assets.append({
                "asset_id": asset_id,
                "asset_type": asset.concept_id,
                "readiness": readiness,
                "resolved_facts": facts,
            })

        relations = [
            resolve_vehicle_charger_relationship(self.manager, asset_id).as_dict()
            for asset_id, asset in sorted(self.manager.assets.items())
            if asset.concept_id == "vehicle"
        ]
        out["resolution_contract"] = "MOBILITY_PROPERTY_RESOLUTION_V1"
        out["resolved_assets"] = resolved_assets
        out["typed_relationships"] = relations
        out["contains_physical_bindings"] = False
        out["physical_write_target_exposed_to_consumer"] = False
        return out
