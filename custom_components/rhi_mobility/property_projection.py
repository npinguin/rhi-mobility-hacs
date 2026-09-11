from __future__ import annotations

from typing import Any

from .const import DOMAIN
from .editable_projection import bounds as editable_bounds
from .editable_projection import is_available as editable_is_available
from .editable_projection import options as editable_options
from .property_resolution import PropertyResolutionStatus
from .property_resolver import PropertyResolver


class MobilityPropertyProjection:
    """Project canonical PropertyResolution into HA/public representations only."""
    def __init__(self,hass,manager,controller,public_provider) -> None:
        self.hass=hass; self.manager=manager; self.controller=controller; self.public=public_provider; self.registry=manager.registry
        self.resolver=PropertyResolver(manager,public_provider)

    def definition(self,asset_type: str,property_key: str) -> dict[str,Any] | None:
        definition=(self.registry.semantic_catalog.get("properties") or {}).get(property_key)
        if not isinstance(definition,dict): return None
        applicable=set(definition.get("applicable_asset_types") or [])
        if applicable and asset_type not in applicable: return None
        out=dict(definition); placement=(definition.get("placements") or {}).get(asset_type)
        if isinstance(placement,dict): out.update(placement)
        out["property_key"]=property_key
        return out

    def definitions_for_type(self,asset_type: str) -> list[dict[str,Any]]:
        rows=[]
        for key in (self.registry.semantic_catalog.get("properties") or {}):
            row=self.definition(asset_type,key)
            if row is not None: rows.append(row)
        return sorted(rows,key=lambda r:(r.get("component_id") or "",r.get("section_id") or "",r.get("display_order",9999),r["property_key"]))

    def value(self,asset_id: str,property_key: str) -> Any:
        return self.resolver.resolve(asset_id,property_key).value

    def provenance(self,asset_id: str,property_key: str) -> dict[str,Any]:
        return dict(self.resolver.resolve(asset_id,property_key).source_reference)

    def quality(self,asset_id: str,property_key: str) -> str | None:
        return self.resolver.resolve(asset_id,property_key).quality.value

    def availability_reason(self,asset_id: str,property_key: str,value: Any=None,provenance: dict[str,Any]|None=None) -> str:
        resolution=self.resolver.resolve(asset_id,property_key)
        if resolution.status==PropertyResolutionStatus.RESOLUTION_ERROR:
            return resolution.error_kind.value if resolution.error_kind is not None else resolution.status.value
        return resolution.status.value

    def write_property_key(self,asset_id: str,property_key: str) -> str:
        asset=self.manager.assets.get(asset_id)
        if asset is None: return property_key
        definition=self.definition(asset.concept_id,property_key)
        if definition and isinstance(definition.get("editable"),dict): return property_key
        resolution=None if definition is None else definition.get("editable_resolution")
        return str(resolution) if resolution else property_key

    def editable_definition(self,asset_id: str,property_key: str) -> dict[str,Any] | None:
        asset=self.manager.assets.get(asset_id)
        if asset is None: return None
        key=self.write_property_key(asset_id,property_key)
        definition=self.definition(asset.concept_id,key)
        if definition is None: return None
        editable=definition.get("editable")
        if not isinstance(editable,dict) or asset.concept_id not in set(editable.get("asset_types") or []): return None
        out=dict(editable); out["_write_property_key"]=key
        return out

    def editable(self,asset_id: str,property_key: str) -> bool:
        editable=self.editable_definition(asset_id,property_key)
        if not editable: return False
        key=str(editable["_write_property_key"])
        return editable_is_available(self.manager,self.controller,asset_id,key,editable)

    def editor_entity_id(self,asset_id: str,property_key: str) -> str:
        editable=self.editable_definition(asset_id,property_key)
        if not editable: return ""
        platform=str(editable.get("platform") or ""); key=str(editable["_write_property_key"])
        if not platform: return ""
        unique_id=f"{DOMAIN}:{asset_id}:{platform}:{key}"
        try:
            from homeassistant.helpers import entity_registry as er
            return er.async_get(self.hass).async_get_entity_id(platform,DOMAIN,unique_id) or ""
        except (ImportError,AttributeError):
            return ""

    def write_metadata(self,asset_id: str,property_key: str) -> dict[str,Any]:
        base={"editable":False,"write_supported":False,"write_binding_type":"","write_service_domain":"","write_service_action":"","write_target_entity":""}
        editable=self.editable_definition(asset_id,property_key)
        if not editable: return base
        key=str(editable["_write_property_key"]); platform=str(editable.get("platform") or ""); available=self.editable(asset_id,property_key)
        action={"number":"set_value","text":"set_value","select":"select_option","switch":"turn_on_off_by_value"}.get(platform,"")
        out={**base,"editable":available,"write_supported":available,"write_binding_type":platform,"write_service_domain":platform,"write_service_action":action,"write_target_entity":self.editor_entity_id(asset_id,property_key),"write_property_key":key}
        if platform=="number":
            minimum,maximum,step=editable_bounds(self.manager,self.controller,asset_id,key,editable); out.update({"min":minimum,"max":maximum,"step":step})
        if platform=="select": out["options"]=editable_options(self.manager,self.registry,asset_id,key,editable)
        if available and not out["write_target_entity"]:
            out["write_supported"]=False; out["write_blocked_reason"]="editor_entity_not_registered"
        return out

    def row(self,asset_id: str,property_key: str) -> dict[str,Any] | None:
        asset=self.manager.assets.get(asset_id)
        if asset is None: return None
        definition=self.definition(asset.concept_id,property_key)
        if definition is None: return None
        resolution=self.resolver.resolve(asset_id,property_key)
        value=resolution.value; provenance=dict(resolution.source_reference); write=self.write_metadata(asset_id,property_key); available=resolution.available
        reason=resolution.error_kind.value if resolution.status==PropertyResolutionStatus.RESOLUTION_ERROR and resolution.error_kind is not None else resolution.status.value
        return {"asset_id":asset_id,"asset_type":asset.concept_id,"property_key":property_key,"value":value,"display_value":value,
            "friendly_name":definition.get("friendly_name") or property_key,"display_name":definition.get("friendly_name") or property_key,"unit":definition.get("unit") or "",
            "component_id":definition.get("component_id"),"section_id":definition.get("section_id"),"ux_visibility":definition.get("ux_visibility",definition.get("visibility")),"render_as":definition.get("render_as"),"display_order":definition.get("display_order",9999),"empty_state_behavior":definition.get("empty_state_behavior"),
            "available":available,"availability_reason":reason,"quality":resolution.quality.value,
            "source_provenance":provenance,"source_entity_id":provenance.get("source_entity_id",""),"source_integration":provenance.get("source_integration",""),"source_device_id":provenance.get("source_device_id",""),"raw_capability_id":provenance.get("raw_capability_id",""),"candidate_id":provenance.get("candidate_id",""),"source_input_id":provenance.get("source_input_id",""),
            "producer_kind":None if resolution.producer_kind is None else resolution.producer_kind.value,
            "resolution_status":resolution.status.value,"resolution_error":None if resolution.error_kind is None else resolution.error_kind.value,
            "canonical_contract":"MOBILITY_PUBLIC_RUNTIME_V2","access":"editable" if write.get("editable") else "read_only","editor":write.get("write_binding_type","") if write.get("editable") else "",**write}
