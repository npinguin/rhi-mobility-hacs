from __future__ import annotations

from typing import Any

LEGACY_SCRIPT_DOMAIN = "script"
LEGACY_EXECUTE = "mobility_execute_command"
LEGACY_SETPOINT = "mobility_apply_effective_charger_setpoint"


def collision_ids(hass: Any) -> list[str]:
    return [name for name in (LEGACY_EXECUTE, LEGACY_SETPOINT) if hass.services.has_service(LEGACY_SCRIPT_DOMAIN, name)]


def register_services(hass: Any, facade: Any, command_provider: Any, notify: Any | None = None) -> None:
    import voluptuous as vol

    async def legacy_execute(call: Any):
        target_id, target_key = facade.resolve_command(str(call.data["command_id"]))
        request_id = str(call.data.get("transaction_id") or "") or None
        result = await command_provider.async_execute({"asset_id": target_id, "command_key": target_key, "request_id": request_id})
        if notify is not None:
            notify("v1_command_executed")
        return result

    async def legacy_setpoint(call: Any):
        asset_id = str(call.data["asset_id"])
        asset = next((row for row in facade.assets() if row.get("asset_id") == asset_id), None)
        if asset is not None and asset.get("asset_type") == "vehicle":
            asset_id = str(facade._value(asset_id, "vehicle.effective_charger") or "")
            if not asset_id:
                raise ValueError("vehicle has no effective charger")
        request_id = str(call.data.get("transaction_id") or "") or None
        result = await command_provider.async_apply_requested_setpoint({
            "asset_id": asset_id,
            "power_kw": call.data.get("requested_power_kw"),
            "current_a": call.data.get("requested_current_a"),
            "request_id": request_id,
        })
        if notify is not None:
            notify("v1_setpoint_changed")
        return result

    hass.services.async_register(
        LEGACY_SCRIPT_DOMAIN,
        LEGACY_EXECUTE,
        legacy_execute,
        schema=vol.Schema({vol.Required("command_id"): str, vol.Optional("value"): object, vol.Optional("request_origin"): str, vol.Optional("transaction_id"): str}),
    )
    hass.services.async_register(
        LEGACY_SCRIPT_DOMAIN,
        LEGACY_SETPOINT,
        legacy_setpoint,
        schema=vol.Schema({vol.Required("asset_id"): str, vol.Optional("requested_power_kw"): vol.Coerce(float), vol.Optional("requested_current_a"): vol.Coerce(float), vol.Optional("request_origin"): str, vol.Optional("transaction_id"): str}),
    )


def unregister_services(hass: Any) -> None:
    for name in (LEGACY_EXECUTE, LEGACY_SETPOINT):
        if hass.services.has_service(LEGACY_SCRIPT_DOMAIN, name):
            hass.services.async_remove(LEGACY_SCRIPT_DOMAIN, name)
