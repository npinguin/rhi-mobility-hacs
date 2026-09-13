from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .const import DOMAIN, RELEASE

MOBILITY_REPOSITORY_URL = "https://github.com/npinguin/rhi-mobility"


def _device_url(device_id: str | None) -> str | None:
    if not device_id:
        return None
    return f"homeassistant://navigate/config/devices/device/{device_id}"


def _integration_url(integration_domain: str | None) -> str | None:
    if not integration_domain:
        return None
    return f"homeassistant://navigate/config/integrations/integration/{integration_domain}"


def _integration_docs_url(integration_domain: str | None) -> str | None:
    if not integration_domain:
        return None
    return f"https://www.home-assistant.io/integrations/{integration_domain}"


@dataclass(frozen=True, slots=True)
class SourceDiagnosticSummary:
    asset_id: str
    integration: str | None
    device_name: str | None
    device_registry_id: str | None
    config_entry_id: str | None
    status: str
    binding_count: int
    capability_issue_count: int
    observed_at: str | None

    def as_dict(self) -> dict[str, Any]:
        return {
            "asset_id": self.asset_id,
            "integration": self.integration,
            "device_name": self.device_name,
            "device_registry_id": self.device_registry_id,
            "config_entry_id": self.config_entry_id,
            "status": self.status,
            "binding_count": self.binding_count,
            "capability_issue_count": self.capability_issue_count,
            "observed_at": self.observed_at,
            "source_device_url": _device_url(self.device_registry_id),
            "source_integration_url": _integration_url(self.integration),
            "source_integration_documentation_url": _integration_docs_url(self.integration),
            "mobility_repository_url": MOBILITY_REPOSITORY_URL,
            "owner": DOMAIN,
            "authority": "AcceptedSourceBinding",
        }


class MobilitySourceDiagnosticsProvider:
    """Mobility-owned compact provenance surface for HA diagnostics.

    Only navigation/debug essentials are public here. Detailed candidate matching,
    normalization and binding evidence stays in HA diagnostics and Mobility supervisory
    details, preventing diagnostic entities from becoming a second source model.
    """

    CONTRACT_ID = "MOBILITY_SOURCE_DIAGNOSTICS_V1"
    _PROBLEM_STATUSES = frozenset({
        "MISSING", "AMBIGUOUS", "INVALID_EVIDENCE", "BLOCKED_BY_REVIEW",
        "BLOCKED_BY_TARGET_SCOPE", "STALE", "UNAVAILABLE", "NORMALIZATION_ERROR",
        "CARDINALITY_ERROR", "REJECTED_REVIEW_REQUIRED",
    })

    def __init__(self, manager: Any, public_provider: Any) -> None:
        self.manager = manager
        self.public = public_provider

    def asset(self, asset_id: str) -> SourceDiagnosticSummary | None:
        asset = self.manager.assets.get(asset_id)
        if asset is None:
            return None
        metadata_fn = getattr(self.manager, "primary_source_metadata", None)
        metadata = dict(metadata_fn(asset_id) or {}) if callable(metadata_fn) else {}
        snap = self.manager.snapshots.get(asset_id)
        binding_count = len(getattr(asset, "source_bindings", {}) or {})
        capability_issues = [
            row for row in (getattr(self.manager, "_capability_diagnostics", ()) or ())
            if isinstance(row, dict)
            and str(row.get("asset_id") or "") == asset_id
            and str(row.get("status") or "").upper() in self._PROBLEM_STATUSES
        ]
        if binding_count == 0:
            status = "UNBOUND"
        elif capability_issues:
            status = "PARTIAL"
        else:
            status = "ACTIVE"
        observed_at = None
        if asset.concept_id == "charger":
            observed_at = self.public.property_value(asset_id, "charger.observed_at")
        elif snap is not None:
            for key in ("vehicle.last_seen", "vehicle.source_timestamp", "vehicle.source_vehicle_clock"):
                value = self.public.property_value(asset_id, key)
                if value not in (None, ""):
                    observed_at = str(value)
                    break
        return SourceDiagnosticSummary(
            asset_id=asset_id,
            integration=str(metadata.get("integration_domain") or asset.source_integration_domain or "") or None,
            device_name=str(metadata.get("device_name") or "") or None,
            device_registry_id=str(metadata.get("device_id") or asset.source_device_id or "") or None,
            config_entry_id=str(metadata.get("config_entry_id") or asset.source_config_entry_id or "") or None,
            status=status,
            binding_count=binding_count,
            capability_issue_count=len(capability_issues),
            observed_at=None if observed_at is None else str(observed_at),
        )


class MobilityDeviceSurfaceProvider:
    """Backend-owned logical device surfaces for supervision and broad intelligence.

    Foundation-level supervision is generic technical readiness only. Mobility
    intelligence is derived exclusively from Mobility experience/business semantics and
    never from the shared Foundation supervisory contract.
    """

    CONTRACT_ID = "MOBILITY_DEVICE_SURFACES_V1"

    def __init__(self, supervision_provider: Any, experience_provider: Any) -> None:
        self.supervision = supervision_provider
        self.experience = experience_provider

    @staticmethod
    def _family_state(rows: list[dict[str, Any]]) -> tuple[str, int, int]:
        warning = 0
        unknown = 0
        evidence = 0
        for row in rows:
            for key, value in row.items():
                if not key.endswith("_intelligence") or not isinstance(value, dict):
                    continue
                quality = str(value.get("source_quality") or "missing").lower()
                state = str(value.get("state") or "unknown").lower()
                severity = str(value.get("severity") or "unknown").lower()
                if quality != "missing":
                    evidence += 1
                if severity in {"warning", "error", "critical"} or state in {"attention", "fault", "blocked"}:
                    warning += 1
                elif state == "unknown" or quality == "missing":
                    unknown += 1
        if warning:
            return "ATTENTION", warning, unknown
        if evidence == 0 or unknown:
            return "LIMITED", warning, unknown
        return "READY", warning, unknown

    def snapshot(self) -> dict[str, Any]:
        supervision = dict(self.supervision.snapshot() or {})
        experience = dict(self.experience.snapshot() or {})
        vehicles = list(experience.get("vehicles") or [])
        chargers = list(experience.get("chargers") or [])
        vehicle_state, vehicle_warnings, vehicle_unknown = self._family_state(vehicles)
        charger_state, charger_warnings, charger_unknown = self._family_state(chargers)
        if not vehicles and not chargers:
            mobility_intelligence_state = "CONFIGURATION_REQUIRED"
        elif "ATTENTION" in {vehicle_state, charger_state}:
            mobility_intelligence_state = "ATTENTION"
        elif "LIMITED" in {vehicle_state, charger_state}:
            mobility_intelligence_state = "LIMITED"
        else:
            mobility_intelligence_state = "READY"
        return {
            "contract_id": self.CONTRACT_ID,
            "owner": DOMAIN,
            "ha_projection_inference": False,
            "mobility": {
                "state": supervision.get("overall_domain_readiness") or "UNKNOWN",
                "contract_id": supervision.get("contract_id"),
                "release": RELEASE,
                "configuration_status": supervision.get("configuration_status"),
                "contract_status": supervision.get("contract_status"),
                "build_status": supervision.get("build_status"),
                "runtime_status": supervision.get("runtime_status"),
                "issue_count": supervision.get("issue_count", 0),
                "blocking_issue_count": supervision.get("blocking_issue_count", 0),
                "warning_count": supervision.get("warning_count", 0),
                "mobility_repository_url": MOBILITY_REPOSITORY_URL,
            },
            "mobility_intelligence": {
                "state": mobility_intelligence_state,
                "source_contract": "MOBILITY_EXPERIENCE_V2",
                "vehicle_count": len(vehicles),
                "charger_count": len(chargers),
                "vehicle_state": vehicle_state,
                "charger_state": charger_state,
                "mobility_repository_url": MOBILITY_REPOSITORY_URL,
            },
            "vehicle_intelligence": {
                "state": vehicle_state,
                "source_contract": "MOBILITY_EXPERIENCE_V2",
                "asset_count": len(vehicles),
                "asset_ids": [str(row.get("asset_id")) for row in vehicles if row.get("asset_id")],
                "warning_family_count": vehicle_warnings,
                "unknown_family_count": vehicle_unknown,
                "mobility_repository_url": MOBILITY_REPOSITORY_URL,
            },
            "charger_intelligence": {
                "state": charger_state,
                "source_contract": "MOBILITY_EXPERIENCE_V2",
                "asset_count": len(chargers),
                "asset_ids": [str(row.get("asset_id")) for row in chargers if row.get("asset_id")],
                "warning_family_count": charger_warnings,
                "unknown_family_count": charger_unknown,
                "mobility_repository_url": MOBILITY_REPOSITORY_URL,
            },
        }


def logical_surface_device_info(surface_id: str, name: str, model: str, *, device_identifier: str | None = None) -> dict[str, Any]:
    """Return HA device metadata without inventing topology.

    ``device_identifier`` lets the broad Mobility supervisory surface share the
    existing integration-root device. Intelligence surfaces keep stable dedicated
    identifiers so future per-asset intelligence can be added without relocation.
    """
    return {
        "identifiers": {(DOMAIN, device_identifier or surface_id)},
        "name": name,
        "manufacturer": "Robotix",
        "model": model,
        "sw_version": RELEASE,
    }
