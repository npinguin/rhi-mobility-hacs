from __future__ import annotations
import json
from pathlib import Path
from typing import Any

from .const import RELEASE

INVALID = {None, "", "unknown", "unavailable"}

_V1_TO_V2_COMMAND = {
    "vehicle.command.lock": "vehicle.command.lock",
    "vehicle.command.unlock": "vehicle.command.unlock",
    "vehicle.command.start_climate": "vehicle.command.climate_start",
    "vehicle.command.stop_climate": "vehicle.command.climate_stop",
    "charger.command.start_charging": "charger.command.start",
    "charger.command.stop_charging": "charger.command.stop",
    "charger.command.unlock_connector": "charger.command.unlock_connector",
    "charger.command.restart": "charger.command.restart",
    "charger.command.identify": "charger.command.identify",
}

class MobilityLegacyV1FacadeProvider:
    """Exact public V1 facade backed only by V2 runtime/config/execution authority."""
    CONTRACT_ID = "MOBILITY_PUBLIC_RUNTIME_V1"

    def __init__(self, manager, controller, public_provider, experience_provider, activity_provider, energy_provider, domain_config) -> None:
        self.manager = manager
        self.controller = controller
        self.public = public_provider
        self.experience = experience_provider
        self.activity = activity_provider
        self.energy = energy_provider
        self.domain_config = domain_config
        path = Path(__file__).parent / "contracts" / "runtime" / "legacy_public_runtime_v1.json"
        self.contract = json.loads(path.read_text(encoding="utf-8"))
        self.definitions = self.contract["property_definitions"]
        self.aliases = self.contract["aliases"]
        # Canonical V2 profile catalog is the only runtime profile authority.
        profile_path = Path(__file__).parent / "contracts" / "runtime" / "profile_catalog.json"
        self.profiles = tuple(dict(row) for row in json.loads(profile_path.read_text(encoding="utf-8")).get("profiles", []))
        self.command_contracts = self.contract["commands"]
        self.defs_by_type: dict[str, list[dict[str, Any]]] = {"vehicle": [], "charger": [], "person": []}
        for row in self.definitions:
            if row.get("asset_type") in self.defs_by_type:
                self.defs_by_type[row["asset_type"]].append(row)

    @property
    def required_entity_ids(self) -> list[str]:
        return list(self.contract["required_entity_ids"])

    def _asset(self, asset_id: str):
        return self.manager.assets.get(asset_id)

    def _snap(self, asset_id: str):
        return self.manager.snapshots.get(asset_id)

    def _effective_charger(self, vehicle_id: str) -> str | None:
        return self.manager.effective_charger_for_vehicle(vehicle_id)

    def _value(self, asset_id: str, key: str) -> Any:
        asset = self._asset(asset_id)
        snap = self._snap(asset_id)
        if asset is None:
            return None
        # The compatibility facade delegates first to the canonical V2 property resolver.
        # This keeps V1 as a pure exterior alias and prevents a second computation authority.
        value_fn = getattr(self.public, "property_value", None)
        if callable(value_fn):
            projected = value_fn(asset_id, key)
            if projected is not None:
                return projected
        # Domain configuration/editable product semantics.
        configured = self.domain_config.get(asset_id, key, None)
        if configured is not None:
            return configured
        if key == "asset.display_name": return asset.display_name
        if key == "asset.short_name": return self.domain_config.get(asset_id, key, asset.display_name)
        if key == "lifecycle_status": return self.domain_config.get(asset_id, 'asset.lifecycle_status', (snap.values.get("asset.lifecycle_status") if snap else "active"))
        if key == "vehicle.present" and asset.concept_id == "vehicle": return self.domain_config.get(asset_id, key, None)
        if key == "vehicle.selected_charger": return self._effective_charger(asset_id)
        if key == "vehicle.effective_charger": return self._effective_charger(asset_id)
        if key == "charger.effective_assigned_vehicle_id": return self.manager.configured_vehicle_for_charger(asset_id)
        if key == "charger.assigned_vehicle_id": return self.manager.configured_vehicle_for_charger(asset_id)
        if key == "asset.selected_candidate_id":
            ids = sorted({src.candidate_id for b in asset.source_bindings.values() for src in b.inputs.values()})
            return ids[0] if len(ids) == 1 else None
        if key == "vehicle.requested_charge_power_kw":
            cid = self._effective_charger(asset_id)
            return self.controller.requested_power_readback(cid) if cid else None
        if key == "charger.requested_charge_power_kw": return self.controller.requested_power_readback(asset_id)
        if key == "limits.requested_current_limit_a": return self.controller.requested_current_readback(asset_id)
        if key == "charger.available_for_control":
            return any(r.asset_id == asset_id and r.execution_allowed for r in self.controller.command_descriptors().values())
        if key == "charger.available_for_connection":
            state = None if snap is None else snap.values.get("charger.connection_state")
            return state not in {None, "unknown", "fault"}
        if key == "charger.snapshot_revision": return None if snap is None else snap.build_input_revision
        if key == "charger.observed_at": return None
        # Derived compatibility properties are materialised by the canonical V2 runtime.
        # The V1 facade must never recompute them as a second authority.
        if key == 'vehicle.charge_mode':
            physical=self.controller.vehicle_charge_mode_readback(asset_id)
            if physical is not None: return physical
        # Profile-backed values are materialised by MobilityRuntimeManager from the canonical V2 profile catalog.
        canonical = self.aliases.get(key, key)
        if canonical == "charger.requested_power_kw" and asset.concept_id == "vehicle":
            cid = self._effective_charger(asset_id); return self.controller.requested_power_readback(cid) if cid else None
        if canonical == "charger.requested_power_kw": return self.controller.requested_power_readback(asset_id)
        if snap is not None:
            if canonical in snap.values: return snap.values.get(canonical)
            if key in snap.values: return snap.values.get(key)
        return None

    def _write_metadata(self, asset_id: str, key: str) -> dict[str, Any]:
        base = {"editable": False, "write_supported": False, "write_binding_type": "", "write_service_domain": "", "write_service_action": "", "write_target_entity": ""}
        if key in {"asset.display_name", "asset.short_name", "asset.owner_label", "asset.location_label", "vehicle.ready_by", "vehicle.charge_mode"}:
            
            if key=='vehicle.charge_mode' and self.controller.vehicle_charge_mode_source(asset_id) is None: return base
            return {**base,"editable":True,"write_supported":True,"write_binding_type":"text","write_service_domain":"text","write_service_action":"set_value","write_target_entity":f"text.rhi_mobility_{asset_id}_{key.split('.')[-1]}"}
        if key in {"asset.profile_id", "lifecycle_status", "vehicle.selected_charger", "vehicle.mobility_charge_policy"}:
            suffix={"asset.profile_id":"profile","lifecycle_status":"lifecycle_status","vehicle.selected_charger":"selected_charger","vehicle.mobility_charge_policy":"charge_policy"}[key]
            return {**base,"editable":True,"write_supported":True,"write_binding_type":"select","write_service_domain":"select","write_service_action":"select_option","write_target_entity":f"select.rhi_mobility_{asset_id}_{suffix}"}
        if key == "vehicle.present":
            return {**base,"editable":True,"write_supported":True,"write_binding_type":"switch","write_service_domain":"switch","write_service_action":"turn_on_off_by_value","write_target_entity":f"switch.rhi_mobility_{asset_id}_present"}
        if key == "vehicle.target_soc_pct":
            return {**base,"editable":True,"write_supported":True,"write_binding_type":"number","write_service_domain":"number","write_service_action":"set_value","write_target_entity":f"number.rhi_mobility_{asset_id}_target_soc","min":0.0,"max":100.0,"step":1.0}
        if key == "vehicle.battery_capacity_kwh":
            return {**base,"editable":True,"write_supported":True,"write_binding_type":"number","write_service_domain":"number","write_service_action":"set_value","write_target_entity":f"number.rhi_mobility_{asset_id}_battery_capacity","min":1.0,"max":200.0,"step":0.1}
        if key == 'vehicle.soc_pct' and self._asset(asset_id) and 'manual_profile' in self._asset(asset_id).source_bindings:
            return {**base,'editable':True,'write_supported':True,'write_binding_type':'number','write_service_domain':'number','write_service_action':'set_value','write_target_entity':f'number.rhi_mobility_{asset_id}_soc','min':0.0,'max':100.0,'step':1.0}
        if key == 'vehicle.battery_energy_kwh' and self._asset(asset_id) and 'manual_profile' in self._asset(asset_id).source_bindings:
            cap=self._value(asset_id,'vehicle.battery_capacity_kwh')
            if cap is None:
                return {**base,'editable':False,'write_supported':False,'write_binding_type':'number','write_service_domain':'number','write_service_action':'set_value','write_target_entity':f'number.rhi_mobility_{asset_id}_battery_energy','min':0.0,'max':None,'step':0.1,'write_blocked_reason':'battery_capacity_unknown'}
            return {**base,'editable':True,'write_supported':True,'write_binding_type':'number','write_service_domain':'number','write_service_action':'set_value','write_target_entity':f'number.rhi_mobility_{asset_id}_battery_energy','min':0.0,'max':float(cap),'step':0.1}
        if key in {"charger.requested_charge_power_kw", "vehicle.requested_charge_power_kw"}:
            charger_id = asset_id if key.startswith("charger.") else self._effective_charger(asset_id)
            desc = self.controller.requested_power_descriptor(charger_id) if charger_id else None
            if desc is None: return base
            status = self.controller.requested_power_status(charger_id)
            return {**base,"editable":True,"write_supported":True,"write_binding_type":"number","write_service_domain":"number","write_service_action":"set_value","write_target_entity":f"number.rhi_mobility_{charger_id}_requested_power","min":round(desc.min_power_kw,3),"max":round(desc.max_power_kw,3),"step":round(desc.step_power_kw,3),"actual_readback_value_kw":status["actual_readback_power_kw"],"requested_intent_value_kw":status["pending_intent_power_kw"] if status["pending_intent_power_kw"] is not None else status["unresolved_intent_power_kw"],"write_state":"WRITE_PENDING" if status["pending_intent_power_kw"] is not None else ("UNRESOLVED" if status["unresolved_intent_power_kw"] is not None else "ALIGNED"),"write_pending":status["pending_intent_power_kw"] is not None,"write_closed":status["pending_intent_power_kw"] is None and status["unresolved_intent_power_kw"] is None,"write_blocked_reason":""}
        if key in {"limits.requested_current_limit_a", "charger.current_limit_a"}:
            desc = self.controller.requested_power_descriptor(asset_id)
            if desc is None or desc.mode != "current_limit": return base
            actual = self.controller.requested_current_readback(asset_id)
            return {**base,"editable":True,"write_supported":True,"write_binding_type":"number","write_service_domain":"number","write_service_action":"set_value","write_target_entity":f"number.rhi_mobility_{asset_id}_requested_current_limit","min":desc.min_current_a,"max":desc.max_current_a,"step":desc.current_step_a,"actual_readback_value_a":actual,"value_authority":"physical_current_limit_readback"}
        return base

    def property_rows(self, asset_type: str, component: str | None = None) -> list[dict[str, Any]]:
        rows=[]
        assets=[(aid,a) for aid,a in sorted(self.manager.assets.items()) if a.concept_id==asset_type]
        for aid,asset in assets:
            for definition in self.defs_by_type.get(asset_type, []):
                if component and definition.get("component_id") != component: continue
                key=definition["property_key"]; value=self._value(aid,key); write=self._write_metadata(aid,key)
                snap=self._snap(aid)
                available=value is not None
                editable=bool(write.get("write_supported"))
                quality=(self.public.property_quality(aid,key) if hasattr(self.public,"property_quality") else None) or (None if snap is None else snap.quality.get(self.aliases.get(key,key))) or ("v2_projection" if available else "unavailable")
                provenance=self.public.property_provenance(aid,key) if hasattr(self.public,"property_provenance") else {}
                row={
                    "asset_id":aid,"asset_type":asset_type,"property_key":key,"value":value,"display_value":value,
                    "friendly_name":definition.get("friendly_name") or key,"display_name":definition.get("friendly_name") or key,"unit":definition.get("unit") or "",
                    "editable":editable,"access":"editable" if editable else "read_only","editor":write.get("write_binding_type","") if editable else "",
                    "group":definition.get("group") or definition.get("section_id") or "details","family":definition.get("family") or definition.get("component_id") or asset_type,
                    "component_id":definition.get("component_id"),"section_id":definition.get("section_id"),
                    "ux_visibility":definition.get("ux_visibility"),"render_as":definition.get("render_as"),
                    "display_order":definition.get("display_order",9999),"empty_state_behavior":definition.get("empty_state_behavior"),
                    "available":available,"quality":quality,"health":"OK" if available else (None if snap is None else snap.health),
                    "source_layer":"rhi_mobility_v2","source_entity_id":provenance.get("source_entity_id", ""),
                    "source_integration":provenance.get("source_integration", ""),"source_device_id":provenance.get("source_device_id", ""),
                    "raw_capability_id":provenance.get("raw_capability_id", ""),"candidate_id":provenance.get("candidate_id", ""),
                    "source_input_id":provenance.get("source_input_id", ""),"source_provenance":provenance,
                    "canonical_contract":"MOBILITY_PUBLIC_RUNTIME_V2",
                    **write,
                }
                if key in {"charger.requested_charge_power_kw","vehicle.requested_charge_power_kw"} and editable:
                    row.update({
                        "requested_power_kw":write.get("requested_intent_value_kw"),
                        "effective_requested_power_kw":write.get("actual_readback_value_kw"),
                        "write_blocked":bool(write.get("write_blocked_reason")),
                        "write_reason":write.get("write_blocked_reason") or "aligned",
                        "setpoint_state":write.get("write_state"),
                        "setpoint_reason":write.get("write_blocked_reason") or "aligned",
                        "ux_value_source":"actual_readback_value_kw",
                        "ux_edit_source":"requested_intent_value_kw",
                        "write_success_proof":"physical_readback",
                    })
                rows.append(row)
        return rows

    @staticmethod
    def by_key(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
        return {f"{r['asset_id']}:{r['property_key']}":r for r in rows}

    def assets(self) -> list[dict[str, Any]]:
        out=[]
        for aid,a in sorted(self.manager.assets.items()):
            snap=self._snap(aid)
            typ=a.concept_id
            out.append({
                "asset_id":aid,"asset_type":typ,
                "display_name":self._value(aid,"asset.display_name") or a.display_name,
                "short_name":self._value(aid,"asset.short_name") or a.display_name,
                "owner_label":self._value(aid,"asset.owner_label") or "",
                "location_label":self._value(aid,"asset.location_label") or "",
                "profile_id":self._value(aid,"asset.profile_id") or "",
                "image_key":self._value(aid,f"{typ}.image_key") or "",
                "lifecycle_status":self._value(aid,"lifecycle_status") or "active",
                "available":bool(snap and snap.values.get("asset.availability_state")=="available"),
                "health":None if snap is None else snap.health,
                "property_index":f"sensor.mobility_{typ}_property_index",
                "component_contract_index":f"sensor.mobility_{typ}_component_contract_index" if typ in {"vehicle","charger"} else "",
                "intelligence_index":f"sensor.mobility_{typ}_intelligence_index" if typ in {"vehicle","charger"} else "",
                "primary_source":(self.manager.primary_source_metadata(aid) if callable(getattr(self.manager,"primary_source_metadata",None)) else {}),
            })
        return out

    def relationship_rows(self) -> list[dict[str, Any]]:
        rows=[]
        for r in self.manager.effective_relationships.values():
            rows.append({"relationship_id":r.relationship_id,"relationship_type":r.relationship_type,"from_asset_id":r.from_asset_id,"to_asset_id":r.to_asset_id,"vehicle_asset_id":r.from_asset_id,"charger_asset_id":r.to_asset_id,"health":r.health,"evidence_source":r.evidence_source})
        return rows

    def relationships_by_asset(self) -> dict[str, dict[str, Any]]:
        out={}
        for r in self.relationship_rows():
            if r["relationship_type"] != "configured_assignment": continue
            vid=r["from_asset_id"]; cid=r["to_asset_id"]
            out[vid]={"vehicle_selected_charger":cid,"vehicle_effective_charger":cid,"vehicle_effective_charger_id":cid,"physical_connection_state":"configured_only"}
            out[cid]={"charger_effective_assigned_vehicle":vid,"charger_effective_assigned_vehicle_id":vid,"charger_selected_vehicle":vid}
        return out

    def _legacy_command_target(self, asset_id: str, command_key: str) -> tuple[str | None,str | None]:
        if command_key in {"vehicle.command.start_charging","vehicle.command.stop_charging"}:
            cid=self._effective_charger(asset_id)
            return (cid, "charger.command.start" if command_key.endswith("start_charging") else "charger.command.stop") if cid else (None,None)
        return asset_id, _V1_TO_V2_COMMAND.get(command_key)

    def command_rows(self) -> list[dict[str, Any]]:
        v2=self.controller.command_descriptors(); rows=[]
        for aid,asset in sorted(self.manager.assets.items()):
            for meta in self.command_contracts:
                if meta["asset_type"] != asset.concept_id: continue
                target_id,target_key=self._legacy_command_target(aid,meta["command_key"])
                desc=v2.get(f"{target_id}:{target_key}") if target_id and target_key else None
                binding=desc is not None
                allowed=bool(desc and desc.execution_allowed)
                row={
                    "command_id":f"{aid}:{meta['command_key']}","command_key":meta["command_key"],"consumer_asset_id":aid,"asset_id":aid,"asset_type":asset.concept_id,
                    "source_asset_id":target_id or "","command_owner_asset_id":aid,"physical_executor_asset_id":target_id or "",
                    "relationship_required":meta["command_key"] in {"vehicle.command.start_charging","vehicle.command.stop_charging"},"relationship_resolved":bool(target_id),
                    "command_family":meta["command_family"],"command_group":meta["command_group"],"command_role":meta["command_role"],
                    "opposite_command_key":meta.get("opposite", ""),"current_state_property":meta.get("current_state_property", ""),"parameter_schema":{},
                    "binding_exists":binding,"binding_ready":binding,"binding_match_count":1 if binding else 0,"source_entity_available":binding,
                    "execution_allowed":allowed,"frontend_allowed":binding,"execution_status":"available" if allowed else ("disabled" if binding else "unavailable"),
                    "execution_reason":"binding_ready" if allowed else (desc.blocked_reason if desc else "no_bound_source_command_fact"),
                    "action_available":allowed,"action_status":"available" if allowed else ("disabled" if binding else "unavailable"),
                    "action_reason":"binding_ready" if allowed else (desc.blocked_reason if desc else "no_bound_source_command_fact"),
                    "primary_action":allowed and meta["command_role"] in {"start","stop"},
                    "source_entity_id":"","service_domain":"","service_action":"","expected_state":"","service_data":{},
                    "raw_service_binding_hidden":True,
                }
                rows.append(row)
        return rows

    def resolve_command(self, command_id: str) -> tuple[str,str]:
        exact=[r for r in self.command_rows() if r["command_id"]==command_id]
        if len(exact)!=1:
            raise ValueError("COMMAND_NOT_FOUND" if not exact else "COMMAND_CONTRACT_AMBIGUOUS")
        row=exact[0]
        if not row["binding_exists"]: raise ValueError("COMMAND_CONTRACT_INCOMPLETE")
        if not row["execution_allowed"] and row["command_role"] != "stop": raise ValueError(row["execution_reason"])
        target_id,target_key=self._legacy_command_target(row["asset_id"],row["command_key"])
        if not target_id or not target_key: raise ValueError("COMMAND_CONTRACT_INCOMPLETE")
        return target_id,target_key

    def command_slots(self, asset_type: str) -> list[dict[str, Any]]:
        commands=self.command_rows(); out=[]
        for aid,a in sorted(self.manager.assets.items()):
            if a.concept_id!=asset_type: continue
            selected=[]
            for r in commands:
                if r["asset_id"]!=aid or not r["frontend_allowed"]: continue
                item={"command_id":r["command_id"],"command_key":r["command_key"],"command_family":r["command_family"],"family":r["command_family"],"group":r["command_group"],"role":r["command_role"],"binding_exists":r["binding_exists"],"binding_ready":r["binding_ready"],"source_available":r["source_entity_available"],"execution_allowed":r["execution_allowed"],"frontend_allowed":True,"execution_status":r["execution_status"],"execution_reason":r["execution_reason"],"control_state":"","primary_action":r["primary_action"],"parameter_schema":r["parameter_schema"]}
                selected.append(item)
            if asset_type=="vehicle":
                sections={"vehicle_charging.actions":[],"vehicle_access.actions":[],"vehicle_comfort.actions":[],"vehicle_other.actions":[]}
                for item in selected:
                    sec={"charging":"vehicle_charging.actions","access":"vehicle_access.actions","comfort":"vehicle_comfort.actions"}.get(item["command_family"],"vehicle_other.actions")
                    sections[sec].append(item)
                out.append({"asset_id":aid,"asset_type":"vehicle","quick_actions":selected,"card_sections":sections,"command_layout_source":"canonical_vehicle_command_slot_index"})
            else:
                quick=[{**x,"surface":"quick_actions"} for x in selected]
                normal=[{**x,"surface":"charger_actions.commands"} for x in selected]
                out.append({"asset_id":aid,"asset_type":"charger","quick_actions":quick,"card_sections":{"charger_actions.commands":normal},"forbidden_sections":["charger_control.automation","charger_control.limits","charger_metering.power","charger_metering.energy","charger_engineering.diagnostics"],"command_layout_source":"canonical_charger_command_slot_index","lifecycle_control_property":"lifecycle_status","availability_state_editable":False})
        return out

    def component_contract(self, asset_type: str) -> dict[str, Any]:
        defs=self.defs_by_type[asset_type]
        prop_map={d["property_key"]:{"property_key":d["property_key"],"component_id":d.get("component_id"),"section_id":d.get("section_id"),"ux_visibility":d.get("ux_visibility"),"render_as":d.get("render_as"),"display_order":d.get("display_order",9999),"friendly_name":d.get("friendly_name")} for d in defs if d.get("component_id")}
        comp={}
        for d in defs:
            cid=d.get("component_id"); sid=d.get("section_id")
            if not cid or not sid: continue
            c=comp.setdefault(cid,{"component_id":cid,"sections":{}})
            s=c["sections"].setdefault(sid,{"section_id":sid,"properties":[]})
            s["properties"].append(d["property_key"])
        components=[]
        for cid,c in sorted(comp.items()):
            components.append({"component_id":cid,"sections":[{"section_id":sid,"property_keys":sorted(s["properties"],key=lambda k:prop_map[k].get("display_order") or 9999)} for sid,s in sorted(c["sections"].items())]})
        return {"property_component_map_json":prop_map,"components_json":components,"components_by_id":{x["component_id"]:x for x in components},"component_count":len(components)}

    def profile_rows(self, profile_type: str) -> list[dict[str, Any]]:
        return [dict(x,health="OK") for x in self.profiles if x["profile_type"]==profile_type]

    def experience_rows(self, asset_type: str) -> list[dict[str, Any]]:
        snapshot=self.experience.snapshot()
        if asset_type == "vehicle":
            return [dict(row) for row in snapshot.get("vehicles", [])]
        if asset_type == "charger":
            return [dict(row) for row in snapshot.get("chargers", [])]
        return []

    def supervisory(self) -> dict[str, Any]:
        snaps=list(self.manager.snapshots.values())
        runtime_ready=bool(snaps); degraded=any(s.health!="OK" for s in snaps)
        attention=[]
        for row in self.experience.snapshot()["vehicles"]:
            security = row.get("security_intelligence", row.get("security", {}))
            maintenance = row.get("maintenance_intelligence", row.get("maintenance", {}))
            if security.get("state") == "attention": attention.append(f"{row['asset_id']}:security")
            if maintenance.get("state") == "attention": attention.append(f"{row['asset_id']}:maintenance")
            if row.get("comfort_intelligence", {}).get("state") == "attention": attention.append(f"{row['asset_id']}:comfort")
        latest=self.activity.snapshot()["activities"]
        return {
            "status":{"available":runtime_ready,"value":"degraded" if degraded else ("operational" if runtime_ready else "unknown")},
            "system_trust":{"available":runtime_ready,"value":"degraded" if degraded else ("trusted" if runtime_ready else "unknown")},
            "attention":{"available":runtime_ready,"value":"attention" if attention else ("none" if runtime_ready else "unknown"),"reasons":attention},
            "charging_plan":{"available":False,"reason":"owned_by_energy"},
            "opportunity":{"available":False,"reason":"not_owned_by_mobility"},
            "recommended_action":{"available":False,"reason":"not_owned_by_mobility"},
            "current_activity":{"available":bool(latest),"activity":latest[-1] if latest else None},
        }

    def energy_v1(self) -> dict[str, Any]:
        """Project the producer-owned V2 Energy boundary into the frozen V1 facade.

        This is shape adaptation only: all semantics are produced by
        MobilityEnergyV2Provider. No legacy computation is allowed here.
        """
        v2 = self.energy.snapshot()
        consumers = [dict(row, asset_type="vehicle") for row in v2.get("consumer_assets", [])]
        connections = [dict(row, asset_type="connection", connection_type="charger") for row in v2.get("connection_assets", [])]
        return {
            "consumer_assets": consumers,
            "connection_assets": connections,
            "charging_relations": [dict(row) for row in v2.get("charging_relations", [])],
            "directional_connection_counters": v2.get("directional_connection_counters", {}),
        }

    def capability_index(self) -> dict[str, dict[str, Any]]:
        out={}
        for aid,a in sorted(self.manager.assets.items()):
            cid=aid if a.concept_id=="charger" else self._effective_charger(aid)
            p=self.manager.effective_charging_profile(cid) if cid else None
            if p is None: continue
            out[aid]={"asset_id":aid,"effective_charger":cid,"effective_phase_count":int(p["phase_count"]),"nominal_voltage_v":p["nominal_voltage_v"],"consumer_effective_min_current_a":p["min_current_a"],"consumer_effective_max_current_a":p["max_current_a"],"current_step_a":p["current_step_a"],"consumer_effective_min_power_kw":p["min_power_kw"],"consumer_effective_max_power_kw":p["max_power_kw"],"setpoint_resolution_state":"ready"}
        return out

    def compatibility_snapshot(self) -> dict[str, Any]:
        return {"contract_id":self.CONTRACT_ID,"compatibility_mode":"exact_public_entity_facade","entity_id_drop_in":True,"old_ux_modification_required":False,"legacy_computation_active":False,"canonical_source_contract":"MOBILITY_PUBLIC_RUNTIME_V2","required_entity_ids":self.required_entity_ids}
