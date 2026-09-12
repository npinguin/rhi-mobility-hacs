from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .compat_v1.health import facade_parity_health
from .coverage import completeness_gate, normalized_property_coverage, source_capability_coverage
from .readiness import evaluate_asset_readiness

CONTRACT_ID = "RHI_DOMAIN_SUPERVISORY_STATUS_V1"
CONTRACT_VERSION = "1.0.0"

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
    """Mobility-owned health/readiness details exposed as a generic Foundation envelope."""

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

    @staticmethod
    def _issue(
        issue_id: str,
        *,
        severity: str,
        category: str,
        reason_code: str,
        blocking: bool,
        scope: list[str],
        details: str,
    ) -> dict[str, Any]:
        return {
            "issue_id": issue_id,
            "severity": severity,
            "category": category,
            "status": "OPEN",
            "reason_code": reason_code,
            "blocking": blocking,
            "affected_scope": scope,
            "first_seen": None,
            "last_seen": None,
            "details_reference": details,
        }

    def _configuration_status(self, attempt: dict[str, Any]) -> str:
        if int(attempt.get("selected_input_count", 0) or 0) == 0:
            return "CONFIGURATION_REQUIRED"
        if int(attempt.get("selection_error_count", 0) or 0) > 0:
            return "DEGRADED"
        return "OK"

    @staticmethod
    def _build_status(attempt: dict[str, Any]) -> str:
        status = str(attempt.get("status") or "UNKNOWN").upper()
        if status in {"OK", "READY", "COMPLETE", "SUCCESS"}:
            return "OK"
        if status in {"PARTIAL", "DEGRADED"}:
            return "DEGRADED"
        if status in {"REMOVED", "EMPTY", "WAITING_FOR_FOUNDATION"}:
            return "CONFIGURATION_REQUIRED"
        if status in {"ERROR", "FAILED", "INVALID", "BLOCKED"}:
            return "BLOCKED"
        return "UNKNOWN"

    def _runtime(self) -> tuple[str, dict[str, Any], list[dict[str, Any]]]:
        normalized = normalized_property_coverage(self.manager, self.public)
        source = source_capability_coverage(self.manager)
        gate = completeness_gate(normalized, source)
        issues: list[dict[str, Any]] = []
        if gate.get("status") != "PASS":
            issues.append(self._issue(
                "mobility:runtime:completeness",
                severity="CRITICAL",
                category="PROPERTY_RESOLUTION",
                reason_code="RUNTIME_COMPLETENESS_GATE_FAILED",
                blocking=True,
                scope=["mobility", "MOBILITY_PUBLIC_RUNTIME_V2"],
                details="rhi_mobility:diagnostics:coverage",
            ))
            return "BLOCKED", {"normalized": normalized, "source": source, "gate": gate}, issues

        readiness_rows = []
        for asset_id in sorted(self.manager.assets):
            resolutions = []
            try:
                from .property_resolver import PropertyResolver
                resolutions = list(PropertyResolver(self.manager, self.public).resolve_asset(asset_id).values())
            except Exception:
                resolutions = []
            readiness_rows.append(evaluate_asset_readiness(self.manager, self.controller, asset_id, resolutions).as_dict())
        states = {str(row.get("product_readiness") or "UNKNOWN").upper() for row in readiness_rows}
        if "BLOCKED" in states:
            status = "BLOCKED"
        elif states & {"DEGRADED", "LIMITED", "CONFIGURATION_REQUIRED"}:
            status = "DEGRADED"
        elif readiness_rows:
            status = "OK"
        else:
            status = "CONFIGURATION_REQUIRED"
        if status == "DEGRADED":
            issues.append(self._issue(
                "mobility:runtime:asset_readiness",
                severity="WARNING",
                category="RUNTIME",
                reason_code="ASSET_READINESS_DEGRADED",
                blocking=False,
                scope=["mobility"],
                details="rhi_mobility:diagnostics:asset_readiness",
            ))
        elif status == "BLOCKED":
            issues.append(self._issue(
                "mobility:runtime:asset_readiness",
                severity="ERROR",
                category="RUNTIME",
                reason_code="ASSET_READINESS_BLOCKED",
                blocking=True,
                scope=["mobility"],
                details="rhi_mobility:diagnostics:asset_readiness",
            ))
        return status, {"normalized": normalized, "source": source, "gate": gate, "asset_readiness": readiness_rows}, issues

    def _intelligence_status(self, runtime_status: str) -> tuple[str, list[dict[str, Any]]]:
        if runtime_status == "BLOCKED":
            return "BLOCKED", [self._issue(
                "mobility:intelligence:evidence",
                severity="ERROR",
                category="INTELLIGENCE",
                reason_code="INTELLIGENCE_BLOCKED_BY_RUNTIME_EVIDENCE",
                blocking=True,
                scope=["mobility.intelligence"],
                details="rhi_mobility:diagnostics:intelligence",
            )]
        if runtime_status in {"DEGRADED", "CONFIGURATION_REQUIRED", "UNKNOWN"}:
            return "DEGRADED", [self._issue(
                "mobility:intelligence:evidence",
                severity="WARNING",
                category="INTELLIGENCE",
                reason_code="INTELLIGENCE_EVIDENCE_DEGRADED",
                blocking=False,
                scope=["mobility.intelligence"],
                details="rhi_mobility:diagnostics:intelligence",
            )]
        snapshot = dict(self.experience.snapshot() or {})
        rows = list(snapshot.get("vehicles", [])) + list(snapshot.get("chargers", []))
        if not rows:
            return "CONFIGURATION_REQUIRED", []
        # Intelligence is not allowed to report READY merely because evaluation ran.
        # At least one evidence-backed family must be non-unknown on each published asset.
        evidence_missing = []
        for row in rows:
            families = [value for key, value in row.items() if key.endswith("_intelligence") and isinstance(value, dict)]
            if families and all(str(value.get("source_quality") or "missing").lower() == "missing" for value in families):
                evidence_missing.append(str(row.get("asset_id") or "unknown"))
        if evidence_missing:
            return "DEGRADED", [self._issue(
                "mobility:intelligence:missing_evidence",
                severity="WARNING",
                category="INTELLIGENCE",
                reason_code="INTELLIGENCE_REQUIRED_EVIDENCE_MISSING",
                blocking=False,
                scope=evidence_missing[:20],
                details="rhi_mobility:diagnostics:intelligence",
            )]
        return "READY", []

    def snapshot(self) -> dict[str, Any]:
        attempt = dict(getattr(self.manager, "last_build_attempt", {}) or {})
        configuration_status = self._configuration_status(attempt)
        build_status = self._build_status(attempt)
        runtime_status, runtime_evidence, issues = self._runtime()

        compat = facade_parity_health(self.compatibility)
        contract_status = "OK" if compat.get("status") == "PASS" else "BLOCKED"
        if contract_status == "BLOCKED":
            issues.append(self._issue(
                "mobility:compatibility:v1_feature_parity",
                severity="CRITICAL",
                category="COMPATIBILITY",
                reason_code="V1_FEATURE_PARITY_INCOMPLETE",
                blocking=True,
                scope=["MOBILITY_PUBLIC_RUNTIME_V1"],
                details="rhi_mobility:diagnostics:compatibility",
            ))

        if build_status == "DEGRADED":
            issues.append(self._issue(
                "mobility:build:partial",
                severity="WARNING",
                category="BINDING",
                reason_code="DOMAIN_BUILD_PARTIAL",
                blocking=False,
                scope=["mobility"],
                details="rhi_mobility:diagnostics:build_handoff",
            ))
        elif build_status == "BLOCKED":
            issues.append(self._issue(
                "mobility:build:blocked",
                severity="ERROR",
                category="BINDING",
                reason_code="DOMAIN_BUILD_BLOCKED",
                blocking=True,
                scope=["mobility"],
                details="rhi_mobility:diagnostics:build_handoff",
            ))

        intelligence_status, intelligence_issues = self._intelligence_status(runtime_status)
        issues.extend(intelligence_issues)
        overall = _worst(configuration_status, contract_status, build_status, runtime_status, intelligence_status)
        blocking = sum(1 for issue in issues if issue.get("blocking"))
        warnings = sum(1 for issue in issues if issue.get("severity") == "WARNING")
        observed = datetime.now(timezone.utc).isoformat()
        last_success = attempt.get("observed_at") if overall in {"OK", "READY"} else None
        publication_revision = int(getattr(self.build_spec_provider, "publication_revision", 0) or 0)
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
            "intelligence_status": intelligence_status,
            "overall_domain_readiness": overall,
            "issue_count": len(issues),
            "blocking_issue_count": blocking,
            "warning_count": warnings,
            "issues_summary": issues[:100],
            "last_success_at": last_success,
            "last_observed_at": observed,
            "details_reference": "rhi_mobility:diagnostics",
        }

    def details(self) -> dict[str, Any]:
        runtime_status, runtime_evidence, _ = self._runtime()
        return {
            "runtime_status": runtime_status,
            "runtime_evidence": runtime_evidence,
            "compatibility": facade_parity_health(self.compatibility),
            "experience": self.experience.snapshot(),
        }
