"""Robotix Home Intelligence - Mobility Module.

Bootstrap rule: this module must remain import-safe for Home Assistant config-flow
loading. Runtime, platform and Foundation shared-registry imports are therefore
performed only from async_setup_entry().
"""
from __future__ import annotations

from typing import Any
import logging

from .const import (
    ACTIVITY_PROVIDER_ID,
    COMMAND_PROVIDER_ID,
    DOMAIN,
    FOUNDATION_DOMAIN_ID,
    ENERGY_COMPAT_PROVIDER_ID,
    ENERGY_PROVIDER_ID,
    EXPERIENCE_PROVIDER_ID,
    INTEROP_PROVIDER_REGISTRY_KEY,
    PUBLIC_RUNTIME_COMPAT_PROVIDER_ID,
    PUBLIC_RUNTIME_PROVIDER_ID,
    SELECTED_BUILD_INPUT_REGISTRY_KEY,
    SELECTED_BUILD_INPUTS_CHANGED_EVENT,
    SERVICE_EXECUTE_COMMAND,
    SERVICE_REARM_EXECUTION,
    SERVICE_SET_REQUESTED_POWER,
)

PLATFORMS = ["sensor", "number", "button", "select", "text", "switch"]
LEGACY_SCRIPT_DOMAIN = "script"
LEGACY_EXECUTE = "mobility_execute_command"
LEGACY_SETPOINT = "mobility_apply_effective_charger_setpoint"

_LOGGER = logging.getLogger(__name__)


def _legacy_script_collision(hass: Any) -> list[str]:
    return [
        name
        for name in (LEGACY_EXECUTE, LEGACY_SETPOINT)
        if hass.services.has_service(LEGACY_SCRIPT_DOMAIN, name)
    ]


def _selected_input_payloads(hass: Any) -> list[dict]:
    """Return already-published Foundation build inputs for Mobility."""
    entry = hass.data.get(SELECTED_BUILD_INPUT_REGISTRY_KEY, {}).get(FOUNDATION_DOMAIN_ID)
    if entry is None:
        return []
    if isinstance(entry, dict) and entry.get("kind") == "selected_domain_build_input":
        return [entry]
    if isinstance(entry, (list, tuple)):
        return [
            x
            for x in entry
            if isinstance(x, dict) and x.get("kind") == "selected_domain_build_input"
        ]
    if isinstance(entry, dict):
        candidates: list[dict] = []
        payload = entry.get("payload")
        if isinstance(payload, dict):
            candidates.append(payload)
        for key in ('inputs','items','payloads','selected_inputs'):
            rows = entry.get(key)
            if isinstance(rows, (list, tuple)):
                candidates.extend(x for x in rows if isinstance(x, dict))
        return [
            x for x in candidates if x.get("kind") == "selected_domain_build_input"
        ]
    return []


async def _async_import_existing_selected_inputs(hass: Any, manager: Any) -> None:
    """Consume the authoritative Foundation registry slice during setup.

    Absence of the shared-domain slice means Foundation has not published yet and
    therefore keeps the manager in WAITING. A present-but-empty authoritative
    slice is different: it is a valid empty Mobility configuration and must be
    applied so the manager reports REMOVED/EMPTY rather than waiting forever.
    """
    registry = hass.data.get(SELECTED_BUILD_INPUT_REGISTRY_KEY, {}) or {}
    if FOUNDATION_DOMAIN_ID not in registry:
        return
    payloads = _selected_input_payloads(hass)
    try:
        await manager.async_replace_selected_build_inputs(payloads)
    except Exception as exc:
        # The manager records exact rejection evidence; setup remains available
        # for diagnostics and never fabricates runtime truth.
        _LOGGER.warning("Mobility initial Foundation handoff was rejected; diagnostics retained: %s", exc)


def _install_selected_input_lifecycle(hass: Any, manager: Any, entry: Any) -> None:
    """Listen only to the Baseline 1.7.0 structural handoff event.

    Event payloads are never treated as truth. Every matching event triggers a
    fresh read of the Foundation-owned authoritative registry.
    """
    async def rebuild_from_registry(event: Any) -> None:
        data = getattr(event, "data", {}) or {}
        if data.get("domain_id") != FOUNDATION_DOMAIN_ID:
            return
        try:
            await manager.async_replace_selected_build_inputs(_selected_input_payloads(hass))
            from .projection import async_reconcile_projection
            await async_reconcile_projection(hass, entry.entry_id, set(manager.assets))
        except Exception as exc:
            # Fail closed: manager retains its previous known-good runtime and
            # exposes the rejected attempt through health/diagnostics.
            _LOGGER.warning("Mobility Foundation handoff rebuild rejected; previous runtime retained: %s", exc)
            return

    def changed(event: Any) -> None:
        data = getattr(event, "data", {}) or {}
        if data.get("domain_id") != FOUNDATION_DOMAIN_ID:
            return
        hass.async_create_task(rebuild_from_registry(event))

    unsub = hass.bus.async_listen(SELECTED_BUILD_INPUTS_CHANGED_EVENT, changed)
    entry.async_on_unload(unsub)


def _load_foundation_registry_api() -> tuple[Any, Any]:
    """Load the shared registry API only when the config entry is being set up.

    Keeping this import out of package bootstrap is essential: Home Assistant imports
    the package before config_flow.py. A missing/old Foundation package must never
    turn into the opaque UI error 'Invalid handler specified'.
    """
    try:
        from custom_components.rhi_foundation.shared_registry import (
            register_domain_build_specification_provider,
            unregister_domain_build_specification_provider,
        )
    except (ImportError, ModuleNotFoundError) as exc:
        try:
            from homeassistant.exceptions import ConfigEntryNotReady
        except ImportError:
            raise RuntimeError(
                "RHI Mobility requires RHI Foundation F1.7.0 / Shared Baseline 1.7.0 "
                "shared_registry.py before runtime setup"
            ) from exc
        raise ConfigEntryNotReady(
            "RHI Mobility requires RHI Foundation F1.7.0 / Shared Baseline 1.7.0 "
            "shared_registry.py. Install/update Foundation and retry setup."
        ) from exc
    return (
        register_domain_build_specification_provider,
        unregister_domain_build_specification_provider,
    )


async def async_setup_entry(hass: Any, entry: Any) -> bool:
    """Set up Mobility after the config flow has created a config entry."""
    import voluptuous as vol

    # Runtime imports intentionally live here, never at config-flow bootstrap time.
    from .commands.controller import MobilityControlController
    from .commands.interop import MobilityCommandProvider
    from .domain_config import MobilityDomainConfiguration
    from .interop import MobilityEnergyReadOnlyProvider, MobilityEnergyV2Provider
    from .legacy_compat import MobilityLegacyV1FacadeProvider
    from .legacy_state import MobilityLegacyV1StatePublisher
    from .model_registry import MobilityModelRegistry
    from .publication import MobilityBuildSpecificationProvider
    from .public_runtime import (
        MobilityActivityProvider,
        MobilityExperienceProvider,
        MobilityPublicRuntimeProvider,
    )
    from .runtime.manager import MobilityRuntimeManager

    register_provider, unregister_provider = _load_foundation_registry_api()

    registry = MobilityModelRegistry()
    provider = MobilityBuildSpecificationProvider(registry)
    domain_config = MobilityDomainConfiguration(hass, entry)
    manager = MobilityRuntimeManager(hass, registry, domain_config)
    controller = MobilityControlController(hass, manager, registry)
    public_provider = MobilityPublicRuntimeProvider(manager, controller, registry)
    energy_provider = MobilityEnergyV2Provider(manager, controller, registry, public_provider)
    energy_compat_provider = MobilityEnergyReadOnlyProvider(manager, registry, controller, public_provider)
    command_provider = MobilityCommandProvider(controller)
    experience_provider = MobilityExperienceProvider(public_provider, registry)
    activity_provider = MobilityActivityProvider(manager, controller)
    legacy_facade = MobilityLegacyV1FacadeProvider(
        manager,
        controller,
        public_provider,
        experience_provider,
        activity_provider,
        energy_provider,
        domain_config,
    )
    legacy_state = MobilityLegacyV1StatePublisher(
        hass, legacy_facade, manager, controller
    )

    collisions = legacy_state.collision_ids()
    script_collisions = _legacy_script_collision(hass)
    if collisions or script_collisions:
        details = []
        if collisions:
            details.append("legacy entity states active: " + ",".join(collisions))
        if script_collisions:
            details.append("legacy script services active: " + ",".join(script_collisions))
        raise RuntimeError(
            "R43.2.65 must be disabled before exact V2 facade takeover; "
            + "; ".join(details)
        )

    await domain_config.async_initialize()

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {
        "registry": registry,
        "provider": provider,
        "runtime": manager,
        "controller": controller,
        "domain_config": domain_config,
        "energy_provider": energy_provider,
        "energy_compat_provider": energy_compat_provider,
        "command_provider": command_provider,
        "public_provider": public_provider,
        "experience_provider": experience_provider,
        "activity_provider": activity_provider,
        "compatibility_provider": legacy_facade,
        "legacy_facade": legacy_facade,
        "legacy_state": legacy_state,
        "unregister_provider": unregister_provider,
    }
    register_provider(
        hass,
        publisher_domain=DOMAIN,
        provider=provider,
        publication_revision=provider.publication_revision,
    )
    await _async_import_existing_selected_inputs(hass, manager)
    from .projection import async_reconcile_projection
    await async_reconcile_projection(hass, entry.entry_id, set(manager.assets))
    _install_selected_input_lifecycle(hass, manager, entry)

    interop = hass.data.setdefault(INTEROP_PROVIDER_REGISTRY_KEY, {})
    interop[ENERGY_PROVIDER_ID] = energy_provider
    interop[ENERGY_COMPAT_PROVIDER_ID] = energy_compat_provider
    interop[COMMAND_PROVIDER_ID] = command_provider
    interop[PUBLIC_RUNTIME_PROVIDER_ID] = public_provider
    interop[PUBLIC_RUNTIME_COMPAT_PROVIDER_ID] = legacy_facade
    interop[EXPERIENCE_PROVIDER_ID] = experience_provider
    interop[ACTIVITY_PROVIDER_ID] = activity_provider

    async def execute_command(call: Any):
        await controller.async_execute_command(
            call.data["asset_id"], call.data["command_key"], call.data.get("request_id")
        )

    async def set_requested_power(call: Any):
        await controller.async_set_requested_power(
            call.data["asset_id"], call.data["power_kw"], call.data.get("request_id")
        )

    async def rearm_execution(call: Any):
        await controller.async_rearm(
            call.data["asset_id"], call.data["conflict_family"]
        )

    hass.services.async_register(
        DOMAIN,
        SERVICE_EXECUTE_COMMAND,
        execute_command,
        schema=vol.Schema(
            {
                vol.Required("asset_id"): str,
                vol.Required("command_key"): str,
                vol.Optional("request_id"): str,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_REQUESTED_POWER,
        set_requested_power,
        schema=vol.Schema(
            {
                vol.Required("asset_id"): str,
                vol.Required("power_kw"): vol.Coerce(float),
                vol.Optional("request_id"): str,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_REARM_EXECUTION,
        rearm_execution,
        schema=vol.Schema(
            {
                vol.Required("asset_id"): str,
                vol.Required("conflict_family"): str,
            }
        ),
    )

    async def legacy_execute(call: Any):
        command_id = str(call.data["command_id"])
        target_id, target_key = legacy_facade.resolve_command(command_id)
        request_id = str(call.data.get("transaction_id") or "") or None
        return await controller.async_execute_command(target_id, target_key, request_id)

    async def legacy_setpoint(call: Any):
        asset_id = str(call.data["asset_id"])
        asset = manager.assets.get(asset_id)
        if asset is not None and asset.concept_id == "vehicle":
            resolved = manager.effective_charger_for_vehicle(asset_id)
            if not resolved:
                raise ValueError("vehicle has no effective charger")
            asset_id = resolved
        power = call.data.get("requested_power_kw")
        current = call.data.get("requested_current_a")
        if power is None and current is None:
            raise ValueError(
                "requested_power_kw or requested_current_a is required"
            )
        request_id = str(call.data.get("transaction_id") or "") or None
        if power is not None and current is not None:
            desc = controller.requested_power_descriptor(asset_id)
            if (
                desc is None
                or desc.effective_voltage_v is None
                or desc.effective_phase_count is None
            ):
                raise ValueError(
                    "cannot validate simultaneous power/current request without explicit control profile"
                )
            implied = (
                float(current)
                * desc.effective_voltage_v
                * desc.effective_phase_count
                / 1000.0
            )
            if abs(float(power) - implied) > max(0.05, desc.step_power_kw / 2.0):
                raise ValueError("requested_power_kw and requested_current_a conflict")
            return await controller.async_set_requested_power(
                asset_id, float(power), request_id
            )
        if power is not None:
            return await controller.async_set_requested_power(
                asset_id, float(power), request_id
            )
        return await controller.async_set_requested_current(
            asset_id, float(current), request_id
        )

    hass.services.async_register(
        LEGACY_SCRIPT_DOMAIN,
        LEGACY_EXECUTE,
        legacy_execute,
        schema=vol.Schema(
            {
                vol.Required("command_id"): str,
                vol.Optional("value"): object,
                vol.Optional("request_origin"): str,
                vol.Optional("transaction_id"): str,
            }
        ),
    )
    hass.services.async_register(
        LEGACY_SCRIPT_DOMAIN,
        LEGACY_SETPOINT,
        legacy_setpoint,
        schema=vol.Schema(
            {
                vol.Required("asset_id"): str,
                vol.Optional("requested_power_kw"): vol.Coerce(float),
                vol.Optional("requested_current_a"): vol.Coerce(float),
                vol.Optional("request_origin"): str,
                vol.Optional("transaction_id"): str,
            }
        ),
    )

    try:
        legacy_state.start()
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    except Exception:
        legacy_state.stop()
        for domain, name in (
            (LEGACY_SCRIPT_DOMAIN, LEGACY_EXECUTE),
            (LEGACY_SCRIPT_DOMAIN, LEGACY_SETPOINT),
        ):
            if hass.services.has_service(domain, name):
                hass.services.async_remove(domain, name)
        for name in (
            SERVICE_EXECUTE_COMMAND,
            SERVICE_SET_REQUESTED_POWER,
            SERVICE_REARM_EXECUTION,
        ):
            if hass.services.has_service(DOMAIN, name):
                hass.services.async_remove(DOMAIN, name)
        unregister_provider(hass, publisher_domain=DOMAIN)
        for pid in (
            ENERGY_PROVIDER_ID,
            ENERGY_COMPAT_PROVIDER_ID,
            COMMAND_PROVIDER_ID,
            PUBLIC_RUNTIME_PROVIDER_ID,
            PUBLIC_RUNTIME_COMPAT_PROVIDER_ID,
            EXPERIENCE_PROVIDER_ID,
            ACTIVITY_PROVIDER_ID,
        ):
            interop.pop(pid, None)
        hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
        controller.shutdown()
        manager.clear_all()
        raise
    return True


async def async_unload_entry(hass: Any, entry: Any) -> bool:
    """Unload Mobility and all of its public/provider surfaces cleanly."""
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        data = hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
        if data:
            if data.get("legacy_state"):
                data["legacy_state"].stop()
            if data.get("controller"):
                data["controller"].shutdown()
            if data.get("runtime"):
                data["runtime"].clear_all()
            unregister_provider = data.get("unregister_provider")
            if unregister_provider:
                unregister_provider(hass, publisher_domain=DOMAIN)
        interop = hass.data.get(INTEROP_PROVIDER_REGISTRY_KEY, {})
        for pid in (
            ENERGY_PROVIDER_ID,
            ENERGY_COMPAT_PROVIDER_ID,
            COMMAND_PROVIDER_ID,
            PUBLIC_RUNTIME_PROVIDER_ID,
            PUBLIC_RUNTIME_COMPAT_PROVIDER_ID,
            EXPERIENCE_PROVIDER_ID,
            ACTIVITY_PROVIDER_ID,
        ):
            interop.pop(pid, None)
        for name in (
            SERVICE_EXECUTE_COMMAND,
            SERVICE_SET_REQUESTED_POWER,
            SERVICE_REARM_EXECUTION,
        ):
            if hass.services.has_service(DOMAIN, name):
                hass.services.async_remove(DOMAIN, name)
        for name in (LEGACY_EXECUTE, LEGACY_SETPOINT):
            if hass.services.has_service(LEGACY_SCRIPT_DOMAIN, name):
                hass.services.async_remove(LEGACY_SCRIPT_DOMAIN, name)
    return ok
