"""Robotix Home Intelligence - Mobility Module.

Package bootstrap stays import-safe. Runtime/Foundation imports are intentionally
local to async_setup_entry so config-flow loading never depends on runtime readiness.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import logging
from time import perf_counter
from typing import Any

from .const import (
    ACTIVITY_PROVIDER_ID, COMMAND_PROVIDER_ID, DOMAIN, FOUNDATION_DOMAIN_ID,
    ENERGY_PROVIDER_ID, EXPERIENCE_PROVIDER_ID,
    INTEROP_PROVIDER_REGISTRY_KEY,
    PUBLIC_RUNTIME_PROVIDER_ID, PROFILE_CATALOG_PROVIDER_ID, POLICY_PROVIDER_ID, RELEASE, SELECTED_BUILD_INPUT_REGISTRY_KEY,
    SELECTED_BUILD_INPUTS_CHANGED_EVENT, SERVICE_EXECUTE_COMMAND,
    SERVICE_REARM_EXECUTION, SERVICE_SET_POLICY, SERVICE_SET_REQUESTED_POWER,
    SUPERVISION_PROVIDER_ID,
)

PLATFORMS=["sensor","number","button","select","text","switch"]
_LOGGER=logging.getLogger(__name__)
def _selected_input_registry_present(hass: Any) -> bool:
    registry=hass.data.get(SELECTED_BUILD_INPUT_REGISTRY_KEY,{}) or {}
    return isinstance(registry,dict) and FOUNDATION_DOMAIN_ID in registry


def _selected_input_revision_token(hass: Any) -> tuple:
    """Return a cheap deterministic token for Foundation structural handoff identity."""
    rows = _selected_input_payloads(hass)
    token = []
    for row in rows:
        selection = row.get("selection") or {}
        token.append((
            str(row.get("builder_id") or ""),
            str(selection.get("integration_domain") or ""),
            tuple(sorted(str(value) for value in (selection.get("selected_device_ids") or []))),
            int(row.get("configuration_revision") or 0),
            int(row.get("candidate_revision") or 0),
            int(row.get("build_input_revision") or 0),
            int(selection.get("publication_revision") or 0),
            str(selection.get("configured_specification_fingerprint") or ""),
            str(selection.get("current_specification_fingerprint") or ""),
        ))
    return tuple(sorted(token))


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


def _mark_selected_input_gap(manager: Any, reason: str) -> None:
    """Retain last-good runtime when Foundation handoff storage is transiently absent."""
    state=dict(getattr(manager,"last_build_attempt",{}) or {})
    state.update({
        "status":"STALE",
        "observed_at":datetime.now(timezone.utc).isoformat(),
        "reason":reason,
        "retained_previous_runtime":bool(getattr(manager,"assets",{})),
    })
    manager.last_build_attempt=state
    notify=getattr(manager,"_notify",None)
    if callable(notify): notify()


def _record_handoff_exception(manager: Any, exc: Exception) -> None:
    """Never leave an attempted Foundation handoff looking like it never ran."""
    state=dict(getattr(manager,"last_build_attempt",{}) or {})
    if state.get("status") in {None,"WAITING_FOR_FOUNDATION","WAITING_FOR_FOUNDATION_REFRESH"}:
        state.update({
            "status":"REJECTED",
            "observed_at":datetime.now(timezone.utc).isoformat(),
            "error_type":type(exc).__name__,
            "error":str(exc),
            "retained_previous_runtime":bool(getattr(manager,"assets",{})),
        })
        manager.last_build_attempt=state
        notify=getattr(manager,"_notify",None)
        if callable(notify): notify()


async def _async_import_existing_selected_inputs(hass: Any, manager: Any) -> bool:
    registry=hass.data.get(SELECTED_BUILD_INPUT_REGISTRY_KEY,{}) or {}
    if FOUNDATION_DOMAIN_ID not in registry:
        manager.last_build_attempt={
            "status":"WAITING_FOR_FOUNDATION_REFRESH",
            "observed_at":datetime.now(timezone.utc).isoformat(),
            "reason":"selected_domain_build_input_not_yet_published",
            "retained_previous_runtime":bool(getattr(manager,"assets",{})),
        }
        notify=getattr(manager,"_notify",None)
        if callable(notify): notify()
        return False
    try:
        await manager.async_replace_selected_build_inputs(_selected_input_payloads(hass))
        manager._last_selected_input_revision_token = _selected_input_revision_token(hass)
        return True
    except Exception as exc:
        _record_handoff_exception(manager,exc)
        _LOGGER.warning("Mobility initial Foundation handoff was rejected; diagnostics retained: %s",exc)
        return False


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


def _install_selected_input_lifecycle(hass: Any, manager: Any, entry: Any, on_rebuilt=None):
    """Consume structural Foundation handoffs serially from the authoritative registry."""
    structural_lock=asyncio.Lock()

    async def changed(event: Any) -> None:
        data=getattr(event,"data",{}) or {}
        if data.get("domain_id")!=FOUNDATION_DOMAIN_ID:
            return
        reason=str(data.get("reason") or "refreshed")
        async with structural_lock:
            registry_present=_selected_input_registry_present(hass)
            if reason!="removed" and not registry_present:
                _mark_selected_input_gap(manager,f"foundation_event_registry_gap:{reason}")
                _LOGGER.warning("Mobility retained last-good runtime because Foundation handoff storage is temporarily absent; reason=%s",reason)
                return
            try:
                payloads=_selected_input_payloads(hass) if registry_present else []
                handoff_token=_selected_input_revision_token(hass)
                if getattr(manager, "_last_selected_input_revision_token", None) == handoff_token:
                    return
                await manager.async_replace_selected_build_inputs(payloads)
                manager._last_selected_input_revision_token = handoff_token
                from .projection import async_reconcile_projection
                await async_reconcile_projection(
                    hass,
                    entry.entry_id,
                    set(manager.assets),
                    {
                        asset_id
                        for asset_id in manager.assets
                        if str(
                            manager.configuration_value(
                                asset_id, "asset.lifecycle_status", "active"
                            )
                            or "active"
                        ).lower()
                        == "disabled"
                    },
                )
                if callable(on_rebuilt): on_rebuilt()
            except Exception as exc:
                _record_handoff_exception(manager,exc)
                _LOGGER.warning("Mobility Foundation handoff rebuild rejected; previous runtime retained: %s",exc)

    return _idempotent_unload(entry,hass.bus.async_listen(SELECTED_BUILD_INPUTS_CHANGED_EVENT,changed))


def _install_domain_configuration_lifecycle(hass: Any, manager: Any, entry: Any, on_rebuilt=None):
    """Rebuild only Mobility-owned semantic state when Mobility config changes."""
    from copy import deepcopy
    from .domain_config import GUEST_VEHICLES_KEY
    previous=deepcopy((getattr(entry,"options",{}) or {}).get(GUEST_VEHICLES_KEY,{}))
    async def updated(_hass: Any, updated_entry: Any) -> None:
        nonlocal previous
        current=deepcopy((getattr(updated_entry,"options",{}) or {}).get(GUEST_VEHICLES_KEY,{}))
        if current==previous: return
        previous=current
        if not _selected_input_registry_present(hass):
            _mark_selected_input_gap(manager,"domain_configuration_changed_while_foundation_handoff_missing")
            _LOGGER.warning("Mobility retained last-good runtime because semantic configuration changed while Foundation handoff storage was absent")
            return
        await manager.async_replace_selected_build_inputs(_selected_input_payloads(hass))
        from .projection import async_reconcile_projection
        await async_reconcile_projection(
            hass,
            entry.entry_id,
            set(manager.assets),
            {
                asset_id
                for asset_id in manager.assets
                if str(manager.configuration_value(asset_id, "asset.lifecycle_status", "active") or "active").lower() == "disabled"
            },
        )
        if callable(on_rebuilt): on_rebuilt()
    add=getattr(entry,"add_update_listener",None)
    if not callable(add): return None
    return _idempotent_unload(entry,add(updated))


def _load_foundation_registry_api(hass: Any) -> dict[str,Any]:
    """Load the Foundation public registry by capability, never by exact release identity."""
    try:
        from custom_components.rhi_foundation import shared_registry as foundation_registry
        try:
            from custom_components.rhi_foundation.const import RELEASE as foundation_release
        except (ImportError, ModuleNotFoundError):
            foundation_release = "UNKNOWN"
        try:
            from custom_components.rhi_foundation.const import SHARED_BASELINE_VERSION as foundation_baseline
        except (ImportError, ModuleNotFoundError):
            foundation_baseline = "UNKNOWN"
        try:
            from custom_components.rhi_foundation import visual_asset_registry as foundation_visual_registry
        except (ImportError, ModuleNotFoundError):
            foundation_visual_registry = None
    except (ImportError, ModuleNotFoundError) as exc:
        try:
            from homeassistant.exceptions import ConfigEntryNotReady
        except ImportError:
            raise RuntimeError("RHI Mobility requires the RHI Foundation public shared-registry capability") from exc
        raise ConfigEntryNotReady(
            "RHI Mobility requires RHI Foundation with the public shared-registry capability. "
            "Install/update Foundation and retry setup."
        ) from exc

    required = {
        "register_build": getattr(foundation_registry, "register_domain_build_specification_provider", None),
        "unregister_build": getattr(foundation_registry, "unregister_domain_build_specification_provider", None),
        "register_supervision": getattr(foundation_registry, "register_domain_supervisory_status_provider", None),
        "unregister_supervision": getattr(foundation_registry, "unregister_domain_supervisory_status_provider", None),
    }
    missing = sorted(name for name, value in required.items() if not callable(value))
    if missing:
        message = (
            "RHI Foundation is present but does not expose the required public shared-registry "
            f"capabilities: {', '.join(missing)}. Release/baseline identity is diagnostic only."
        )
        try:
            from homeassistant.exceptions import ConfigEntryNotReady
        except ImportError as exc:
            raise RuntimeError(message) from exc
        raise ConfigEntryNotReady(message)

    return {
        "release": str(foundation_release),
        "shared_baseline": str(foundation_baseline),
        **required,
        "remove_domain_configuration":getattr(foundation_registry,"async_remove_domain_configuration",None),
        "register_visual":getattr(foundation_visual_registry,"register_visual_asset_catalog_provider",None) if foundation_visual_registry else None,
        "unregister_visual":getattr(foundation_visual_registry,"unregister_visual_asset_catalog_provider",None) if foundation_visual_registry else None,
    }


def _call_registration_unsub(handle: Any) -> bool:
    """Close one generation-owned Foundation registration when the API provides it."""
    if not callable(handle):
        return False
    handle()
    return True


async def async_setup_entry(hass: Any, entry: Any) -> bool:
    setup_started = perf_counter()
    setup_timings_ms: dict[str, float] = {}

    def mark_timing(name: str, started: float) -> float:
        duration = round((perf_counter() - started) * 1000.0, 3)
        setup_timings_ms[name] = duration
        return duration

    imports_started = perf_counter()
    import voluptuous as vol
    from .commands.controller import MobilityControlController
    from .commands.interop import MobilityCommandProvider
    from .domain_config import MobilityDomainConfiguration
    from .device_surfaces import MobilityDeviceSurfaceProvider, MobilitySourceDiagnosticsProvider
    from .energy import MobilityEnergyV2Provider
    from .model_registry import MobilityModelRegistry
    from .property_projection import MobilityPropertyProjection
    from .profile_catalog import MobilityProfileCatalogProvider
    from .policy import MobilityPolicyProvider
    from .product_contract import MobilityProductContractProvider
    from .publication import MobilityBuildSpecificationProvider
    from .public_runtime import MobilityActivityProvider,MobilityExperienceProvider,MobilityPublicRuntimeProvider
    from .runtime.manager import MobilityRuntimeManager
    from .supervision import MobilityDomainSupervisoryStatusProvider, MobilityProductSupervisionProvider
    from .visual_catalog import MobilityVisualAssetCatalogProvider
    mark_timing("runtime_imports", imports_started)

    phase_started=perf_counter()
    foundation_api=_load_foundation_registry_api(hass)
    registry=MobilityModelRegistry(); provider=MobilityBuildSpecificationProvider(registry)
    mark_timing("bootstrap_and_registry", phase_started)
    visual_catalog_provider=MobilityVisualAssetCatalogProvider()
    domain_config=MobilityDomainConfiguration(hass,entry)
    phase_started=perf_counter()
    configuration_migrated=await domain_config.async_initialize()
    mark_timing("domain_config_initialize", phase_started)
    manager=MobilityRuntimeManager(hass,registry,domain_config)
    controller=MobilityControlController(hass,manager,registry); public_provider=MobilityPublicRuntimeProvider(manager,controller,registry)
    profile_catalog_provider=MobilityProfileCatalogProvider(registry)
    policy_provider=MobilityPolicyProvider(domain_config)
    property_projection=MobilityPropertyProjection(hass,manager,controller,public_provider); energy_provider=MobilityEnergyV2Provider(manager,controller,registry,public_provider)
    command_provider=MobilityCommandProvider(controller)
    experience_provider=MobilityExperienceProvider(public_provider,registry,policy_provider); activity_provider=MobilityActivityProvider(manager,controller)
    supervision_provider=MobilityDomainSupervisoryStatusProvider(manager=manager,controller=controller,public_provider=public_provider,experience_provider=experience_provider,build_spec_provider=provider,release=RELEASE)
    product_supervision_provider=MobilityProductSupervisionProvider(supervision_provider,activity_provider)
    product_contract_provider=MobilityProductContractProvider(
        public_provider,
        experience_provider,
        policy_provider,
        command_provider,
        activity_provider,
        profile_catalog_provider,
        product_supervision_provider,
        energy_provider,
    )
    source_diagnostics_provider=MobilitySourceDiagnosticsProvider(manager,public_provider); device_surface_provider=MobilityDeviceSurfaceProvider(supervision_provider,experience_provider)
    interop=hass.data.setdefault(INTEROP_PROVIDER_REGISTRY_KEY,{})
    interop_ids=(ENERGY_PROVIDER_ID,COMMAND_PROVIDER_ID,PUBLIC_RUNTIME_PROVIDER_ID,PROFILE_CATALOG_PROVIDER_ID,POLICY_PROVIDER_ID,EXPERIENCE_PROVIDER_ID,ACTIVITY_PROVIDER_ID,SUPERVISION_PROVIDER_ID)
    service_names=(SERVICE_EXECUTE_COMMAND,SERVICE_SET_REQUESTED_POWER,SERVICE_REARM_EXECUTION,SERVICE_SET_POLICY)
    selected_unsub=None; config_unsub=None; projection_config_unsub=None; setup_data=None
    build_registration_attempted=False; supervision_registered=False; platforms_forward_started=False
    build_registration_unsub=None; supervision_registration_unsub=None; visual_registration_unsub=None

    def close_supervision_registration() -> None:
        nonlocal supervision_registered, supervision_registration_unsub
        if not supervision_registered:
            return
        if not _call_registration_unsub(supervision_registration_unsub):
            foundation_api["unregister_supervision"](hass,domain_id=FOUNDATION_DOMAIN_ID,publisher_domain=DOMAIN)
        supervision_registration_unsub=None
        supervision_registered=False

    def sync_supervision_after_structural_build() -> None:
        """Register shared supervision once for this Mobility load generation."""
        nonlocal supervision_registered, supervision_registration_unsub
        if supervision_registered:
            return
        status=str((getattr(manager,"last_build_attempt",{}) or {}).get("status") or "")
        if status not in {"ACCEPTED","PARTIAL","REMOVED","REJECTED"}:
            return
        handle=foundation_api["register_supervision"](hass,domain_id=FOUNDATION_DOMAIN_ID,publisher_domain=DOMAIN,provider=supervision_provider)
        supervision_registration_unsub=handle if callable(handle) else None
        supervision_registered=True
        if setup_data is not None:
            setup_data["supervision_registration_unsub"]=supervision_registration_unsub

    def sync_publication_after_structural_build() -> None:
        """Converge public projections immediately after a structural runtime rebuild.

        Runtime telemetry remains coalesced/event-driven. Structural asset-set changes are
        different: consumers must not retain a pre-rebuild Mobility->Energy snapshot until
        some unrelated telemetry event happens to arrive.
        """
        sync_supervision_after_structural_build()

    def sync_projection_after_lifecycle_change(asset_id: str, property_key: str) -> None:
        """Reconcile HA device visibility when Mobility lifecycle configuration changes."""
        if property_key != "asset.lifecycle_status":
            return
        from .projection import async_reconcile_projection
        hass.async_create_task(
            async_reconcile_projection(
                hass,
                entry.entry_id,
                set(manager.assets),
                {
                    current_id
                    for current_id in manager.assets
                    if str(
                        manager.configuration_value(
                            current_id, "asset.lifecycle_status", "active"
                        )
                        or "active"
                    ).lower()
                    == "disabled"
                },
            )
        )

    async def execute_command(call: Any): return await command_provider.async_execute({"asset_id":call.data["asset_id"],"command_key":call.data["command_key"],"request_id":call.data.get("request_id")})
    async def set_requested_power(call: Any): return await command_provider.async_set_requested_power({"asset_id":call.data["asset_id"],"power_kw":call.data["power_kw"],"request_id":call.data.get("request_id")})
    async def rearm_execution(call: Any): return await controller.async_rearm(call.data["asset_id"],call.data["conflict_family"])
    async def set_policy(call: Any): return await policy_provider.async_set(call.data["policy_key"],call.data.get("value"))

    try:
        setup_data={"registry":registry,"provider":provider,"runtime":manager,"configuration_migrated":configuration_migrated,"controller":controller,"domain_config":domain_config,"energy_provider":energy_provider,"command_provider":command_provider,"public_provider":public_provider,"profile_catalog_provider":profile_catalog_provider,"policy_provider":policy_provider,"experience_provider":experience_provider,"activity_provider":activity_provider,"product_supervision_provider":product_supervision_provider,"product_contract_provider":product_contract_provider,"property_projection":property_projection,"supervision_provider":supervision_provider,"source_diagnostics_provider":source_diagnostics_provider,"device_surface_provider":device_surface_provider,"visual_catalog_provider":visual_catalog_provider,"unregister_provider":foundation_api["unregister_build"],"unregister_supervision":foundation_api["unregister_supervision"],"unregister_visual":foundation_api.get("unregister_visual"),"build_registration_unsub":None,"supervision_registration_unsub":None,"visual_registration_unsub":None,"setup_timings_ms":setup_timings_ms}
        hass.data.setdefault(DOMAIN,{})[entry.entry_id]=setup_data
        selected_unsub=_install_selected_input_lifecycle(hass,manager,entry,on_rebuilt=sync_publication_after_structural_build); setup_data["selected_unsub"]=selected_unsub
        build_registration_attempted=True
        handle=foundation_api["register_build"](hass,publisher_domain=DOMAIN,provider=provider,publication_revision=provider.publication_revision)
        build_registration_unsub=handle if callable(handle) else None
        setup_data["build_registration_unsub"]=build_registration_unsub
        register_visual=foundation_api.get("register_visual")
        if callable(register_visual):
            visual_handle=register_visual(hass,publisher_domain=DOMAIN,provider=visual_catalog_provider,publication_revision=visual_catalog_provider.publication_revision)
            visual_registration_unsub=visual_handle if callable(visual_handle) else None
            setup_data["visual_registration_unsub"]=visual_registration_unsub
        initial_handoff_token=_selected_input_revision_token(hass)
        phase_started=perf_counter()
        imported=await _async_import_existing_selected_inputs(hass,manager)
        mark_timing("initial_foundation_build", phase_started)
        from .projection import async_reconcile_projection
        phase_started=perf_counter()
        initial_projection=await async_reconcile_projection(
            hass,
            entry.entry_id,
            set(manager.assets),
            {
                asset_id
                for asset_id in manager.assets
                if str(manager.configuration_value(asset_id, "asset.lifecycle_status", "active") or "active").lower() == "disabled"
            },
        )
        mark_timing("initial_projection_sync", phase_started)
        setup_data["projection_metrics"]=dict(initial_projection or {})
        if imported:
            sync_supervision_after_structural_build()
        config_unsub=_install_domain_configuration_lifecycle(hass,manager,entry,on_rebuilt=sync_publication_after_structural_build); setup_data["config_unsub"]=config_unsub
        projection_config_unsub=_idempotent_unload(
            entry,
            domain_config.add_listener(sync_projection_after_lifecycle_change),
        )
        setup_data["projection_config_unsub"]=projection_config_unsub
        interop.update({ENERGY_PROVIDER_ID:energy_provider,COMMAND_PROVIDER_ID:command_provider,PUBLIC_RUNTIME_PROVIDER_ID:public_provider,PROFILE_CATALOG_PROVIDER_ID:profile_catalog_provider,POLICY_PROVIDER_ID:policy_provider,EXPERIENCE_PROVIDER_ID:experience_provider,ACTIVITY_PROVIDER_ID:activity_provider,SUPERVISION_PROVIDER_ID:product_supervision_provider})
        hass.services.async_register(DOMAIN,SERVICE_EXECUTE_COMMAND,execute_command,schema=vol.Schema({vol.Required("asset_id"):str,vol.Required("command_key"):str,vol.Optional("request_id"):str}))
        hass.services.async_register(DOMAIN,SERVICE_SET_REQUESTED_POWER,set_requested_power,schema=vol.Schema({vol.Required("asset_id"):str,vol.Required("power_kw"):vol.Coerce(float),vol.Optional("request_id"):str}))
        hass.services.async_register(DOMAIN,SERVICE_REARM_EXECUTION,rearm_execution,schema=vol.Schema({vol.Required("asset_id"):str,vol.Required("conflict_family"):str}))
        hass.services.async_register(DOMAIN,SERVICE_SET_POLICY,set_policy,schema=vol.Schema({
            vol.Required("policy_key"):str,
            vol.Required("value"):lambda value: value,
        }))
        from .entity_registry_migration import migrate_canonical_v2_entity_ids
        phase_started=perf_counter()
        setup_data["v2_entity_id_migrations"] = migrate_canonical_v2_entity_ids(hass, entry.entry_id)
        mark_timing("entity_registry_migration", phase_started)
        phase_started=perf_counter()
        platforms_forward_started=True; await hass.config_entries.async_forward_entry_setups(entry,PLATFORMS)
        mark_timing("platform_setup", phase_started)

        # Foundation may legitimately republish during Mobility platform setup.
        # created. Rebuild only when the structural handoff revision actually changed.
        # M0.10.5 rebuilt unconditionally here, doubling semantic startup work.
        post_platform_handoff_token=_selected_input_revision_token(hass)
        applied_handoff_token=getattr(manager, "_last_selected_input_revision_token", None)
        convergence_rebuild_required=applied_handoff_token != post_platform_handoff_token
        if convergence_rebuild_required:
            phase_started=perf_counter()
            converged=await _async_import_existing_selected_inputs(hass,manager)
            mark_timing("convergence_foundation_build", phase_started)
        else:
            converged=imported
            setup_timings_ms["convergence_foundation_build"]=0.0
        setup_data["startup_convergence_rebuild_required"]=convergence_rebuild_required
        setup_data["startup_handoff_revision_changed"]=post_platform_handoff_token != initial_handoff_token

        phase_started=perf_counter()
        final_projection=await async_reconcile_projection(
            hass,
            entry.entry_id,
            set(manager.assets),
            {
                asset_id
                for asset_id in manager.assets
                if str(manager.configuration_value(asset_id, "asset.lifecycle_status", "active") or "active").lower() == "disabled"
            },
        )
        mark_timing("final_projection_sync", phase_started)
        setup_data["projection_metrics"]=dict(final_projection or {})
        if converged:
            sync_supervision_after_structural_build()
        setup_timings_ms["total_setup"]=round((perf_counter()-setup_started)*1000.0,3)
        setup_data["setup_metrics"]={
            "selected_input_count": len(_selected_input_payloads(hass)),
            "asset_count": len(manager.assets),
        }
        return True
    except Exception:
        if platforms_forward_started:
            try: await hass.config_entries.async_unload_platforms(entry,PLATFORMS)
            except Exception: _LOGGER.exception("Mobility setup rollback: platform cleanup failed")
        for name in service_names:
            try:
                if hass.services.has_service(DOMAIN,name): hass.services.async_remove(DOMAIN,name)
            except Exception: _LOGGER.exception("Mobility setup rollback: service cleanup failed for %s",name)
        for pid in interop_ids: interop.pop(pid,None)
        for unsub,label in ((projection_config_unsub,"projection-config"),(config_unsub,"config"),(selected_unsub,"SDBI")):
            if unsub:
                try: unsub()
                except Exception: _LOGGER.exception("Mobility setup rollback: %s listener cleanup failed",label)
        if supervision_registered:
            try: close_supervision_registration()
            except Exception: _LOGGER.exception("Mobility setup rollback: supervision cleanup failed")
        if visual_registration_unsub:
            try: _call_registration_unsub(visual_registration_unsub)
            except Exception: _LOGGER.exception("Mobility setup rollback: visual-provider cleanup failed")
        if build_registration_attempted:
            try:
                if not _call_registration_unsub(build_registration_unsub):
                    foundation_api["unregister_build"](hass,publisher_domain=DOMAIN)
            except Exception: _LOGGER.exception("Mobility setup rollback: build-provider cleanup failed")
        try: controller.shutdown()
        except Exception: _LOGGER.exception("Mobility setup rollback: controller cleanup failed")
        try: manager.clear_all()
        except Exception: _LOGGER.exception("Mobility setup rollback: runtime cleanup failed")
        hass.data.get(DOMAIN,{}).pop(entry.entry_id,None); raise


async def async_unload_entry(hass: Any, entry: Any) -> bool:
    data=hass.data.get(DOMAIN,{}).get(entry.entry_id)
    if data:
        for key in ("projection_config_unsub","config_unsub","selected_unsub"):
            unsub=data.get(key)
            if unsub: unsub()
        if data.get("controller"): data["controller"].shutdown()
        if data.get("runtime"): data["runtime"].clear_all()

    ok=await hass.config_entries.async_unload_platforms(entry,PLATFORMS)
    if ok:
        if data:
            supervision_unsub=data.get("supervision_registration_unsub")
            if not _call_registration_unsub(supervision_unsub) and data.get("unregister_supervision"):
                data["unregister_supervision"](hass,domain_id=FOUNDATION_DOMAIN_ID,publisher_domain=DOMAIN)
            visual_unsub=data.get("visual_registration_unsub")
            if not _call_registration_unsub(visual_unsub) and data.get("unregister_visual"):
                data["unregister_visual"](hass,publisher_domain=DOMAIN)
            build_unsub=data.get("build_registration_unsub")
            if not _call_registration_unsub(build_unsub) and data.get("unregister_provider"):
                data["unregister_provider"](hass,publisher_domain=DOMAIN)
        hass.data.get(DOMAIN,{}).pop(entry.entry_id,None)
        interop=hass.data.get(INTEROP_PROVIDER_REGISTRY_KEY,{})
        for pid in (ENERGY_PROVIDER_ID,COMMAND_PROVIDER_ID,PUBLIC_RUNTIME_PROVIDER_ID,PROFILE_CATALOG_PROVIDER_ID,POLICY_PROVIDER_ID,EXPERIENCE_PROVIDER_ID,ACTIVITY_PROVIDER_ID,SUPERVISION_PROVIDER_ID): interop.pop(pid,None)
        for name in (SERVICE_EXECUTE_COMMAND,SERVICE_SET_REQUESTED_POWER,SERVICE_REARM_EXECUTION,SERVICE_SET_POLICY):
            if hass.services.has_service(DOMAIN,name): hass.services.async_remove(DOMAIN,name)
    return ok


async def async_remove_entry(hass: Any, entry: Any) -> None:
    """Remove only Mobility-scoped Foundation technical intent on genuine deletion."""
    foundation_api=_load_foundation_registry_api(hass)
    remove=foundation_api.get("remove_domain_configuration")
    if callable(remove):
        await remove(hass,domain_id=FOUNDATION_DOMAIN_ID,publisher_domain=DOMAIN)