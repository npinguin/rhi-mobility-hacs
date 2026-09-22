from __future__ import annotations
from typing import Any


NO_SELECTION = "__none__"


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


def _has_binding_role(manager, asset_id: str, asset, role: str | None) -> bool:
    if not role:
        return True
    if role == "manual_profile":
        config = getattr(manager, "domain_config", None)
        is_guest = getattr(config, "is_guest_vehicle", None)
        return bool(callable(is_guest) and is_guest(asset_id))
    return role in asset.source_bindings


def effective_charger_id(manager, vehicle_id: str) -> str | None:
    return manager.effective_charger_for_vehicle(vehicle_id)


def is_available(manager, controller, asset_id: str, property_key: str, editable: dict[str, Any]) -> bool:
    asset=manager.assets.get(asset_id)
    if asset is None or not _has_binding_role(manager,asset_id,asset,editable.get("requires_binding_role")):
        return False
    write_kind=editable.get("write_kind")
    if write_kind=="selected_charger":
        return any(a.concept_id=="charger" for a in manager.assets.values())
    if write_kind=="profile":
        return bool(getattr(manager.registry,"profiles_for_type",lambda _type: [])(asset.concept_id))
    if write_kind=="charger_requested_power":
        return controller.requested_power_descriptor(asset_id) is not None
    if write_kind=="vehicle_requested_power":
        cid=effective_charger_id(manager,asset_id)
        return cid is not None and controller.requested_power_descriptor(cid) is not None
    if write_kind=="charger_requested_current":
        return controller.requested_current_descriptor(asset_id) is not None
    if write_kind=="vehicle_charge_mode":
        return controller.vehicle_charge_mode_source(asset_id) is not None
    if editable.get("dynamic_max")=="battery_capacity":
        profile=manager.planning_profile(asset_id)
        return profile is not None and profile.battery_capacity_kwh is not None
    return True


def choice_rows(manager, registry, asset_id: str, property_key: str, editable: dict[str, Any]) -> list[dict[str, Any]]:
    """Return product choices with stable IDs and backend-owned display labels.

    HA SelectEntity still consumes the scalar values returned by ``options``.  The
    compatibility/product projection consumes these structured rows so the frozen UX
    never has to infer names from profile IDs or asset IDs.
    """
    asset=manager.assets.get(asset_id)
    kind=editable.get("write_kind")
    if kind=="profile":
        if asset is None:
            return []
        rows=[]
        for profile in registry.profiles_for_type(asset.concept_id):
            if not isinstance(profile,dict) or not profile.get("profile_id"):
                continue
            profile_id=str(profile["profile_id"])
            maker=str(profile.get("manufacturer") or profile.get("vendor") or "").strip()
            model=str(profile.get("model") or "").strip()
            secondary=" · ".join(part for part in (maker,model) if part)
            rows.append({
                "value":profile_id,
                "label":str(profile.get("display_name") or profile_id),
                "secondary_label":secondary,
            })
        return rows
    if kind=="selected_charger":
        return [
            {"value":aid,"label":str(getattr(row,"display_name",None) or aid)}
            for aid,row in sorted(manager.assets.items())
            if row.concept_id=="charger"
        ]
    return [{"value":str(value),"label":str(value)} for value in editable.get("options") or []]


def options(manager, registry, asset_id: str, property_key: str, editable: dict[str, Any]) -> list[str]:
    asset=manager.assets.get(asset_id)
    kind=editable.get("write_kind")
    if kind=="profile":
        rows=[] if asset is None else [str(r["profile_id"]) for r in registry.profiles_for_type(asset.concept_id)]
        return [NO_SELECTION,*rows]
    if kind=="selected_charger":
        return [NO_SELECTION,*sorted(aid for aid,a in manager.assets.items() if a.concept_id=="charger")]
    return [str(x) for x in editable.get("options") or []]


def value(manager, controller, asset_id: str, property_key: str, editable: dict[str, Any]):
    kind=editable.get("write_kind")
    snap=manager.snapshots.get(asset_id)
    if kind=="lifecycle_enabled_alias":
        return manager.configuration_value(asset_id,"asset.lifecycle_status","active") != "disabled"
    if kind=="lifecycle_status_alias":
        return manager.configuration_value(asset_id,"asset.lifecycle_status","active")
    if kind=="profile":
        return manager.configuration_value(asset_id,"asset.profile_id",None) or NO_SELECTION
    if kind=="selected_charger":
        # This editor owns configured intent only.  Effective/physical relationships are
        # separate canonical truths and must never substitute for configured selection.
        return manager.configuration_value(asset_id,"vehicle.selected_charger",None) or NO_SELECTION
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
        desc=controller.requested_current_descriptor(asset_id)
        if desc is None:
            return 0.0,0.0,1.0
        return (float(desc.min_current_a),float(desc.max_current_a),float(desc.current_step_a))
    minimum=float(editable.get("min",0.0))
    maximum=editable.get("max")
    if editable.get("dynamic_max")=="battery_capacity":
        profile=manager.planning_profile(asset_id)
        maximum=None if profile is None else profile.battery_capacity_kwh
    maximum=0.0 if maximum is None else float(maximum)
    return minimum,maximum,float(editable.get("step",1.0))


async def _write_structural_configuration(manager, asset_id: str, property_key: str, new_value) -> None:
    """Persist a Mobility-owned structural association and republish its topology.

    Clearing a profile/charger association is valid product configuration.  Older
    manager validation rejected an empty charger reference before reaching the config
    owner, so the compatibility editor normalizes the explicit no-selection token here
    and uses the same MobilityDomainConfiguration owner directly for the clear case.
    Foundation technical selection is deliberately untouched.
    """
    normalized=None if new_value in (None,"",NO_SELECTION) else new_value
    if normalized is None:
        domain_config=getattr(manager,"domain_config",None)
        if domain_config is None:
            raise RuntimeError("Mobility semantic configuration store unavailable")
        await domain_config.async_set(asset_id,property_key,None)
        affected=set(manager.assets) if property_key=="vehicle.selected_charger" else {asset_id}
        for aid in affected:
            if aid in getattr(manager,"snapshots",{}):
                manager._refresh(aid)
    else:
        await manager.async_set_configuration_property(asset_id,property_key,normalized)
    notify=getattr(manager,"_notify_topology",None)
    if callable(notify):
        notify()


async def async_write(manager, controller, asset_id: str, property_key: str, editable: dict[str, Any], new_value) -> None:
    kind=editable.get("write_kind")
    if kind=="lifecycle_enabled_alias":
        await manager.async_set_configuration_property(asset_id,"asset.lifecycle_status","active" if bool(new_value) else "disabled")
        return
    if kind=="lifecycle_status_alias":
        await manager.async_set_configuration_property(asset_id,"asset.lifecycle_status",str(new_value))
        return
    if kind=="profile":
        await _write_structural_configuration(manager,asset_id,"asset.profile_id",new_value)
        return
    if kind=="selected_charger":
        await _write_structural_configuration(manager,asset_id,"vehicle.selected_charger",new_value)
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
    # configuration and manual_vehicle_configuration write through the canonical
    # Mobility configuration owner; manager validates their semantics.
    await manager.async_set_configuration_property(asset_id,property_key,new_value)
