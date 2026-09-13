"""Robotix Home Intelligence - Mobility Module.

Package bootstrap stays import-safe. Runtime/Foundation imports are intentionally
local to async_setup_entry so config-flow loading never depends on runtime readiness.
"""
from __future__ import annotations

import logging
from typing import Any

from .const import (
    ACTIVITY_PROVIDER_ID, COMMAND_PROVIDER_ID, DOMAIN, FOUNDATION_DOMAIN_ID,
    ENERGY_COMPAT_PROVIDER_ID, ENERGY_PROVIDER_ID, EXPERIENCE_PROVIDER_ID,
    INTEROP_PROVIDER_REGISTRY_KEY, PUBLIC_RUNTIME_COMPAT_PROVIDER_ID,
    PUBLIC_RUNTIME_PROVIDER_ID, RELEASE, SELECTED_BUILD_INPUT_REGISTRY_KEY,
    SELECTED_BUILD_INPUTS_CHANGED_EVENT, SERVICE_EXECUTE_COMMAND,
    SERVICE_REARM_EXECUTION, SERVICE_SET_REQUESTED_POWER,
)

PLATFORMS=["sensor","number","button","select","text","switch"]
_LOGGER=logging.getLogger(__name__)
_REQUIRED_FOUNDATION_RELEASE="F1.8.1"
_REQUIRED_FOUNDATION_BASELINE="1.8.1"


def _selected_input_payloads(hass: Any) -> list[dict]:
    entry=hass.data.get(SELECTED_BUILD_INPUT_REGISTRY_KEY,{}).get(FOUNDATION_DOMAIN_ID)
    if entry is None: return []
    if isinstance(entry,dict) and entry.get("kind")=="selected_domain_build_input": return [entry]
    if isinstance(entry,(list,tuple)):
        return [x for x in entry if isinstance(x,dict) and x.get("kind")=="selected_domain_build_input"]
    if isinstance(entry,dict):
        candidates=[]
        if isinstance(entry.get("payload"),dict): candidates.append(entry["payload"])
        for key in ("inputs","items","payloads","selected_inputs"):
            rows=entry.get(key)
            if isinstance(rows,(list,tuple)): candidates.extend(x for x in rows if isinstance(x,dict))
        return [x for x in candidates if x.get("kind")=="selected_domain_build_input"]
    return []


async def _async_import_existing_selected_inputs(hass: Any, manager: Any) -> None:
    registry=hass.data.get(SELECTED_BUILD_INPUT_REGISTRY_KEY,{}) or {}
    if FOUNDATION_DOMAIN_ID not in registry: return
    try:
        await manager.async_replace_selected_build_inputs(_selected_input_payloads(hass))
    except Exception as exc:
        _LOGGER.warning("Mobility initial Foundation handoff was rejected; diagnostics retained: %s",exc)


def _idempotent_unload(entry: Any, raw_unsub: Any):
    active=True
    def unsub() -> None:
        nonlocal active
        if not active:
            return
        active=False
        raw_unsub()
    entry.async_on_unload(unsub)
    return unsub


def _install_selected_input_lifecycle(hass: Any, manager: Any, entry: Any):
    """Consume structural Foundation handoffs without feeding status back upstream."""
    async def rebuild(event: Any) -> None:
        if (getattr(event,"data",{}) or {}).get("domain_id")!=FOUNDATION_DOMAIN_ID: return
        try:
            await manager.async_replace_selected_build_inputs(_selected_input_payloads(hass))
            from .projection import async_reconcile_projection
            await async_reconcile_projection(hass,entry.entry_id,set(manager.assets))
        except Exception as exc:
            _LOGGER.warning("Mobility Foundation handoff rebuild rejected; previous runtime retained: %s",exc)
    def changed(event: Any) -> None:
        if (getattr(event,"data",{}) or {}).get("domain_id")==FOUNDATION_DOMAIN_ID:
            hass.async_create_task(rebuild(event))
    return _idempotent_unload(entry,hass.bus.async_listen(SELECTED_BUILD_INPUTS_CHANGED_EVENT,changed))


def _install_domain_configuration_lifecycle(hass: Any, manager: Any, entry: Any):
    """Rebuild only Mobility-owned semantic state when Mobility config changes."""
    from copy import deepcopy
    from .domain_config import GUEST_VEHICLES_KEY
    previous=deepcopy((getattr(entry,"options",{}) or {}).get(GUEST_VEHICLES_KEY,{}))
    async def updated(_hass: Any, updated_entry: Any) -> None:
        nonlocal previous
        current=deepcopy((getattr(updated_entry,"options",{}) or {}).get(GUEST_VEHICLES_KEY,{}))
        if current==previous: return
        previous=current
        await manager.async_replace_selected_build_inputs(_selected_input_payloads(hass))
        from .projection import async_reconcile_projection
        await async_reconcile_projection(hass,entry.entry_id,set(manager.assets))
    add=getattr(entry,"add_update_listener",None)
    if not callable(add): return None
    return _idempotent_unload(entry,add(updated))


def _load_foundation_registry_api() -> dict[str,Any]:
    try:
        from custom_components.rhi_foundation.const import RELEASE as foundation_release, SHARED_BASELINE_VERSION as foundation_baseline
        from custom_components.rhi_foundation.shared_registry import (
            register_domain_build_specification_provider,
            register_domain_supervisory_status_provider,
            unregister_domain_build_specification_provider,
            unregister_domain_supervisory_status_provider,
        )
    except (ImportError,ModuleNotFoundError) as exc:
        try:
            from homeassistant.exceptions import ConfigEntryNotReady
        except ImportError:
            raise RuntimeError("RHI Mobility requires RHI Foundation F1.8.1 / Shared Baseline 1.8.1 before runtime setup") from exc
        raise ConfigEntryNotReady("RHI Mobility requires RHI Foundation F1.8.1 / Shared Baseline 1.8.1. Install/update Foundation and retry setup.") from exc
    if foundation_release != _REQUIRED_FOUNDATION_RELEASE or foundation_baseline != _REQUIRED_FOUNDATION_BASELINE:
        message=("RHI Mobility requires RHI Foundation " f"{_REQUIRED_FOUNDATION_RELEASE} / Shared Baseline {_REQUIRED_FOUNDATION_BASELINE}; " f"loaded Foundation is {foundation_release} / {foundation_baseline}. " "Bindings and supervision are intentionally not started against an incompatible shared contract.")
        try:
            from homeassistant.exceptions import ConfigEntryNotReady
        except ImportError as exc: raise RuntimeError(message) from exc
        raise ConfigEntryNotReady(message)
    return {"register_build":register_domain_build_specification_provider,"unregister_build":unregister_domain_build_specification_provider,"register_supervision":register_domain_supervisory_status_provider,"unregister_supervision":unregister_domain_supervisory_status_provider}


async def async_setup_entry(hass: Any, entry: Any) -> bool:
    import voluptuous as vol
    from .commands.controller import MobilityControlController
    from .commands.interop import MobilityCommandProvider
    from .compat_v1 import MobilityV1Facade
    from .compat_v1.services import collision_ids as legacy_service_collisions, register_services as register_legacy_services, unregister_services as unregister_legacy_services
    from .compat_v1.quiescent_publisher import MobilityV1StatePublisher
    from .domain_config import MobilityDomainConfiguration
    from .device_surfaces import MobilityDeviceSurfaceProvider, MobilitySourceDiagnosticsProvider
    from .energy import MobilityEnergyV2Provider
    from .interop import MobilityEnergyReadOnlyProvider
    from .model_registry import MobilityModelRegistry
    from .property_projection import MobilityPropertyProjection
    from .publication import MobilityBuildSpecificationProvider
    from .public_runtime import MobilityActivityProvider,MobilityExperienceProvider,MobilityPublicRuntimeProvider
    from .runtime.manager import MobilityRuntimeManager
    from .supervision import MobilityDomainSupervisoryStatusProvider

    foundation_api=_load_foundation_registry_api()
    registry=MobilityModelRegistry(); provider=MobilityBuildSpecificationProvider(registry)
    domain_config=MobilityDomainConfiguration(hass,entry); manager=MobilityRuntimeManager(hass,registry,domain_config)
    controller=MobilityControlController(hass,manager,registry); public_provider=MobilityPublicRuntimeProvider(manager,controller,registry)
    property_projection=MobilityPropertyProjection(hass,manager,controller,public_provider); energy_provider=MobilityEnergyV2Provider(manager,controller,registry,public_provider)
    energy_compat_provider=MobilityEnergyReadOnlyProvider(manager,registry,controller,public_provider); command_provider=MobilityCommandProvider(controller)
    experience_provider=MobilityExperienceProvider(public_provider,registry); activity_provider=MobilityActivityProvider(manager,controller)
    legacy_facade=MobilityV1Facade(projection=property_projection,public_provider=public_provider,command_provider=command_provider,experience_provider=experience_provider,activity_provider=activity_provider,energy_provider=energy_provider,registry=registry)
    supervision_provider=MobilityDomainSupervisoryStatusProvider(manager=manager,controller=controller,public_provider=public_provider,experience_provider=experience_provider,compatibility_facade=legacy_facade,build_spec_provider=provider,release=RELEASE)
    source_diagnostics_provider=MobilitySourceDiagnosticsProvider(manager,public_provider); device_surface_provider=MobilityDeviceSurfaceProvider(supervision_provider,experience_provider)
    legacy_facade.supervision=supervision_provider
    legacy_state=MobilityV1StatePublisher(hass,legacy_facade,subscribe_runtime=getattr(manager,'add_runtime_listener',manager.add_listener),subscribe_control=controller.add_listener)

    collisions=legacy_state.collision_ids(); script_collisions=legacy_service_collisions(hass)
    if collisions or script_collisions:
        details=[]
        if collisions: details.append("legacy entity states active: "+",".join(collisions))
        if script_collisions: details.append("legacy script services active: "+",".join(script_collisions))
        controller.shutdown(); manager.clear_all()
        raise RuntimeError("R43.2.65 must be disabled before exact V2 facade takeover; "+"; ".join(details))

    await domain_config.async_initialize()
    interop=hass.data.setdefault(INTEROP_PROVIDER_REGISTRY_KEY,{})
    interop_ids=(ENERGY_PROVIDER_ID,ENERGY_COMPAT_PROVIDER_ID,COMMAND_PROVIDER_ID,PUBLIC_RUNTIME_PROVIDER_ID,PUBLIC_RUNTIME_COMPAT_PROVIDER_ID,EXPERIENCE_PROVIDER_ID,ACTIVITY_PROVIDER_ID)
    service_names=(SERVICE_EXECUTE_COMMAND,SERVICE_SET_REQUESTED_POWER,SERVICE_REARM_EXECUTION)
    selected_unsub=None; config_unsub=None; setup_data=None
    build_registration_attempted=False; supervision_registration_attempted=False; legacy_services_registered=False; platforms_forward_started=False

    async def execute_command(call: Any): return await command_provider.async_execute({"asset_id":call.data["asset_id"],"command_key":call.data["command_key"],"request_id":call.data.get("request_id")})
    async def set_requested_power(call: Any): return await command_provider.async_set_requested_power({"asset_id":call.data["asset_id"],"power_kw":call.data["power_kw"],"request_id":call.data.get("request_id")})
    async def rearm_execution(call: Any): return await controller.async_rearm(call.data["asset_id"],call.data["conflict_family"])

    try:
        setup_data={"registry":registry,"provider":provider,"runtime":manager,"controller":controller,"domain_config":domain_config,"energy_provider":energy_provider,"energy_compat_provider":energy_compat_provider,"command_provider":command_provider,"public_provider":public_provider,"experience_provider":experience_provider,"activity_provider":activity_provider,"property_projection":property_projection,"supervision_provider":supervision_provider,"source_diagnostics_provider":source_diagnostics_provider,"device_surface_provider":device_surface_provider,"compatibility_provider":legacy_facade,"legacy_facade":legacy_facade,"legacy_state":legacy_state,"unregister_provider":foundation_api["unregister_build"],"unregister_supervision":foundation_api["unregister_supervision"]}
        hass.data.setdefault(DOMAIN,{})[entry.entry_id]=setup_data
        selected_unsub=_install_selected_input_lifecycle(hass,manager,entry); setup_data["selected_unsub"]=selected_unsub
        build_registration_attempted=True
        foundation_api["register_build"](hass,publisher_domain=DOMAIN,provider=provider,publication_revision=provider.publication_revision)
        await _async_import_existing_selected_inputs(hass,manager)
        from .projection import async_reconcile_projection
        await async_reconcile_projection(hass,entry.entry_id,set(manager.assets))
        supervision_registration_attempted=True
        foundation_api["register_supervision"](hass,domain_id=FOUNDATION_DOMAIN_ID,publisher_domain=DOMAIN,provider=supervision_provider)
        config_unsub=_install_domain_configuration_lifecycle(hass,manager,entry); setup_data["config_unsub"]=config_unsub
        interop.update({ENERGY_PROVIDER_ID:energy_provider,ENERGY_COMPAT_PROVIDER_ID:energy_compat_provider,COMMAND_PROVIDER_ID:command_provider,PUBLIC_RUNTIME_PROVIDER_ID:public_provider,PUBLIC_RUNTIME_COMPAT_PROVIDER_ID:legacy_facade,EXPERIENCE_PROVIDER_ID:experience_provider,ACTIVITY_PROVIDER_ID:activity_provider})
        hass.services.async_register(DOMAIN,SERVICE_EXECUTE_COMMAND,execute_command,schema=vol.Schema({vol.Required("asset_id"):str,vol.Required("command_key"):str,vol.Optional("request_id"):str}))
        hass.services.async_register(DOMAIN,SERVICE_SET_REQUESTED_POWER,set_requested_power,schema=vol.Schema({vol.Required("asset_id"):str,vol.Required("power_kw"):vol.Coerce(float),vol.Optional("request_id"):str}))
        hass.services.async_register(DOMAIN,SERVICE_REARM_EXECUTION,rearm_execution,schema=vol.Schema({vol.Required("asset_id"):str,vol.Required("conflict_family"):str}))
        legacy_services_registered=True; register_legacy_services(hass,legacy_facade,command_provider)
        platforms_forward_started=True; await hass.config_entries.async_forward_entry_setups(entry,PLATFORMS)
        legacy_state.start(); return True
    except Exception:
        try: legacy_state.stop()
        except Exception: _LOGGER.exception("Mobility setup rollback: V1 state cleanup failed")
        if platforms_forward_started:
            try: await hass.config_entries.async_unload_platforms(entry,PLATFORMS)
            except Exception: _LOGGER.exception("Mobility setup rollback: platform cleanup failed")
        if legacy_services_registered:
            try: unregister_legacy_services(hass)
            except Exception: _LOGGER.exception("Mobility setup rollback: legacy service cleanup failed")
        for name in service_names:
            try:
                if hass.services.has_service(DOMAIN,name): hass.services.async_remove(DOMAIN,name)
            except Exception: _LOGGER.exception("Mobility setup rollback: service cleanup failed for %s",name)
        for pid in interop_ids: interop.pop(pid,None)
        for unsub,label in ((config_unsub,"config"),(selected_unsub,"SDBI")):
            if unsub:
                try: unsub()
                except Exception: _LOGGER.exception("Mobility setup rollback: %s listener cleanup failed",label)
        if supervision_registration_attempted:
            try: foundation_api["unregister_supervision"](hass,domain_id=FOUNDATION_DOMAIN_ID,publisher_domain=DOMAIN)
            except Exception: _LOGGER.exception("Mobility setup rollback: supervision cleanup failed")
        if build_registration_attempted:
            try: foundation_api["unregister_build"](hass,publisher_domain=DOMAIN)
            except Exception: _LOGGER.exception("Mobility setup rollback: build-provider cleanup failed")
        try: controller.shutdown()
        except Exception: _LOGGER.exception("Mobility setup rollback: controller cleanup failed")
        try: manager.clear_all()
        except Exception: _LOGGER.exception("Mobility setup rollback: runtime cleanup failed")
        hass.data.get(DOMAIN,{}).pop(entry.entry_id,None); raise


async def async_unload_entry(hass: Any, entry: Any) -> bool:
    ok=await hass.config_entries.async_unload_platforms(entry,PLATFORMS)
    if ok:
        data=hass.data.get(DOMAIN,{}).get(entry.entry_id)
        if data:
            # Close inbound lifecycle callbacks first. Provider unregister can itself cause
            # Foundation structural activity; no handoff may re-enter a runtime being torn down.
            for key in ("config_unsub","selected_unsub"):
                unsub=data.get(key)
                if unsub: unsub()
            if data.get("legacy_state"): data["legacy_state"].stop()
            if data.get("controller"): data["controller"].shutdown()
            if data.get("runtime"): data["runtime"].clear_all()
            if data.get("unregister_supervision"): data["unregister_supervision"](hass,domain_id=FOUNDATION_DOMAIN_ID,publisher_domain=DOMAIN)
            if data.get("unregister_provider"): data["unregister_provider"](hass,publisher_domain=DOMAIN)
        hass.data.get(DOMAIN,{}).pop(entry.entry_id,None)
        interop=hass.data.get(INTEROP_PROVIDER_REGISTRY_KEY,{})
        for pid in (ENERGY_PROVIDER_ID,ENERGY_COMPAT_PROVIDER_ID,COMMAND_PROVIDER_ID,PUBLIC_RUNTIME_PROVIDER_ID,PUBLIC_RUNTIME_COMPAT_PROVIDER_ID,EXPERIENCE_PROVIDER_ID,ACTIVITY_PROVIDER_ID): interop.pop(pid,None)
        for name in (SERVICE_EXECUTE_COMMAND,SERVICE_SET_REQUESTED_POWER,SERVICE_REARM_EXECUTION):
            if hass.services.has_service(DOMAIN,name): hass.services.async_remove(DOMAIN,name)
        from .compat_v1.services import unregister_services as unregister_legacy_services
        unregister_legacy_services(hass)
    return ok
