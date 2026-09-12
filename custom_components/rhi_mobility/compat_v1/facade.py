from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class MobilityV1Facade:
    """Frozen MOBILITY_PUBLIC_RUNTIME_V1 shape projected only from V2 authorities.

    This class deliberately has no manager, controller, domain configuration, Home
    Assistant state access or source-binding access. It may adapt names/shapes only.
    """

    CONTRACT_ID = "MOBILITY_PUBLIC_RUNTIME_V1"

    def __init__(
        self,
        *,
        projection: Any,
        public_provider: Any,
        command_provider: Any,
        experience_provider: Any,
        activity_provider: Any,
        energy_provider: Any,
        registry: Any,
        supervisory_provider: Any | None = None,
    ) -> None:
        self.projection = projection
        self.public = public_provider
        self.commands = command_provider
        self.experience = experience_provider
        self.activity = activity_provider
        self.energy = energy_provider
        self.registry = registry
        self.supervision = supervisory_provider

        runtime_root = Path(__file__).parents[1] / "contracts" / "runtime"
        self.contract = json.loads((runtime_root / "legacy_public_runtime_v1.json").read_text(encoding="utf-8"))
        self.projection_contract = json.loads((runtime_root / "v1_facade_projection.json").read_text(encoding="utf-8"))
        self.definitions = tuple(dict(row) for row in self.contract.get("property_definitions", ()))
        self.aliases = dict(self.contract.get("aliases") or {})
        self.command_contracts = tuple(dict(row) for row in self.contract.get("commands", ()))
        self.command_projection = dict(self.projection_contract.get("command_projection") or {})
        self.profiles = tuple(dict(row) for row in getattr(registry, "profiles", ()) or ())
        self.defs_by_type: dict[str, list[dict[str, Any]]] = {"vehicle": [], "charger": [], "person": []}
        for legacy in self.definitions:
            asset_type = str(legacy.get("asset_type") or "")
            if asset_type not in self.defs_by_type:
                continue
            key = str(legacy.get("property_key") or "")
            canonical = str(self.aliases.get(key, key))
            direct = self.projection.definition(asset_type, key)
            definition = direct or self.projection.definition(asset_type, canonical)
            row = dict(legacy)
            if definition:
                for field in (
                    "component_id", "section_id", "ux_visibility", "visibility", "render_as",
                    "display_order", "empty_state_behavior", "friendly_name", "unit",
                ):
                    if definition.get(field) is not None:
                        row[field] = definition[field]
            row["projection_property_key"] = key if direct is not None else canonical
            row["canonical_value_key"] = canonical
            self.defs_by_type[asset_type].append(row)

    @property
    def required_entity_ids(self) -> list[str]:
        return list(self.contract.get("required_entity_ids") or [])

    def _public_snapshot(self) -> dict[str, Any]:
        return dict(self.public.snapshot() or {})

    def _assets(self) -> list[dict[str, Any]]:
        return [dict(row) for row in self._public_snapshot().get("assets", []) if isinstance(row, dict)]

    def _asset(self, asset_id: str) -> dict[str, Any] | None:
        return next((row for row in self._assets() if row.get("asset_id") == asset_id), None)

    def _projection_key(self, asset_type: str, key: str) -> str:
        return key if self.projection.definition(asset_type, key) is not None else str(self.aliases.get(key, key))

    def _value(self, asset_id: str, key: str) -> Any:
        asset = self._asset(asset_id)
        if asset is None:
            return None
        asset_type = str(asset.get("concept_id") or asset.get("asset_type") or "")
        row = self.projection.row(asset_id, self._projection_key(asset_type, key))
        return None if row is None else row.get("value")

    def _write_metadata(self, asset_id: str, key: str) -> dict[str, Any]:
        asset = self._asset(asset_id)
        if asset is None:
            return {"editable": False, "write_supported": False}
        asset_type = str(asset.get("concept_id") or asset.get("asset_type") or "")
        return dict(self.projection.write_metadata(asset_id, self._projection_key(asset_type, key)) or {})

    def property_rows(self, asset_type: str, component: str | None = None) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        assets = [row for row in self._assets() if str(row.get("concept_id") or row.get("asset_type")) == asset_type]
        for asset in assets:
            aid = str(asset["asset_id"])
            for definition in self.defs_by_type.get(asset_type, []):
                if component and definition.get("component_id") != component:
                    continue
                legacy_key = str(definition["property_key"])
                projection_key = str(definition.get("projection_property_key") or self._projection_key(asset_type, legacy_key))
                projected = self.projection.row(aid, projection_key) or {
                    "asset_id": aid,
                    "asset_type": asset_type,
                    "property_key": projection_key,
                    "value": None,
                    "display_value": None,
                    "available": False,
                    "availability_reason": "INVALID_BINDING",
                    "quality": "INVALID",
                    "canonical_contract": "MOBILITY_PUBLIC_RUNTIME_V2",
                }
                row = dict(projected)
                value = row.get("value")
                write = self._write_metadata(aid, legacy_key)
                editable = bool(write.get("write_supported") or write.get("editable"))
                row.update({
                    "property_key": legacy_key,
                    "value": value,
                    "display_value": value,
                    "friendly_name": definition.get("friendly_name") or row.get("friendly_name") or legacy_key,
                    "display_name": definition.get("friendly_name") or row.get("display_name") or legacy_key,
                    "unit": definition.get("unit") or row.get("unit") or "",
                    "component_id": definition.get("component_id"),
                    "section_id": definition.get("section_id"),
                    "ux_visibility": definition.get("ux_visibility", definition.get("visibility", row.get("ux_visibility"))),
                    "render_as": definition.get("render_as", row.get("render_as")),
                    "display_order": definition.get("display_order", row.get("display_order", 9999)),
                    "empty_state_behavior": definition.get("empty_state_behavior", row.get("empty_state_behavior")),
                    "group": definition.get("group") or definition.get("section_id") or "details",
                    "family": definition.get("family") or definition.get("component_id") or asset_type,
                    "available": bool(row.get("available")),
                    "health": "OK" if row.get("available") else row.get("availability_reason"),
                    "editable": editable,
                    "access": "editable" if editable else "read_only",
                    "editor": write.get("write_binding_type", "") if editable else "",
                    "source_layer": "rhi_mobility_v2_typed_resolution",
                    "canonical_contract": "MOBILITY_PUBLIC_RUNTIME_V2",
                    **write,
                })
                rows.append(row)
        return rows

    @staticmethod
    def by_key(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
        return {f"{row['asset_id']}:{row['property_key']}": row for row in rows}

    def assets(self) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for asset in self._assets():
            aid = str(asset.get("asset_id") or "")
            typ = str(asset.get("concept_id") or asset.get("asset_type") or "")
            if not aid or not typ:
                continue
            out.append({
                "asset_id": aid,
                "asset_type": typ,
                "display_name": self._value(aid, "asset.display_name") or asset.get("display_name") or aid,
                "short_name": self._value(aid, "asset.short_name") or asset.get("display_name") or aid,
                "owner_label": self._value(aid, "asset.owner_label") or "",
                "location_label": self._value(aid, "asset.location_label") or "",
                "profile_id": self._value(aid, "asset.profile_id") or "",
                "image_key": self._value(aid, f"{typ}.image_key") or "",
                "lifecycle_status": self._value(aid, "lifecycle_status") or self._value(aid, "asset.lifecycle_status") or "unknown",
                "available": self._value(aid, "asset.availability_state") == "available",
                "health": asset.get("health"),
                "property_index": f"sensor.mobility_{typ}_property_index",
                "component_contract_index": f"sensor.mobility_{typ}_component_contract_index" if typ in {"vehicle", "charger"} else "",
                "intelligence_index": f"sensor.mobility_{typ}_intelligence_index" if typ in {"vehicle", "charger"} else "",
                "primary_source": dict(asset.get("primary_source") or {}),
            })
        return out

    def relationship_rows(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for relation in self._public_snapshot().get("relationships", []):
            row = dict(relation)
            row.update({
                "vehicle_asset_id": row.get("from_asset_id"),
                "charger_asset_id": row.get("to_asset_id"),
            })
            rows.append(row)
        return rows

    def relationships_by_asset(self) -> dict[str, dict[str, Any]]:
        out: dict[str, dict[str, Any]] = {}
        for relation in self.relationship_rows():
            if relation.get("relationship_type") != "configured_assignment":
                continue
            vid = str(relation.get("from_asset_id") or "")
            cid = str(relation.get("to_asset_id") or "")
            if not vid or not cid:
                continue
            out[vid] = {
                "vehicle_selected_charger": cid,
                "vehicle_effective_charger": cid,
                "vehicle_effective_charger_id": cid,
                "physical_connection_state": "configured_only",
            }
            out[cid] = {
                "charger_effective_assigned_vehicle": vid,
                "charger_effective_assigned_vehicle_id": vid,
                "charger_selected_vehicle": vid,
            }
        return out

    def _command_target(self, asset_id: str, legacy_key: str) -> tuple[str | None, str | None]:
        mapping = self.command_projection.get(legacy_key) or {}
        target_key = str(mapping.get("v2_command_key") or "") or None
        if mapping.get("target_scope") == "effective_charger":
            target_id = self._value(asset_id, "vehicle.effective_charger") or self._value(asset_id, "vehicle.selected_charger")
            return (str(target_id), target_key) if target_id else (None, target_key)
        return asset_id, target_key

    def command_rows(self) -> list[dict[str, Any]]:
        v2_rows = [dict(row) for row in (self.commands.command_snapshot() or {}).get("commands", [])]
        by_target = {(str(row.get("asset_id")), str(row.get("command_key"))): row for row in v2_rows}
        rows: list[dict[str, Any]] = []
        for asset in self.assets():
            aid = str(asset["asset_id"])
            asset_type = str(asset["asset_type"])
            for meta in self.command_contracts:
                if meta.get("asset_type") != asset_type:
                    continue
                legacy_key = str(meta.get("command_key") or "")
                target_id, target_key = self._command_target(aid, legacy_key)
                desc = by_target.get((str(target_id), str(target_key))) if target_id and target_key else None
                supported = bool(desc and desc.get("supported"))
                allowed = bool(desc and desc.get("execution_allowed"))
                reason = str((desc or {}).get("blocked_reason") or ("binding_ready" if allowed else "no_bound_source_command_fact"))
                rows.append({
                    "command_id": f"{aid}:{legacy_key}",
                    "command_key": legacy_key,
                    "consumer_asset_id": aid,
                    "asset_id": aid,
                    "asset_type": asset_type,
                    "source_asset_id": target_id or "",
                    "command_owner_asset_id": aid,
                    "physical_executor_asset_id": target_id or "",
                    "relationship_required": (self.command_projection.get(legacy_key) or {}).get("target_scope") == "effective_charger",
                    "relationship_resolved": bool(target_id),
                    "command_family": meta.get("command_family", "other"),
                    "command_group": meta.get("command_group", "other"),
                    "command_role": meta.get("command_role", "action"),
                    "opposite_command_key": meta.get("opposite", ""),
                    "current_state_property": meta.get("current_state_property", ""),
                    "parameter_schema": {},
                    "binding_exists": supported,
                    "binding_ready": supported,
                    "binding_match_count": 1 if supported else 0,
                    "source_entity_available": supported,
                    "execution_allowed": allowed,
                    "frontend_allowed": supported,
                    "execution_status": "available" if allowed else ("disabled" if supported else "unavailable"),
                    "execution_reason": "binding_ready" if allowed else reason,
                    "action_available": allowed,
                    "action_status": "available" if allowed else ("disabled" if supported else "unavailable"),
                    "action_reason": "binding_ready" if allowed else reason,
                    "primary_action": supported and meta.get("command_role") in {"start", "stop"},
                    "source_entity_id": "",
                    "service_domain": "",
                    "service_action": "",
                    "expected_state": "",
                    "service_data": {},
                    "raw_service_binding_hidden": True,
                    "canonical_command_key": target_key,
                    "canonical_command_contract": (self.commands.command_snapshot() or {}).get("contract_id"),
                })
        return rows

    def resolve_command(self, command_id: str) -> tuple[str, str]:
        matches = [row for row in self.command_rows() if row.get("command_id") == command_id]
        if len(matches) != 1:
            raise ValueError("COMMAND_NOT_FOUND" if not matches else "COMMAND_CONTRACT_AMBIGUOUS")
        row = matches[0]
        if not row.get("binding_exists"):
            raise ValueError("COMMAND_CONTRACT_INCOMPLETE")
        if not row.get("execution_allowed") and row.get("command_role") != "stop":
            raise ValueError(str(row.get("execution_reason") or "COMMAND_BLOCKED"))
        target_id = str(row.get("physical_executor_asset_id") or "")
        target_key = str(row.get("canonical_command_key") or "")
        if not target_id or not target_key:
            raise ValueError("COMMAND_CONTRACT_INCOMPLETE")
        return target_id, target_key

    def command_slots(self, asset_type: str) -> list[dict[str, Any]]:
        commands = self.command_rows()
        out: list[dict[str, Any]] = []
        for asset in self.assets():
            aid = str(asset["asset_id"])
            if asset.get("asset_type") != asset_type:
                continue
            selected = []
            for row in commands:
                if row.get("asset_id") != aid or not row.get("frontend_allowed"):
                    continue
                selected.append({
                    "command_id": row["command_id"], "command_key": row["command_key"],
                    "command_family": row["command_family"], "family": row["command_family"],
                    "group": row["command_group"], "role": row["command_role"],
                    "binding_exists": row["binding_exists"], "binding_ready": row["binding_ready"],
                    "source_available": row["source_entity_available"], "execution_allowed": row["execution_allowed"],
                    "frontend_allowed": True, "execution_status": row["execution_status"],
                    "execution_reason": row["execution_reason"], "control_state": "",
                    "primary_action": row["primary_action"], "parameter_schema": row["parameter_schema"],
                })
            if asset_type == "vehicle":
                sections = {"vehicle_charging.actions": [], "vehicle_access.actions": [], "vehicle_comfort.actions": [], "vehicle_other.actions": []}
                for item in selected:
                    section = {"charging": "vehicle_charging.actions", "access": "vehicle_access.actions", "comfort": "vehicle_comfort.actions"}.get(item["command_family"], "vehicle_other.actions")
                    sections[section].append(item)
                out.append({"asset_id": aid, "asset_type": "vehicle", "quick_actions": selected, "card_sections": sections, "command_layout_source": "MOBILITY_COMMAND_EXECUTION_V1"})
            else:
                quick = [{**item, "surface": "quick_actions"} for item in selected]
                normal = [{**item, "surface": "charger_actions.commands"} for item in selected]
                out.append({
                    "asset_id": aid, "asset_type": "charger", "quick_actions": quick,
                    "card_sections": {"charger_actions.commands": normal},
                    "forbidden_sections": ["charger_control.automation", "charger_control.limits", "charger_metering.power", "charger_metering.energy", "charger_engineering.diagnostics"],
                    "command_layout_source": "MOBILITY_COMMAND_EXECUTION_V1",
                    "lifecycle_control_property": "lifecycle_status", "availability_state_editable": False,
                })
        return out

    def component_contract(self, asset_type: str) -> dict[str, Any]:
        definitions = self.defs_by_type.get(asset_type, [])
        prop_map: dict[str, dict[str, Any]] = {}
        components: dict[str, dict[str, list[str]]] = {}
        for definition in definitions:
            key = str(definition.get("property_key") or "")
            component = definition.get("component_id")
            section = definition.get("section_id")
            if not key or not component or not section:
                continue
            prop_map[key] = {
                "property_key": key, "component_id": component, "section_id": section,
                "ux_visibility": definition.get("ux_visibility"), "render_as": definition.get("render_as"),
                "display_order": definition.get("display_order", 9999), "friendly_name": definition.get("friendly_name"),
            }
            components.setdefault(str(component), {}).setdefault(str(section), []).append(key)
        rows = []
        for component_id in sorted(components):
            sections = []
            for section_id in sorted(components[component_id]):
                keys = sorted(components[component_id][section_id], key=lambda key: prop_map[key].get("display_order") or 9999)
                sections.append({"section_id": section_id, "property_keys": keys})
            rows.append({"component_id": component_id, "sections": sections})
        return {"property_component_map_json": prop_map, "components_json": rows, "components_by_id": {row["component_id"]: row for row in rows}, "component_count": len(rows)}

    def profile_rows(self, profile_type: str) -> list[dict[str, Any]]:
        return [dict(row, health="OK") for row in self.profiles if row.get("profile_type") == profile_type]

    def experience_rows(self, asset_type: str) -> list[dict[str, Any]]:
        snapshot = self.experience.snapshot() or {}
        key = "vehicles" if asset_type == "vehicle" else "chargers" if asset_type == "charger" else None
        return [] if key is None else [dict(row) for row in snapshot.get(key, [])]

    def supervisory(self) -> dict[str, Any]:
        if self.supervision is None:
            return {
                "status": {"available": False, "value": "unknown", "reason": "domain_supervisory_provider_unavailable"},
                "system_trust": {"available": False, "value": "unknown"},
                "attention": {"available": False, "value": "unknown", "reasons": []},
                "charging_plan": {"available": False, "reason": "owned_by_energy"},
                "opportunity": {"available": False, "reason": "not_owned_by_mobility"},
                "recommended_action": {"available": False, "reason": "not_owned_by_mobility"},
                "current_activity": {"available": False, "activity": None},
            }
        snapshot = dict(self.supervision.snapshot() or {})
        readiness = str(snapshot.get("overall_domain_readiness") or "UNKNOWN").lower()
        issues = [dict(row) for row in snapshot.get("issues_summary", [])]
        activities = [dict(row) for row in (self.activity.snapshot() or {}).get("activities", [])]
        return {
            "status": {"available": True, "value": readiness},
            "system_trust": {"available": True, "value": "trusted" if readiness in {"ok", "ready"} else readiness},
            "attention": {"available": True, "value": "attention" if issues else "none", "reasons": [row.get("reason_code") for row in issues]},
            "charging_plan": {"available": False, "reason": "owned_by_energy"},
            "opportunity": {"available": False, "reason": "not_owned_by_mobility"},
            "recommended_action": {"available": False, "reason": "not_owned_by_mobility"},
            "current_activity": {"available": bool(activities), "activity": activities[-1] if activities else None},
        }

    def energy_v1(self) -> dict[str, Any]:
        snapshot = dict(self.energy.snapshot() or {})
        return {
            "consumer_assets": [dict(row, asset_type="vehicle") for row in snapshot.get("consumer_assets", [])],
            "connection_assets": [dict(row, asset_type="connection", connection_type="charger") for row in snapshot.get("connection_assets", [])],
            "charging_relations": [dict(row) for row in snapshot.get("charging_relations", [])],
            "directional_connection_counters": dict(snapshot.get("directional_connection_counters") or {}),
        }

    def capability_index(self) -> dict[str, dict[str, Any]]:
        snapshot = dict(self.energy.snapshot() or {})
        out: dict[str, dict[str, Any]] = {}
        for row in list(snapshot.get("connection_assets", [])) + list(snapshot.get("consumer_assets", [])):
            aid = str(row.get("asset_id") or "")
            if not aid:
                continue
            limits = dict(row.get("limits") or {})
            effective = str(row.get("effective_connection_id") or aid)
            values = {
                "asset_id": aid,
                "effective_charger": effective,
                "effective_phase_count": limits.get("effective_phase_count"),
                "nominal_voltage_v": limits.get("nominal_voltage_v"),
                "consumer_effective_min_current_a": limits.get("writable_min_current_a"),
                "consumer_effective_max_current_a": limits.get("writable_max_current_a"),
                "current_step_a": limits.get("current_step_a"),
                "consumer_effective_min_power_kw": limits.get("capability_min_power_kw", limits.get("min_power_kw")),
                "consumer_effective_max_power_kw": limits.get("capability_max_power_kw", limits.get("max_power_kw")),
                "setpoint_resolution_state": "ready" if limits.get("requested_power_physical_mapping_ready") else "unavailable",
            }
            if any(value is not None for key, value in values.items() if key not in {"asset_id", "effective_charger", "setpoint_resolution_state"}):
                out[aid] = values
        return out

    def compatibility_snapshot(self) -> dict[str, Any]:
        return {
            "contract_id": self.CONTRACT_ID,
            "compatibility_mode": "exact_public_entity_facade",
            "entity_id_drop_in": True,
            "old_ux_modification_required": False,
            "legacy_computation_active": False,
            "canonical_source_contract": "MOBILITY_PUBLIC_RUNTIME_V2",
            "required_entity_ids": self.required_entity_ids,
            "removal_boundary": "custom_components.rhi_mobility.compat_v1",
        }
