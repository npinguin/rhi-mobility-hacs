from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

CONTRACT_ID = "RHI_DOMAIN_SUPERVISORY_STATUS_V1"
CONTRACT_VERSION = "1.1.0"

_PRIORITY = {
    "BLOCKED": 60,
    "STALE": 50,
    "CONFIGURATION_REQUIRED": 40,
    "DEGRADED": 30,
    "UNKNOWN": 20,
    "OK": 10,
    "READY": 10,
}


def _worst(*statuses: str) -> str:
    return max(statuses or ("UNKNOWN",), key=lambda value: _PRIORITY.get(value, 20))


class MobilityDomainSupervisoryStatusProvider:
    """Bounded Mobility readiness envelope consumed by Foundation.

    This provider intentionally never resolves the full property catalog, rebuilds the
    V1 facade, evaluates product intelligence, or reads physical source state.  Those are
    Mobility diagnostics/product concerns.  Foundation supervision gets only already
    materialized runtime/build facts, just like the Energy domain.
    """

    def __init__(
        self,
        *,
        manager: Any,
        controller: Any,
        public_provider: Any,
        experience_provider: Any,
        compatibility_facade: Any,
        build_spec_provider: Any,
        release: str,
    ) -> None:
        self.manager = manager
        self.controller = controller
        self.public = public_provider
        self.experience = experience_provider
        self.compatibility = compatibility_facade
        self.build_spec_provider = build_spec_provider
        self.release = release
        self._last_success_at: str | None = None

    @staticmethod
    def _issue(
        issue_id: str,
        *,
        severity: str,
        category: str,
        reason_code: str,
        blocking: bool,
        scope: list[str],
    ) -> dict[str, Any]:
        return {
            "issue_id": issue_id,
            "severity": severity,
            "category": category,
            "status": "OPEN",
            "reason_code": reason_code,
            "blocking": blocking,
            "affected_scope": scope,
            "details_reference": "rhi_mobility:diagnostics",
        }

    @staticmethod
    def _configuration_status(attempt: dict[str, Any]) -> str:
        if int(attempt.get("selected_input_count", 0) or 0) == 0:
            return "CONFIGURATION_REQUIRED"
        if int(attempt.get("selection_error_count", 0) or 0) > 0:
            return "DEGRADED"
        return "OK"

    @staticmethod
    def _build_status(attempt: dict[str, Any]) -> str:
        status = str(attempt.get("status") or "UNKNOWN").upper()
        if status in {"OK", "READY", "COMPLETE", "SUCCESS", "ACCEPTED"}:
            return "OK"
        if status in {"PARTIAL", "DEGRADED"}:
            return "DEGRADED"
        if status in {
            "REMOVED",
            "EMPTY",
            "WAITING_FOR_FOUNDATION",
            "WAITING_FOR_FOUNDATION_REFRESH",
        }:
            return "CONFIGURATION_REQUIRED"
        if status == "STALE":
            return "STALE"
        if status in {"ERROR", "FAILED", "INVALID", "BLOCKED", "REJECTED"}:
            return "BLOCKED"
        return "UNKNOWN"

    def _contract_status(self) -> str:
        """Validate static V1 facade shape without materializing runtime rows."""
        try:
            expected = len(self.compatibility.contract.get("property_definitions") or ())
            actual = sum(len(rows) for rows in self.compatibility.defs_by_type.values())
            entities = len(self.compatibility.required_entity_ids)
        except Exception:
            return "BLOCKED"
        return "OK" if expected == actual and expected > 0 and entities > 0 else "BLOCKED"

    def _runtime_status(self, attempt: dict[str, Any]) -> tuple[str, list[dict[str, Any]]]:
        """Read only already-materialized runtime health; never recompute properties."""
        issues: list[dict[str, Any]] = []
        selected = int(attempt.get("selected_input_count", 0) or 0)
        assets = dict(getattr(self.manager, "assets", {}) or {})
        snapshots = dict(getattr(self.manager, "snapshots", {}) or {})

        if selected > 0 and not assets:
            issues.append(self._issue(
                "mobility:runtime:materialization",
                severity="CRITICAL",
                category="RUNTIME",
                reason_code="RUNTIME_MATERIALIZATION_EMPTY",
                blocking=True,
                scope=["mobility"],
            ))
            return "BLOCKED", issues
        if not assets:
            return "CONFIGURATION_REQUIRED", issues

        missing = sorted(set(assets) - set(snapshots))
        if missing:
            issues.append(self._issue(
                "mobility:runtime:snapshot_missing",
                severity="ERROR",
                category="RUNTIME",
                reason_code="RUNTIME_SNAPSHOT_MISSING",
                blocking=True,
                scope=missing[:20],
            ))
            return "BLOCKED", issues

        health = {
            str(getattr(snapshot, "health", "UNKNOWN") or "UNKNOWN").upper()
            for snapshot in snapshots.values()
            if getattr(snapshot, "asset_id", None) in assets
        }
        if health & {"BLOCKED", "INVALID", "ERROR", "FAILED"}:
            status = "BLOCKED"
        elif health & {"DEGRADED", "STALE", "UNKNOWN", "UNAVAILABLE"}:
            status = "DEGRADED"
        else:
            status = "OK"

        if status != "OK":
            issues.append(self._issue(
                "mobility:runtime:asset_health",
                severity="ERROR" if status == "BLOCKED" else "WARNING",
                category="RUNTIME",
                reason_code=f"RUNTIME_ASSET_HEALTH_{status}",
                blocking=status == "BLOCKED",
                scope=["mobility"],
            ))
        return status, issues

    def snapshot(self) -> dict[str, Any]:
        """Return a cheap shared supervisory envelope suitable for synchronous reads."""
        attempt = dict(getattr(self.manager, "last_build_attempt", {}) or {})
        configuration_status = self._configuration_status(attempt)
        build_status = self._build_status(attempt)
        contract_status = self._contract_status()
        runtime_status, issues = self._runtime_status(attempt)

        if contract_status != "OK":
            issues.append(self._issue(
                "mobility:compatibility:v1_contract",
                severity="CRITICAL",
                category="COMPATIBILITY",
                reason_code="V1_STATIC_CONTRACT_INCOMPLETE",
                blocking=True,
                scope=["MOBILITY_PUBLIC_RUNTIME_V1"],
            ))
        if build_status == "DEGRADED":
            issues.append(self._issue(
                "mobility:build:partial",
                severity="WARNING",
                category="BINDING",
                reason_code="DOMAIN_BUILD_PARTIAL",
                blocking=False,
                scope=["mobility"],
            ))
        elif build_status == "BLOCKED":
            issues.append(self._issue(
                "mobility:build:blocked",
                severity="ERROR",
                category="BINDING",
                reason_code="DOMAIN_BUILD_BLOCKED",
                blocking=True,
                scope=["mobility"],
            ))

        overall = _worst(
            configuration_status,
            contract_status,
            build_status,
            runtime_status,
        )
        if all(
            value == "OK"
            for value in (
                configuration_status,
                contract_status,
                build_status,
                runtime_status,
            )
        ):
            overall = "READY"

        observed = datetime.now(timezone.utc).isoformat()
        if overall == "READY":
            self._last_success_at = observed
        publication_revision = int(
            getattr(self.build_spec_provider, "publication_revision", 0) or 0
        )
        return {
            "contract_id": CONTRACT_ID,
            "contract_version": CONTRACT_VERSION,
            "domain_id": "mobility",
            "publisher_domain": "rhi_mobility",
            "release": self.release,
            "configuration_revision": int(attempt.get("configuration_revision", 0) or 0),
            "build_input_revision": int(attempt.get("build_input_revision", 0) or 0),
            "publication_revision": publication_revision,
            "configuration_status": configuration_status,
            "contract_status": contract_status,
            "build_status": build_status,
            "runtime_status": runtime_status,
            "overall_domain_readiness": overall,
            "issue_count": len(issues),
            "blocking_issue_count": sum(bool(row.get("blocking")) for row in issues),
            "warning_count": sum(row.get("severity") == "WARNING" for row in issues),
            "issues_summary": issues[:100],
            "last_success_at": self._last_success_at,
            "last_observed_at": observed,
            "details_reference": "rhi_mobility:diagnostics",
        }

    def details(self) -> dict[str, Any]:
        """Run expensive Mobility-owned analysis only for explicit diagnostics."""
        from .compat_v1.health import facade_parity_health
        from .coverage import (
            completeness_gate,
            normalized_property_coverage,
            source_capability_coverage,
        )
        from .property_resolver import PropertyResolver
        from .readiness import evaluate_asset_readiness

        normalized = normalized_property_coverage(self.manager, self.public)
        source = source_capability_coverage(self.manager)
        attempt = dict(getattr(self.manager, "last_build_attempt", {}) or {})
        gate = completeness_gate(
            normalized,
            source,
            configured_input_count=int(attempt.get("selected_input_count", 0) or 0),
            materialized_asset_count=len(getattr(self.manager, "assets", {}) or {}),
        )
        readiness = []
        for asset_id in sorted(getattr(self.manager, "assets", {}) or {}):
            resolutions = list(
                PropertyResolver(self.manager, self.public).resolve_asset(asset_id).values()
            )
            readiness.append(
                evaluate_asset_readiness(
                    self.manager, self.controller, asset_id, resolutions
                ).as_dict()
            )
        return {
            "supervision": self.snapshot(),
            "runtime_evidence": {
                "normalized": normalized,
                "source": source,
                "gate": gate,
                "asset_readiness": readiness,
            },
            "compatibility": facade_parity_health(self.compatibility),
            "experience": self.experience.snapshot(),
        }
