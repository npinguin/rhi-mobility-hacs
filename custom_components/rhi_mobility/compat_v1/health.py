from __future__ import annotations

from typing import Any


def facade_parity_health(facade: Any) -> dict[str, Any]:
    """Measure V1 facade shape closure without reconstructing Mobility semantics."""
    assets = facade.assets()
    asset_counts: dict[str, int] = {}
    for asset in assets:
        typ = str(asset.get("asset_type") or "")
        asset_counts[typ] = asset_counts.get(typ, 0) + 1

    expected_properties = 0
    actual_properties = 0
    unplaced: list[str] = []
    duplicate_rows: list[str] = []
    seen: set[tuple[str, str]] = set()
    for asset_type, definitions in facade.defs_by_type.items():
        expected_properties += asset_counts.get(asset_type, 0) * len(definitions)
        rows = facade.property_rows(asset_type)
        actual_properties += len(rows)
        for row in rows:
            identity = (str(row.get("asset_id") or ""), str(row.get("property_key") or ""))
            if identity in seen:
                duplicate_rows.append(":".join(identity))
            seen.add(identity)
            if not row.get("component_id") or not row.get("section_id"):
                unplaced.append(":".join(identity))

    command_rows = facade.command_rows()
    command_definitions = len(facade.command_contracts)
    invalid_command_shapes = [
        str(row.get("command_id") or "")
        for row in command_rows
        if not row.get("command_key") or row.get("frontend_allowed") and not row.get("binding_exists")
    ]

    blockers = {
        "property_row_count_mismatch": int(actual_properties != expected_properties),
        "unplaced_properties": len(unplaced),
        "duplicate_property_rows": len(duplicate_rows),
        "invalid_command_shapes": len(invalid_command_shapes),
    }
    return {
        "status": "PASS" if not any(blockers.values()) else "FAIL",
        "contract_id": facade.CONTRACT_ID,
        "canonical_source_contract": "MOBILITY_PUBLIC_RUNTIME_V2",
        "expected_property_rows": expected_properties,
        "actual_property_rows": actual_properties,
        "asset_counts": asset_counts,
        "v1_command_definition_count": command_definitions,
        "runtime_command_row_count": len(command_rows),
        **blockers,
        "unplaced_property_ids": unplaced[:100],
        "duplicate_property_ids": duplicate_rows[:100],
        "invalid_command_ids": invalid_command_shapes[:100],
        "legacy_computation_active": False,
        "removal_boundary": "custom_components.rhi_mobility.compat_v1",
    }
