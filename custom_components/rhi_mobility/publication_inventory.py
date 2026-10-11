"""Canonical Mobility property/command inventory from already compiled domain model.

Properties and command rules are declared, not guessed from HA entities.
Conditional publication never means that a vehicle, charger or write capability
is installed, available or safe to invoke.
"""
from __future__ import annotations
from copy import deepcopy
from .const import RELEASE


class MobilityPublicationInventoryProvider:
    def __init__(self, registry):
        catalog = registry.semantic_catalog
        domain = registry.domain_model
        entries = []
        for key, definition in sorted(catalog["properties"].items()):
            types = definition.get("applicable_asset_types") or ["vehicle", "charger"]
            for asset_type in sorted(types):
                if asset_type not in {"vehicle", "charger"}:
                    continue
                platform = definition.get("entity_type") or "sensor"
                entries.append({
                    "id": f"property.{asset_type}.{key}",
                    "kind": "canonical_property",
                    "authority": "rhi_mobility", "producer": {"sensor": "MobilityPropertySensor", "number": "MobilityNumber", "switch": "MobilityCompatibilitySwitch"}[platform],
                    "publication_status": "CONDITIONAL",
                    "contract": "RHI_MOBILITY_CANONICAL_PROPERTY_V1",
                    "asset_type": asset_type, "property_key": key,
                    "ha_platform": platform,
                    "unique_id_pattern": f"rhi_mobility:{{asset_id}}:{'property' if platform == 'sensor' else platform}:{key}",
                    "render_as": (definition.get("placements") or {}).get(asset_type, {}).get("render_as")
                        or definition.get("render_as"),
                    "component_id": (definition.get("placements") or {}).get(asset_type, {}).get("component_id")
                        or definition.get("component_id"),
                    "section_id": (definition.get("placements") or {}).get(asset_type, {}).get("section_id")
                        or definition.get("section_id"),
                    "write_contract": bool(definition.get("editable")),
                })
        for builder_id, builder in sorted(domain["builders"].items()):
            for command in sorted(builder.get("command_rules") or {}):
                entries.append({
                    "id": f"command.{builder_id}.{command}",
                    "kind": "canonical_command", "authority": "rhi_mobility",
                    "producer": "MobilityCommandButton",
                    "publication_status": "CONDITIONAL",
                    "builder_id": builder_id, "command_key": command,
                    "unique_id_pattern": f"rhi_mobility:{{asset_id}}:command:{command}",
                    "execution_owner": "rhi_mobility",
                })
        self._entries = entries
        self._model_version = (
            f"runtime:{domain['contract_version']};"
            f"properties:{catalog['contract_version']}"
        )

    def get_publication_inventory(self):
        return deepcopy({
            "contract_id": "RHI_DOMAIN_PUBLICATION_INVENTORY_V1",
            "domain_id": "rhi_mobility", "model_version": self._model_version,
            "release": RELEASE,
            "entries": sorted(
                self._entries + self._native_entries(), key=lambda row: row["id"]
            ),
        })

    @staticmethod
    def _native_entries():
        roles = {
            "experience_v2": ("experience", "ExperienceV2Sensor"),
            "policy_v2": ("policy", "PolicyV2Sensor"),
            "energy_v2": ("energy_interop", "EnergyV2Sensor"),
            "command_v2": ("command_interop", "CommandV2Sensor"),
            "activity_v2": ("activity", "ActivityV2Sensor"),
            "profile_catalog_v2": ("profile_catalog", "ProfileCatalogV2Sensor"),
            "supervision_v2": ("supervision", "ProductSupervisionV2Sensor"),
            "release": ("status", "ReleaseSensor"),
            "health": ("status", "HealthSensor"),
            "configuration": ("status", "ConfigurationSensor"),
            "build": ("status", "BuildSensor"),
        }
        entries = [
            {
                "id": "native." + role, "kind": kind,
                "authority": "rhi_mobility", "producer": producer,
                "publication_status": "PUBLISHED",
                "unique_id_pattern": f"rhi_mobility:{{entry_id}}:monitor:{role}",
            }
            for role, (kind, producer) in roles.items()
        ]
        entries.append({
            "id": "service.execute_command", "kind": "command_service",
            "authority": "rhi_mobility", "producer": "MobilityControlController",
            "publication_status": "PUBLISHED",
            "service": "rhi_mobility.execute_command",
            "confirmation": "physical_charger_readback",
        })
        return entries
