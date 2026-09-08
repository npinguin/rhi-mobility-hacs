from __future__ import annotations
from typing import Any


def _properties(registry) -> dict[str, dict[str, Any]]:
    return dict((getattr(registry, "semantic_catalog", {}) or {}).get("properties") or {})


def editable_definitions(registry, asset_type: str, platform: str) -> list[tuple[str, dict[str, Any]]]:
    rows=[]
    for property_key,definition in _properties(registry).items():
        editable=definition.get("editable")
        if not isinstance(editable,dict) or editable.get("platform") != platform:
            continue
        if asset_type not in set(editable.get("asset_types") or []):
            continue
        rows.append((str(property_key),dict(editable)))
    return sorted(rows,key=lambda row: row[0])


def _has_binding_role(asset, role: str | None) -> bool:
    if not role:
        return True
    return role in asset.source_bindings


def effective_charger_id(manager, vehicle_id: str) -> str | None:
    return manager.effective_charger_for_vehicle(vehicle_id)


def is_available(manager, controller, asset_id: str, property_key: str, editable: dict[str, Any]) -> bool:
    asset=manager.assets.get(asset_id)
    if asset is None or not _has_binding_role(asset,editable.get("requires_binding_role")):
        return False
    write_kind=editable.get("write_kind")
    if write_kind=="selected_charger":
        return any(a.concept_id=="charger" for a in manager.assets.values())
    if write_kind=="charger_requested_power":
        return controller.requested_power_descriptor(asset_id) is not None
    if write_kind=="vehicle_requested_power":
        cid=effective_charger_id(manager,asset_id)
        return cid is not None and controller.requested_power_descriptor(cid) is not None
    if write_kind=="charger_requested_current":
        desc=controller.requested_power_descriptor(asset_id)
        return desc is not None and desc.mode=="current_limit"
    if write_kind=="vehicle_charge_mode":
        return controller.vehicle_charge_mode_source(asset_id) is not None
    if editable.get("dynamic_max")=="battery_capacity":
        profile=manager.planning_profile(asset_id)
        return profile is not None and profile.battery_capacity_kwh is not None
    return True


def options(manager, registry, asset_id: str, property_key: str, editable: dict[str, Any]) -> list[str]:
    asset=manager.assets.get(asset_id)
    kind=editable.get("write_kind")
    if kind=="profile":
        return [] if asset is None else [str(r["profile_id"]) for r in registry.profiles_for_type(asset.concept_id)]
    if kind=="selected_charger":
        return sorted(aid for aid,a in manager.assets.items() if a.concept_id=="charger")
    return [str(x) for x in editable.get("options") or []]


def value(manager, controller, asset_id: str, property_key: str, editable: dict[str, Any]):
    kind=editable.get("write_kind")
    snap=manager.snapshots.get(asset_id)
    if kind=="lifecycle_enabled_alias":
        return manager.configuration_value(asset_id,"asset.lifecycle_status","active") != "disabled"
    if kind=="lifecycle_status_alias":
        return manager.configuration_value(asset_id,"asset.lifecycle_status","active")
    if kind=="selected_charger":
        return manager.effective_charger_for_vehicle(asset_id)
    if kind=="charger_requested_power":
        return controller.requested_power_readback(asset_id)
    if kind=="vehicle_requested_power":
        cid=effective_charger_id(manager,asset_id)
        return controller.requested_power_readback(cid) if cid else None
    if kind=="charger_requested_current":
        return controller.requested_current_readback(asset_id)
    if kind=="vehicle_charge_mode":
        return controller.vehicle_charge_mode_readback(asset_id)
    if snap is not None and property_key in snap.values:
        return snap.values.get(property_key)
    return manager.configuration_value(asset_id,property_key,None)


def bounds(manager, controller, asset_id: str, property_key: str, editable: dict[str, Any]) -> tuple[float,float,float]:
    mode=editable.get("dynamic_bounds")
    if mode=="requested_power":
        target=asset_id
        if editable.get("write_kind")=="vehicle_requested_power":
            target=effective_charger_id(manager,asset_id) or ""
        desc=controller.requested_power_descriptor(target) if target else None
        return (0.0,0.0,0.1) if desc is None else (round(desc.min_power_kw,3),round(desc.max_power_kw,3),round(desc.step_power_kw,3))
    if mode=="requested_current":
        desc=controller.requested_power_descriptor(asset_id)
        if desc is None:
            return 0.0,0.0,1.0
        return (
            0.0 if desc.min_current_a is None else float(desc.min_current_a),
            0.0 if desc.max_current_a is None else float(desc.max_current_a),
            1.0 if desc.current_step_a is None else float(desc.current_step_a),
        )
    minimum=float(editable.get("min",0.0))
    maximum=editable.get("max")
    if editable.get("dynamic_max")=="battery_capacity":
        profile=manager.planning_profile(asset_id)
        maximum=None if profile is None else profile.battery_capacity_kwh
    maximum=0.0 if maximum is None else float(maximum)
    return minimum,maximum,float(editable.get("step",1.0))


async def async_write(manager, controller, asset_id: str, property_key: str, editable: dict[str, Any], new_value) -> None:
    kind=editable.get("write_kind")
    if kind=="lifecycle_enabled_alias":
        await manager.async_set_configuration_property(asset_id,"asset.lifecycle_status","active" if bool(new_value) else "disabled")
        return
    if kind=="lifecycle_status_alias":
        await manager.async_set_configuration_property(asset_id,"asset.lifecycle_status",str(new_value))
        return
    if kind=="charger_requested_power":
        result=await controller.async_set_requested_power(asset_id,float(new_value))
        if result.get("result")=="BLOCKED": raise ValueError(result.get("reason"))
        return
    if kind=="vehicle_requested_power":
        cid=effective_charger_id(manager,asset_id)
        if not cid: raise ValueError("effective_charger_missing")
        result=await controller.async_set_requested_power(cid,float(new_value))
        if result.get("result")=="BLOCKED": raise ValueError(result.get("reason"))
        return
    if kind=="charger_requested_current":
        result=await controller.async_set_requested_current(asset_id,float(new_value))
        if result.get("result")=="BLOCKED": raise ValueError(result.get("reason"))
        return
    if kind=="vehicle_charge_mode":
        result=await controller.async_set_vehicle_charge_mode(asset_id,str(new_value))
        if result.get("result")=="BLOCKED": raise ValueError(result.get("reason"))
        return
    # profile, selected_charger, configuration and manual_vehicle_configuration all write
    # through the canonical Mobility configuration owner; manager validates semantics.
    await manager.async_set_configuration_property(asset_id,property_key,new_value)
