from __future__ import annotations
from typing import Any
from .legacy_compat import MobilityLegacyV1FacadeProvider
from .property_projection import MobilityPropertyProjection

class MobilityLegacyV1ProjectedFacadeProvider(MobilityLegacyV1FacadeProvider):
    """Frozen V1 shape projected from V2 truth, never a second product model."""
    def __init__(self,hass,manager,controller,public_provider,experience_provider,activity_provider,energy_provider,domain_config) -> None:
        super().__init__(manager,controller,public_provider,experience_provider,activity_provider,energy_provider,domain_config)
        self.projection=MobilityPropertyProjection(hass,manager,controller,public_provider)
        merged={"vehicle":[],"charger":[],"person":[]}
        for legacy in self.definitions:
            asset_type=legacy.get("asset_type")
            if asset_type not in merged: continue
            legacy_key=str(legacy.get("property_key") or ""); alias=self.aliases.get(legacy_key,legacy_key)
            direct=self.projection.definition(asset_type,legacy_key)
            definition=direct or self.projection.definition(asset_type,alias)
            row=dict(legacy)
            if definition is not None:
                for field in ("component_id","section_id","ux_visibility","visibility","render_as","display_order","empty_state_behavior","friendly_name","unit"):
                    if definition.get(field) is not None: row[field]=definition.get(field)
            row["projection_property_key"]=legacy_key if direct is not None else alias
            row["canonical_value_key"]=alias
            merged[asset_type].append(row)
        self.defs_by_type=merged

    def _projection_key(self,asset_id: str,key: str) -> str:
        asset=self._asset(asset_id)
        if asset is not None and self.projection.definition(asset.concept_id,key) is not None: return key
        return self.aliases.get(key,key)

    def _write_metadata(self,asset_id: str,key: str) -> dict[str,Any]:
        return self.projection.write_metadata(asset_id,self._projection_key(asset_id,key))

    def property_rows(self,asset_type: str,component: str | None=None) -> list[dict[str,Any]]:
        rows=[]
        for aid,asset in sorted(self.manager.assets.items()):
            if asset.concept_id!=asset_type: continue
            snap=self._snap(aid)
            for definition in self.defs_by_type.get(asset_type,[]):
                if component and definition.get("component_id")!=component: continue
                key=definition["property_key"]; projection_key=definition.get("projection_property_key") or self._projection_key(aid,key)
                projected=self.projection.row(aid,projection_key)
                if projected is None:
                    projected={"asset_id":aid,"asset_type":asset_type,"property_key":projection_key,"value":None,"display_value":None,"available":False,"availability_reason":"BINDING_ERROR","quality":"unavailable","canonical_contract":"MOBILITY_PUBLIC_RUNTIME_V2"}
                row=dict(projected); value=self._value(aid,key); write=self._write_metadata(aid,key)
                reason=row.get("availability_reason")
                if value is None and reason=="AVAILABLE":
                    reason=self.projection.availability_reason(aid,projection_key,None,self.projection.provenance(aid,projection_key))
                row.update({"property_key":key,"value":value,"display_value":value,
                    "friendly_name":definition.get("friendly_name") or row.get("friendly_name") or key,"display_name":definition.get("friendly_name") or row.get("display_name") or key,
                    "unit":definition.get("unit") or row.get("unit") or "","component_id":definition.get("component_id"),"section_id":definition.get("section_id"),
                    "ux_visibility":definition.get("ux_visibility",definition.get("visibility",row.get("ux_visibility"))),"render_as":definition.get("render_as",row.get("render_as")),
                    "display_order":definition.get("display_order",row.get("display_order",9999)),"empty_state_behavior":definition.get("empty_state_behavior",row.get("empty_state_behavior")),
                    "group":definition.get("group") or definition.get("section_id") or "details","family":definition.get("family") or definition.get("component_id") or asset_type,
                    "available":value is not None,"availability_reason":reason,"health":"OK" if value is not None else (None if snap is None else snap.health),"source_layer":"rhi_mobility_v2",**write})
                rows.append(row)
        return rows
