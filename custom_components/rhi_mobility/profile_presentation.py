from __future__ import annotations

from pathlib import Path
from typing import Any

PROFILE_IMAGE_URL_PREFIX = "/rhi_mobility/profile_images"
_PROFILE_ASSET_DIR = Path(__file__).resolve().parent / "assets" / "profiles"


def effective_profile(manager: Any, asset_id: str) -> dict[str, Any] | None:
    getter = getattr(manager, "_selected_profile", None)
    profile = getter(asset_id) if callable(getter) else None
    return dict(profile) if isinstance(profile, dict) else None


def profile_image_key(manager: Any, asset_id: str) -> str | None:
    profile = effective_profile(manager, asset_id)
    key = None if profile is None else profile.get("image_key")
    if isinstance(key, str) and key.strip():
        return key.strip()
    asset = getattr(manager, "assets", {}).get(asset_id)
    if asset is None:
        return None
    return "generic_charger" if getattr(asset, "concept_id", None) == "charger" else "generic_vehicle"


def profile_image_url(manager: Any, asset_id: str) -> str | None:
    key = profile_image_key(manager, asset_id)
    return None if not key else f"{PROFILE_IMAGE_URL_PREFIX}/{key}.svg"


def profile_metadata(manager: Any, asset_id: str) -> dict[str, Any]:
    profile = effective_profile(manager, asset_id)
    asset = getattr(manager, "assets", {}).get(asset_id)
    if asset is None:
        return {}
    out: dict[str, Any] = {
        "profile_id": None if profile is None else profile.get("profile_id"),
        "profile_type": getattr(asset, "concept_id", None),
        "profile_image_key": profile_image_key(manager, asset_id),
        "profile_image_url": profile_image_url(manager, asset_id),
    }
    if profile:
        for key in (
            "display_name", "short_name", "manufacturer", "vendor", "model", "vehicle_kind",
            "battery_capacity_kwh", "nominal_range_km", "max_ac_power_kw", "max_power_kw",
            "phase_capability", "nominal_voltage_v", "min_current_a", "max_current_a",
            "default_target_soc_pct", "supports_current_control", "supports_remote_start_stop",
        ):
            if profile.get(key) is not None:
                out[key] = profile[key]
    return {key: value for key, value in out.items() if value is not None}


async def async_register_profile_image_paths(hass: Any) -> None:
    """Serve packaged, integration-owned profile illustrations through HA HTTP."""
    marker = "_rhi_mobility_profile_images_registered"
    if getattr(hass, marker, False):
        return
    try:
        from homeassistant.components.http import StaticPathConfig
        await hass.http.async_register_static_paths([
            StaticPathConfig(PROFILE_IMAGE_URL_PREFIX, str(_PROFILE_ASSET_DIR), cache_headers=True)
        ])
    except (ImportError, AttributeError):
        register = getattr(getattr(hass, "http", None), "register_static_path", None)
        if callable(register):
            register(PROFILE_IMAGE_URL_PREFIX, str(_PROFILE_ASSET_DIR), cache_headers=True)
        else:
            return
    setattr(hass, marker, True)
