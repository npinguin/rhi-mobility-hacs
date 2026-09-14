from __future__ import annotations

from typing import Any

from .cached_facade import MobilityV1Facade as _CachedFacade


class MobilityV1Facade(_CachedFacade):
    """Frozen-UX parity projection over the canonical V2 runtime.

    V2 remains the only computation authority.  This class contains only bounded
    MOBILITY_PUBLIC_RUNTIME_V1 shape/vocabulary adaptation required by the frozen
    R22.12.11.30 UX.  No source discovery, runtime truth, readiness or physical
    relationship inference is allowed here.
    """

    FROZEN_UX_HEALTH_ENTITY_IDS = (
        "sensor.mobility_runtime_deployment_health",
        "sensor.mobility_runtime_proof_health",
        "sensor.mobility_audit_closure_health",
        "sensor.mobility_contract_version_consistency_health",
        "sensor.mobility_home_intelligence_contract_standard_health",
    )

    _VEHICLE_COMPONENT_INDEXES = frozenset(
        {
            "identity",
            "battery",
            "charging",
            "range",
            "access",
            "comfort",
            "location",
            "maintenance",
            "diagnostics",
        }
    )

    _V1_IMAGE_KEYS = frozenset(
        {
            "vehicle_audi_q8",
            "vehicle_audi_q8_hero",
            "vehicle_mercedes_gla",
            "vehicle_vw_id4",
            "vehicle_bmw_ix1_phev",
            "vehicle_bmw_ix1_phev_hero",
            "vehicle_bmw_x1",
            "vehicle_renault_scenic_techno_ev",
            "vehicle_renault_scenic_techno_ev_hero",
            "vehicle_renault_scenic",
            "vehicle_unknown_profile",
            "vehicle_unknown_profile_hero",
            "vehicle_guest",
            "vehicle_guest_generic",
            "vehicle_fallback",
            "charger_wallbox",
            "charger_wallbox_white",
            "charger_wallbox_black",
            "charger_peblar",
            "charger_utility_plug",
            "charger_fallback",
        }
    )

    _V1_IMAGE_KEY_BY_PROFILE_ID = {
        "audi_q8_tfsi_55e_2025_phev": "vehicle_audi_q8",
        "vw_id4_business_pro_77kwh": "vehicle_vw_id4",
        "mercedes_gla_2021_phev": "vehicle_mercedes_gla",
        "bmw_x1_2025_phev": "vehicle_bmw_ix1_phev",
        "renault_scenic_techno_ev": "vehicle_renault_scenic_techno_ev",
        "guest_phev_1phase": "vehicle_guest",
        "guest_ev_3phase": "vehicle_guest",
        "wallbox_ocpp": "charger_wallbox",
        "peblar_22kw": "charger_peblar",
        "utility_plug": "charger_utility_plug",
    }

    _V1_IMAGE_KEY_BY_CANONICAL_KEY = {
        "audi_q8_daytona_grey_23": "vehicle_audi_q8",
        "vw_id4_business_pro_silver_grey": "vehicle_vw_id4",
        "mercedes_gla_phev": "vehicle_mercedes_gla",
        "bmw_x1_phev": "vehicle_bmw_ix1_phev",
        "bmw_ix1_phev": "vehicle_bmw_ix1_phev",
        "renault_scenic_techno_ev": "vehicle_renault_scenic_techno_ev",
        "guest_phev": "vehicle_guest",
        "guest_ev": "vehicle_guest",
        "wallbox_ocpp": "charger_wallbox",
        "peblar_22kw": "charger_peblar",
        "fibaro_utility_plug": "charger_utility_plug",
    }

    @property
    def required_entity_ids(self) -> list[str]:
        # Additive compatibility aliases consumed by the frozen UX.  The exact
        # R43.2.65 entities remain untouched; these aliases do not become V2 owners.
        rows = list(super().required_entity_ids)
        for entity_id in self.FROZEN_UX_HEALTH_ENTITY_IDS:
            if entity_id not in rows:
                rows.append(entity_id)
        return rows

    @classmethod
    def _v1_image_key(
        cls, profile_id: str = "", canonical_image_key: str = "", asset_type: str = ""
    ) -> str:
        profile_id = str(profile_id or "").strip()
        canonical_image_key = str(canonical_image_key or "").strip()
        asset_type = str(asset_type or "").strip().lower()
        if profile_id in cls._V1_IMAGE_KEY_BY_PROFILE_ID:
            return cls._V1_IMAGE_KEY_BY_PROFILE_ID[profile_id]
        if canonical_image_key in cls._V1_IMAGE_KEY_BY_CANONICAL_KEY:
            return cls._V1_IMAGE_KEY_BY_CANONICAL_KEY[canonical_image_key]
        if canonical_image_key in cls._V1_IMAGE_KEYS:
            return canonical_image_key
        return "vehicle_unknown_profile" if asset_type == "vehicle" else "charger_fallback" if asset_type == "charger" else ""

    def assets(self) -> list[dict[str, Any]]:
        def build() -> list[dict[str, Any]]:
            out: list[dict[str, Any]] = []
            for raw in super(MobilityV1Facade, self).assets():
                row = dict(raw)
                asset_type = str(row.get("asset_type") or "")
                row["image_key"] = self._v1_image_key(
                    str(row.get("profile_id") or ""),
                    str(row.get("image_key") or ""),
                    asset_type,
                )
                out.append(row)
            return out

        return self._memo(("parity", "assets"), build)

    def profile_rows(self, profile_type: str) -> list[dict[str, Any]]:
        profile_type = str(profile_type)

        def build() -> list[dict[str, Any]]:
            out: list[dict[str, Any]] = []
            for raw in super(MobilityV1Facade, self).profile_rows(profile_type):
                row = dict(raw)
                row["canonical_image_key"] = row.get("image_key") or ""
                row["image_key"] = self._v1_image_key(
                    str(row.get("profile_id") or ""),
                    str(row.get("canonical_image_key") or ""),
                    profile_type,
                )
                out.append(row)
            return out

        return self._memo(("parity", "profiles", profile_type), build)

    @staticmethod
    def _relationship_row(
        *,
        relationship_id: str,
        relationship_type: str,
        source_asset_id: str,
        target_asset_id: str,
        resolution_source: str,
        confidence: str = "configured",
    ) -> dict[str, Any]:
        return {
            "relationship_id": relationship_id,
            "relationship_type": relationship_type,
            "source_asset_id": source_asset_id,
            "target_asset_id": target_asset_id,
            "effective_target_asset_id": target_asset_id,
            "asset_id": source_asset_id,
            "from_asset_id": source_asset_id,
            "to_asset_id": target_asset_id,
            "resolution_source": resolution_source,
            "confidence": confidence,
            "health": "OK",
        }

    def relationship_rows(self) -> list[dict[str, Any]]:
        def build() -> list[dict[str, Any]]:
            source_rows = [dict(row) for row in super(MobilityV1Facade, self).relationship_rows()]
            out: list[dict[str, Any]] = list(source_rows)
            seen = {
                (str(row.get("relationship_type") or ""), str(row.get("from_asset_id") or row.get("source_asset_id") or ""), str(row.get("to_asset_id") or row.get("target_asset_id") or ""))
                for row in out
            }

            def append(row: dict[str, Any]) -> None:
                key = (
                    str(row.get("relationship_type") or ""),
                    str(row.get("from_asset_id") or ""),
                    str(row.get("to_asset_id") or ""),
                )
                if key not in seen:
                    seen.add(key)
                    out.append(row)

            for raw in source_rows:
                relationship_type = str(raw.get("relationship_type") or "")
                from_asset_id = str(raw.get("from_asset_id") or raw.get("source_asset_id") or "")
                to_asset_id = str(raw.get("to_asset_id") or raw.get("target_asset_id") or "")
                if not from_asset_id or not to_asset_id:
                    continue

                if relationship_type == "configured_assignment":
                    vehicle_id, charger_id = from_asset_id, to_asset_id
                    resolution = str(raw.get("resolution_source") or "configured_assignment")
                    for compat_type, source, target in (
                        ("vehicle_selected_charger", vehicle_id, charger_id),
                        ("vehicle_effective_charger", vehicle_id, charger_id),
                        ("charger_selected_vehicle", charger_id, vehicle_id),
                        ("charger_effective_assigned_vehicle", charger_id, vehicle_id),
                    ):
                        append(
                            self._relationship_row(
                                relationship_id=f"v1:{compat_type}:{source}:{target}",
                                relationship_type=compat_type,
                                source_asset_id=source,
                                target_asset_id=target,
                                resolution_source=resolution,
                            )
                        )
                    continue

                if relationship_type in {"physical_connection", "observed_connection"}:
                    vehicle_id, charger_id = from_asset_id, to_asset_id
                    # Only explicit V2 relationship evidence enters these rows.  A
                    # configured assignment is never promoted to physical evidence.
                    resolution = str(raw.get("resolution_source") or relationship_type)
                    for compat_type, source, target in (
                        ("vehicle_physical_charger", vehicle_id, charger_id),
                        ("charger_connected_vehicle", charger_id, vehicle_id),
                    ):
                        append(
                            self._relationship_row(
                                relationship_id=f"v1:{compat_type}:{source}:{target}",
                                relationship_type=compat_type,
                                source_asset_id=source,
                                target_asset_id=target,
                                resolution_source=resolution,
                                confidence=str(raw.get("confidence") or "observed"),
                            )
                        )
            return out

        return self._memo(("parity", "relationships"), build)

    def command_rows(self) -> list[dict[str, Any]]:
        def build() -> list[dict[str, Any]]:
            out: list[dict[str, Any]] = []
            for raw in super(MobilityV1Facade, self).command_rows():
                row = dict(raw)
                if row.get("frontend_allowed"):
                    command_id = str(row.get("command_id") or "")
                    row.update(
                        {
                            "service_domain": "script",
                            "service_action": "mobility_execute_command",
                            "service_data": {"command_id": command_id},
                            "service_target": {},
                            "invoke": {
                                "service": "script.mobility_execute_command",
                                "data": {"command_id": command_id},
                            },
                        }
                    )
                out.append(row)
            return out

        return self._memo(("parity", "commands"), build)

    @staticmethod
    def _vehicle_property_index_for_component(component_id: str) -> str:
        component_id = str(component_id or "")
        if component_id in MobilityV1Facade._VEHICLE_COMPONENT_INDEXES:
            return f"sensor.mobility_vehicle_{component_id}_property_index"
        return "sensor.mobility_vehicle_property_index"

    @staticmethod
    def _placement_bucket(definition: dict[str, Any]) -> str:
        section = str(definition.get("section_id") or "").strip().lower()
        component = str(definition.get("component_id") or "").strip().lower()
        visibility = str(
            definition.get("ux_visibility") or definition.get("visibility") or ""
        ).strip().lower()
        if (
            "diagnostic" in section
            or "engineering" in section
            or "diagnostic" in component
            or visibility in {"diagnostic", "diagnostics", "engineering", "technical"}
        ):
            return "engineering_properties"
        if section in {"overview", "summary"}:
            return "overview_properties"
        if section in {"action", "actions", "control", "controls", "editor", "editors", "setting", "settings"}:
            return "action_properties"
        return "detail_properties"

    def component_contract(self, asset_type: str) -> dict[str, Any]:
        asset_type = str(asset_type)

        def build() -> dict[str, Any]:
            base = dict(super(MobilityV1Facade, self).component_contract(asset_type))
            property_map = dict(base.get("property_component_map_json") or {})
            components_by_id: dict[str, dict[str, Any]] = {}

            for order, definition in enumerate(self.defs_by_type.get(asset_type, [])):
                property_key = str(definition.get("property_key") or "")
                component_id = str(definition.get("component_id") or "")
                section_id = str(definition.get("section_id") or "")
                if not property_key or not component_id or not section_id:
                    continue
                cfg = dict(property_map.get(property_key) or {})
                cfg.update(
                    {
                        "property_key": property_key,
                        "component_id": component_id,
                        "card_id": component_id,
                        "section_id": section_id,
                    }
                )
                property_map[property_key] = cfg

                component = components_by_id.setdefault(
                    component_id,
                    {
                        "component_id": component_id,
                        "card_id": component_id,
                        "display_name": component_id.replace("_", " ").title(),
                        "tab_id": "engineering" if "diagnostic" in component_id else "overview",
                        "card_order": order,
                        "property_index_entity": self._vehicle_property_index_for_component(component_id)
                        if asset_type == "vehicle"
                        else "sensor.mobility_charger_property_index",
                        "sections": [],
                        "overview_properties": [],
                        "action_properties": [],
                        "detail_properties": [],
                        "engineering_properties": [],
                        "related_commands": [],
                    },
                )
                bucket = self._placement_bucket(definition)
                if property_key not in component[bucket]:
                    component[bucket].append(property_key)
                section = next(
                    (
                        row
                        for row in component["sections"]
                        if str(row.get("section_id") or "") == section_id
                    ),
                    None,
                )
                if section is None:
                    section = {
                        "section_id": section_id,
                        "display_name": section_id.replace("_", " ").title(),
                        "property_keys": [],
                    }
                    component["sections"].append(section)
                if property_key not in section["property_keys"]:
                    section["property_keys"].append(property_key)

            components = sorted(
                components_by_id.values(),
                key=lambda row: (int(row.get("card_order", 9999)), str(row.get("component_id"))),
            )
            return {
                **base,
                "property_component_map_json": property_map,
                "components_json": components,
                "components_by_id": {row["component_id"]: row for row in components},
                "component_count": len(components),
            }

        return self._memo(("parity", "component_contract", asset_type), build)

    def parity_self_check(self) -> list[str]:
        """Static frozen-UX compatibility checks over the current projection."""
        failures: list[str] = []
        for asset_type in ("vehicle", "charger"):
            contract = self.component_contract(asset_type)
            components = list(contract.get("components_json") or [])
            for row in components:
                if not row.get("component_id") or not row.get("property_index_entity"):
                    failures.append(f"{asset_type}:component_shape_incomplete")
            mapped = set((contract.get("property_component_map_json") or {}).keys())
            for definition in self.defs_by_type.get(asset_type, []):
                key = str(definition.get("property_key") or "")
                if definition.get("component_id") and definition.get("section_id") and key not in mapped:
                    failures.append(f"{asset_type}:unplaced:{key}")

        for row in self.command_rows():
            if not row.get("frontend_allowed"):
                continue
            if row.get("service_domain") != "script" or row.get("service_action") != "mobility_execute_command":
                failures.append(f"command_invocation:{row.get('command_id')}")
            if (row.get("service_data") or {}).get("command_id") != row.get("command_id"):
                failures.append(f"command_id_binding:{row.get('command_id')}")

        for profile_type in ("vehicle", "charger"):
            for row in self.profile_rows(profile_type):
                if row.get("image_key") not in self._V1_IMAGE_KEYS:
                    failures.append(f"{profile_type}:unsupported_v1_image:{row.get('profile_id')}")
        return sorted(set(failures))
