"""Mobility-owned visual identity catalog for cross-domain UX reuse.

Foundation owns registry mechanics and global visual_ref validation. Mobility owns
assignment of one visual_ref to each Mobility semantic asset. UX packages keep the
actual image files and resolve these package-neutral references locally.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any

_PREFIX_VEHICLE = "mobility.vehicle."
_PREFIX_CHARGER = "mobility.charger."
_VARIANTS = ["thumbnail", "card", "hero", "detail"]

_VEHICLE_FAMILIES: dict[str, tuple[str, ...]] = {
    "audi.q8.4m.2024-2026.tfsi-e": ("daytona-grey", "mythos-black", "glacier-white", "navarra-blue", "tango-red"),
    "bmw.x1.u11.2025-2026.phev": ("mineral-white", "black-sapphire", "skyscraper-grey", "phytonic-blue", "fire-red"),
    "mercedes.gla.h247.2023-2026.phev": ("mountain-grey", "night-black", "polar-white", "spectral-blue", "patagonia-red"),
    "renault.scenic.e-tech.2024-2026.techno": ("pearl-white", "starry-black", "schiste-grey", "midnight-blue", "flame-red"),
    "volkswagen.id4.2024-2026.ev": ("costa-azul", "moonstone-grey", "mythos-black", "glacier-white", "scale-silver"),
    "generic.guest.current.phev-1phase": ("slate-grey", "carbon-black", "pearl-white", "deep-blue", "urban-green"),
    "generic.guest.current.ev-3phase": ("slate-grey", "carbon-black", "pearl-white", "deep-blue", "urban-green"),
}

_CHARGER_REFS = (
    "wallbox.commander2.white",
    "wallbox.commander2.black",
    "peblar.business.socket.factory",
    "fibaro.wall-plug-2.zwave-plus.be-fr.white",
)

_PROFILE_DEFAULTS: dict[str, str] = {
    "audi_q8_55_tfsi_e_quattro_my2025": _PREFIX_VEHICLE + "audi.q8.4m.2024-2026.tfsi-e.daytona-grey",
    "audi_q8_tfsi_55e_2025_phev": _PREFIX_VEHICLE + "audi.q8.4m.2024-2026.tfsi-e.daytona-grey",
    "bmw_x1_xdrive25e_my2026": _PREFIX_VEHICLE + "bmw.x1.u11.2025-2026.phev.mineral-white",
    "bmw_x1_2025_phev": _PREFIX_VEHICLE + "bmw.x1.u11.2025-2026.phev.mineral-white",
    "mercedes_gla_250e_my2025": _PREFIX_VEHICLE + "mercedes.gla.h247.2023-2026.phev.mountain-grey",
    "mercedes_gla_2021_phev": _PREFIX_VEHICLE + "mercedes.gla.h247.2023-2026.phev.mountain-grey",
    "renault_scenic_techno_ev": _PREFIX_VEHICLE + "renault.scenic.e-tech.2024-2026.techno.pearl-white",
    "volkswagen_id4_pro_my2026": _PREFIX_VEHICLE + "volkswagen.id4.2024-2026.ev.scale-silver",
    "vw_id4_business_pro_77kwh": _PREFIX_VEHICLE + "volkswagen.id4.2024-2026.ev.scale-silver",
    "guest_phev_1phase": _PREFIX_VEHICLE + "generic.guest.current.phev-1phase.slate-grey",
    "guest_ev_3phase": _PREFIX_VEHICLE + "generic.guest.current.ev-3phase.slate-grey",
    "wallbox_commander2_22kw": _PREFIX_CHARGER + "wallbox.commander2.white",
    "wallbox_ocpp": _PREFIX_CHARGER + "wallbox.commander2.white",
    "peblar_business_socket_22kw": _PREFIX_CHARGER + "peblar.business.socket.factory",
    "peblar_22kw": _PREFIX_CHARGER + "peblar.business.socket.factory",
    "fibaro_utility_plug": _PREFIX_CHARGER + "fibaro.wall-plug-2.zwave-plus.be-fr.white",
}

_IMAGE_KEY_ALIASES: dict[str, str] = {
    "audi_q8_daytona_grey_23": _PREFIX_VEHICLE + "audi.q8.4m.2024-2026.tfsi-e.daytona-grey",
    "vehicle_audi_q8": _PREFIX_VEHICLE + "audi.q8.4m.2024-2026.tfsi-e.daytona-grey",
    "bmw_x1_phev": _PREFIX_VEHICLE + "bmw.x1.u11.2025-2026.phev.mineral-white",
    "vehicle_bmw_x1_phev": _PREFIX_VEHICLE + "bmw.x1.u11.2025-2026.phev.mineral-white",
    "vehicle_bmw_ix1_phev": _PREFIX_VEHICLE + "bmw.x1.u11.2025-2026.phev.mineral-white",
    "mercedes_gla_phev": _PREFIX_VEHICLE + "mercedes.gla.h247.2023-2026.phev.mountain-grey",
    "vehicle_mercedes_gla": _PREFIX_VEHICLE + "mercedes.gla.h247.2023-2026.phev.mountain-grey",
    "renault_scenic_techno_ev": _PREFIX_VEHICLE + "renault.scenic.e-tech.2024-2026.techno.pearl-white",
    "vehicle_renault_scenic_techno_ev": _PREFIX_VEHICLE + "renault.scenic.e-tech.2024-2026.techno.pearl-white",
    "vw_id4_business_pro_silver_grey": _PREFIX_VEHICLE + "volkswagen.id4.2024-2026.ev.scale-silver",
    "vehicle_vw_id4": _PREFIX_VEHICLE + "volkswagen.id4.2024-2026.ev.scale-silver",
    "guest_phev": _PREFIX_VEHICLE + "generic.guest.current.phev-1phase.slate-grey",
    "guest_ev": _PREFIX_VEHICLE + "generic.guest.current.ev-3phase.slate-grey",
    "vehicle_guest": _PREFIX_VEHICLE + "generic.guest.current.phev-1phase.slate-grey",
    "wallbox_ocpp": _PREFIX_CHARGER + "wallbox.commander2.white",
    "charger_wallbox": _PREFIX_CHARGER + "wallbox.commander2.white",
    "charger_wallbox_white": _PREFIX_CHARGER + "wallbox.commander2.white",
    "charger_wallbox_black": _PREFIX_CHARGER + "wallbox.commander2.black",
    "peblar_22kw": _PREFIX_CHARGER + "peblar.business.socket.factory",
    "charger_peblar": _PREFIX_CHARGER + "peblar.business.socket.factory",
    "fibaro_utility_plug": _PREFIX_CHARGER + "fibaro.wall-plug-2.zwave-plus.be-fr.white",
    "utility_plug": _PREFIX_CHARGER + "fibaro.wall-plug-2.zwave-plus.be-fr.white",
    "charger_utility_plug": _PREFIX_CHARGER + "fibaro.wall-plug-2.zwave-plus.be-fr.white",
}

def _all_refs() -> set[str]:
    refs = {
        _PREFIX_VEHICLE + family + "." + appearance
        for family, appearances in _VEHICLE_FAMILIES.items()
        for appearance in appearances
    }
    refs.update(_PREFIX_CHARGER + ref for ref in _CHARGER_REFS)
    refs.update({_PREFIX_VEHICLE + "generic.fallback", _PREFIX_CHARGER + "generic.fallback"})
    return refs

_VISUAL_REFS = _all_refs()

def resolve_visual_ref(asset_type: str, image_key: Any = None, profile_id: Any = None) -> str:
    """Resolve one canonical package-neutral visual_ref for a Mobility asset."""
    kind = str(asset_type or "").strip().lower()
    raw = str(image_key or "").strip()
    if raw.startswith("mobility.") and raw in _VISUAL_REFS:
        return raw
    prefixed = (_PREFIX_VEHICLE if kind == "vehicle" else _PREFIX_CHARGER) + raw if raw else ""
    if prefixed in _VISUAL_REFS:
        return prefixed
    if raw in _IMAGE_KEY_ALIASES:
        return _IMAGE_KEY_ALIASES[raw]
    profile_ref = _PROFILE_DEFAULTS.get(str(profile_id or "").strip())
    if profile_ref:
        return profile_ref
    return (_PREFIX_CHARGER if kind == "charger" else _PREFIX_VEHICLE) + "generic.fallback"

class MobilityVisualAssetCatalogProvider:
    """Bounded startup catalog registered once with Foundation."""

    publication_revision = 1

    def get_visual_assets(self) -> list[dict[str, Any]]:
        rows = []
        for visual_ref in sorted(_VISUAL_REFS):
            rows.append({
                "visual_ref": visual_ref,
                "asset_type": "charger" if visual_ref.startswith(_PREFIX_CHARGER) else "vehicle",
                "owner_domain": "rhi_mobility",
                "revision": 1,
                "variant_keys": list(_VARIANTS),
            })
        return deepcopy(rows)
