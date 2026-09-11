from __future__ import annotations

from typing import Any

from .const import DOMAIN
from .editable_projection import bounds as editable_bounds
from .editable_projection import is_available as editable_is_available
from .editable_projection import options as editable_options


class MobilityPropertyProjection:
    """Join canonical V2 semantics to HA/public representations only."""
    def __init__(self,hass,manager,controller,public_provider) -> None:
        self.hass=hass; self.manager=manager; self.controller=controller; self.public=public_provider; self.registry=manager.registry

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

    def value(self,asset_id: str,property_key: str) -> Any: return self.public.property_value(asset_id,property_key)
    def provenance(self,asset_id: str,property_key: str) -> dict[str,Any]:
        fn=getattr(self.public,"property_provenance",None); return fn(asset_id,property_key) if callable(fn) else {}
    def quality(self,asset_id: str,property_key: str) -> str | None:
        fn=getattr(self.public,"property_quality",None); return fn(asset_id,property_key) if callable(fn) else None

    def availability_reason(self,asset_id: str,property_key: str,value: Any,provenance: dict[str,Any]) -> str:
        if value is not None: return "AVAILABLE"
        asset=self.manager.assets.get(asset_id)
        if asset is None: return "BINDING_ERROR"
        definition=self.definition(asset.concept_id,property_key)
        if definition is None: return "NOT_APPLICABLE"

        status=str(provenance.get("normalization_status") or "").upper()
        quality=str(self.quality(asset_id,property_key) or provenance.get("quality") or "").upper()
        evidence=" ".join((status,quality,str(provenance.get("reason") or "").upper()))
        if "AMBIGUOUS" in evidence: return "AMBIGUOUS_SOURCE"
        if "INVALID" in evidence or "NORMALIZATION" in evidence: return "NORMALIZATION_ERROR"
        if "BINDING" in evidence or "BLOCKED_BY_TARGET_SCOPE" in evidence: return "BINDING_ERROR"
        if "STALE" in evidence or "UNAVAILABLE" in evidence: return "UNAVAILABLE_TEMPORARY"
        if "UNSUPPORTED" in evidence: return "UNSUPPORTED_BY_SOURCE"
        if "CONFIGURATION" in evidence or "REVIEW" in evidence: return "CONFIGURATION_REQUIRED"

        supported=getattr(self.manager,"supported_property_keys",lambda _aid:set())(asset_id)
        if property_key in supported:
            return "NORMALIZATION_ERROR"
        precedence=set(definition.get("truth_precedence") or [])
        if precedence & {"CONFIGURED","PROFILE"} and "SOURCE" not in precedence:
            return "CONFIGURATION_REQUIRED"
        return "UNSUPPORTED_BY_SOURCE"

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
        value=self.value(asset_id,property_key); provenance=self.provenance(asset_id,property_key); write=self.write_metadata(asset_id,property_key); available=value is not None
        return {"asset_id":asset_id,"asset_type":asset.concept_id,"property_key":property_key,"value":value,"display_value":value,
            "friendly_name":definition.get("friendly_name") or property_key,"display_name":definition.get("friendly_name") or property_key,"unit":definition.get("unit") or "",
            "component_id":definition.get("component_id"),"section_id":definition.get("section_id"),"ux_visibility":definition.get("ux_visibility",definition.get("visibility")),"render_as":definition.get("render_as"),"display_order":definition.get("display_order",9999),"empty_state_behavior":definition.get("empty_state_behavior"),
            "available":available,"availability_reason":self.availability_reason(asset_id,property_key,value,provenance),"quality":self.quality(asset_id,property_key) or ("unavailable" if not available else "v2_projection"),
            "source_provenance":provenance,"source_entity_id":provenance.get("source_entity_id",""),"source_integration":provenance.get("source_integration",""),"source_device_id":provenance.get("source_device_id",""),"raw_capability_id":provenance.get("raw_capability_id",""),"candidate_id":provenance.get("candidate_id",""),"source_input_id":provenance.get("source_input_id",""),
            "canonical_contract":"MOBILITY_PUBLIC_RUNTIME_V2","access":"editable" if write.get("editable") else "read_only","editor":write.get("write_binding_type","") if write.get("editable") else "",**write}
