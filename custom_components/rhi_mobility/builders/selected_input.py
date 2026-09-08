from __future__ import annotations

from dataclasses import dataclass
import hashlib
import re
from typing import Any

from ..const import FOUNDATION_DOMAIN_ID
from ..models.contracts import (
    AcceptedSourceBinding,
    AssetControlProfile,
    RelationshipSnapshot,
    SourceRef,
    VehiclePlanningProfile,
)

_SHARED_REQUIRED = {
    "kind",
    "contract_version",
    "domain_id",
    "builder_id",
    "configuration_revision",
    "candidate_revision",
    "build_input_revision",
    "selection",
    "candidate_groups",
    "candidate_evidence",
    "discovery_assessment",
    "safety",
}
_SHARED_ALLOWED = set(_SHARED_REQUIRED)


@dataclass(frozen=True)
class PreparedAssetSeed:
    asset_id: str
    logical_concept_id: str
    group_id: str
    display_name: str
    integration_domain: str
    source_device_id: str | None = None
    source_config_entry_id: str | None = None


@dataclass(frozen=True)
class PreparedBuildInput:
    selection_id: str
    builder_id: str
    integration_domain: str
    source_configuration_revision: int
    candidate_revision: int
    build_input_revision: int
    source_bindings: tuple[AcceptedSourceBinding, ...]
    asset_seeds: tuple[PreparedAssetSeed, ...]
    capability_diagnostics: tuple[dict[str, Any], ...]
    discovery_assessment: dict[str, Any]
    relationships: tuple[RelationshipSnapshot, ...]
    control_profiles: tuple[AssetControlProfile, ...]
    planning_profiles: tuple[VehiclePlanningProfile, ...]


def _positive_revision(payload: dict[str, Any], key: str) -> int:
    value = payload.get(key)
    if not isinstance(value, int) or isinstance(value, bool) or value < 1:
        raise ValueError(f"{key} must be an integer >= 1")
    return value


def _structural_contract_validation(payload: dict[str, Any]) -> None:
    if not isinstance(payload, dict):
        raise ValueError("SelectedDomainBuildInput must be an object")
    missing = sorted(_SHARED_REQUIRED - set(payload))
    unknown = sorted(set(payload) - _SHARED_ALLOWED)
    if missing:
        raise ValueError(f"SelectedDomainBuildInput missing fields: {missing}")
    if unknown:
        raise ValueError(f"SelectedDomainBuildInput unknown fields: {unknown}")
    if payload.get("kind") != "selected_domain_build_input":
        raise ValueError("invalid kind")
    if payload.get("contract_version") != "1.2.0":
        raise ValueError("unsupported SelectedDomainBuildInput contract_version; expected 1.2.0")
    if payload.get("domain_id") != FOUNDATION_DOMAIN_ID:
        raise ValueError(f"domain_id must be {FOUNDATION_DOMAIN_ID}")
    for key in ("configuration_revision", "candidate_revision", "build_input_revision"):
        _positive_revision(payload, key)
    if not isinstance(payload.get("selection"), dict):
        raise ValueError("selection must be an object")
    if not isinstance(payload.get("candidate_groups"), list):
        raise ValueError("candidate_groups must be an array")
    if not isinstance(payload.get("candidate_evidence"), list):
        raise ValueError("candidate_evidence must be an array")
    assessment = payload.get("discovery_assessment")
    if not isinstance(assessment, dict):
        raise ValueError("discovery_assessment must be an object")
    for key in ("required_inputs_complete", "topology_state", "review_required"):
        if key not in assessment:
            raise ValueError(f"discovery_assessment missing {key}")
    safety = payload.get("safety")
    if not isinstance(safety, dict):
        raise ValueError("safety must be an object")
    for key in ("creates_binding", "creates_runtime_truth", "creates_public_contract", "executes_commands"):
        if safety.get(key) is not False:
            raise ValueError(f"Foundation safety flag must be false: {key}")


def _validate_identity(asset_id: str, input_id: str, ident: dict[str, Any]) -> None:
    kind = ident.get("source_kind")
    scope = ident.get("target_scope")
    if kind == "entity":
        if scope != "entity":
            raise ValueError(f"{asset_id}/{input_id}: entity target_scope must be entity")
        for key in ("integration_domain", "config_entry_id", "entity_registry_id", "unique_id", "current_entity_id"):
            if not isinstance(ident.get(key), str) or not ident.get(key):
                raise ValueError(f"{asset_id}/{input_id}: entity source identity missing {key}")
        return
    if kind == "service":
        for key in ("integration_domain", "service_domain", "service_name"):
            if not isinstance(ident.get(key), str) or not ident.get(key):
                raise ValueError(f"{asset_id}/{input_id}: service source identity missing {key}")
        target = ident.get("target")
        if not isinstance(target, dict) or not target:
            raise ValueError(f"{asset_id}/{input_id}: service source identity missing target")
        if scope == "device":
            if not isinstance(target.get("device_registry_id"), str) or not target.get("device_registry_id"):
                raise ValueError(f"{asset_id}/{input_id}: device-scoped service missing device_registry_id")
        elif scope == "entity":
            if not isinstance(target.get("entity_registry_id"), str) or not target.get("entity_registry_id"):
                raise ValueError(f"{asset_id}/{input_id}: entity-scoped service missing entity_registry_id")
        elif scope == "config_entry":
            if not isinstance(target.get("config_entry_id"), str) or not target.get("config_entry_id"):
                raise ValueError(f"{asset_id}/{input_id}: config-entry service missing config_entry_id")
        elif scope != "none":
            raise ValueError(f"{asset_id}/{input_id}: invalid service target_scope {scope}")
        return
    if kind == "configured_product_capability":
        if scope != "configured_selection":
            raise ValueError(f"{asset_id}/{input_id}: configured capability target_scope must be configured_selection")
        if ident.get("configuration_owner") != "rhi_foundation":
            raise ValueError(f"{asset_id}/{input_id}: configuration_owner must be rhi_foundation")
        revision = ident.get("configuration_revision")
        if not isinstance(revision, int) or isinstance(revision, bool) or revision < 1:
            raise ValueError(f"{asset_id}/{input_id}: configuration_revision must be >= 1")
        for key in ("selection_id", "capability_key"):
            if not isinstance(ident.get(key), str) or not ident.get(key):
                raise ValueError(f"{asset_id}/{input_id}: configured product capability missing {key}")
        return
    if kind == "device_action":
        if scope != "device":
            raise ValueError(f"{asset_id}/{input_id}: device action target_scope must be device")
        for key in ("integration_domain", "config_entry_id", "device_registry_id", "action_domain", "action_type"):
            if not isinstance(ident.get(key), str) or not ident.get(key):
                raise ValueError(f"{asset_id}/{input_id}: device action source identity missing {key}")
        return
    if kind == "config_entry_provider":
        if scope != "config_entry":
            raise ValueError(f"{asset_id}/{input_id}: config-entry provider target_scope must be config_entry")
        for key in ("integration_domain", "config_entry_id", "provider_key"):
            if not isinstance(ident.get(key), str) or not ident.get(key):
                raise ValueError(f"{asset_id}/{input_id}: config-entry provider identity missing {key}")
        return
    if kind == "integration_api":
        if scope != "resource":
            raise ValueError(f"{asset_id}/{input_id}: integration API target_scope must be resource")
        for key in ("integration_domain", "config_entry_id", "api_capability_id", "resource_id", "adapter_contract_version"):
            if not isinstance(ident.get(key), str) or not ident.get(key):
                raise ValueError(f"{asset_id}/{input_id}: integration API identity missing {key}")
        return
    raise ValueError(f"{asset_id}/{input_id}: unsupported Mobility source_kind {kind}")


def _technical_asset_key(ident: dict[str, Any]) -> str:
    kind = ident.get("source_kind")
    if kind in {"entity", "device_action"}:
        device_id = ident.get("device_registry_id")
        if device_id:
            return f"device:{device_id}"
        if kind == "entity":
            return f"entity:{ident.get('config_entry_id')}:{ident.get('unique_id')}"
    if kind == "service":
        target = ident.get("target") or {}
        if target.get("device_registry_id"):
            return f"device:{target['device_registry_id']}"
        if target.get("config_entry_id"):
            return f"config_entry:{target['config_entry_id']}"
        return f"service:{ident.get('integration_domain')}:{ident.get('service_domain')}:{ident.get('service_name')}"
    if kind == "configured_product_capability":
        return f"configured:{ident.get('selection_id')}"
    if kind == "integration_api":
        return f"api:{ident.get('config_entry_id')}:{ident.get('resource_id')}"
    if kind == "config_entry_provider":
        return f"provider:{ident.get('config_entry_id')}:{ident.get('provider_key')}"
    return f"source:{hashlib.sha256(repr(sorted(ident.items())).encode()).hexdigest()[:16]}"




def _concrete_object_identity(ident: dict[str, Any], builder_id: str) -> tuple[str, str | None, str | None] | None:
    """Return a concrete logical-object anchor, never an integration-global surface.

    Mobility deliberately does not fuse sources. A logical object is anchored by one
    explicitly selected technical device, or by the manual-profile configured object
    capability. Config-entry/global service/API/provider surfaces can support an already
    identified object but may never create a new logical vehicle/charger on their own.
    """
    kind = ident.get("source_kind")
    config_entry_id = ident.get("config_entry_id")
    device_id = ident.get("device_registry_id")
    if kind == "service":
        device_id = (ident.get("target") or {}).get("device_registry_id")
    if isinstance(device_id, str) and device_id:
        return f"device:{device_id}", device_id, str(config_entry_id) if config_entry_id else None
    if builder_id == "mobility.vehicle.manual_profile.v1" and kind == "configured_product_capability":
        selection_id = ident.get("selection_id")
        if isinstance(selection_id, str) and selection_id:
            return f"configured:{selection_id}", None, None
    return None

def _safe_asset_id(logical_concept: str, technical_key: str) -> str:
    raw = technical_key.split(":", 1)[-1]
    slug = re.sub(r"[^a-zA-Z0-9_]+", "_", raw).strip("_").lower()
    if not slug:
        slug = hashlib.sha256(technical_key.encode()).hexdigest()[:16]
    if len(slug) > 48:
        digest = hashlib.sha256(technical_key.encode()).hexdigest()[:12]
        slug = f"{slug[:35]}_{digest}"
    return f"{logical_concept}_{slug}"


def _selection_id(payload: dict[str, Any]) -> str:
    selection = payload["selection"]
    integration = str(selection.get("integration_domain") or "unknown")
    selected = ",".join(sorted(str(x) for x in (selection.get("selected_device_ids") or [])))
    fingerprint = str(selection.get("configured_specification_fingerprint") or "")
    basis = f"{payload['builder_id']}|{integration}|{selected}|{fingerprint}"
    return f"selection.mobility.{hashlib.sha256(basis.encode()).hexdigest()[:20]}"


def _validate_candidate(candidate: dict[str, Any], *, candidate_id: str) -> None:
    if not isinstance(candidate, dict):
        raise ValueError(f"candidate evidence {candidate_id} must be an object")
    if candidate.get("kind") != "foundation_capability_candidate":
        raise ValueError(f"candidate evidence {candidate_id} has invalid kind")
    if candidate.get("contract_version") != "1.1.0":
        raise ValueError(f"candidate evidence {candidate_id} has unsupported contract_version")
    if candidate.get("candidate_id") != candidate_id:
        raise ValueError(f"candidate evidence id mismatch for {candidate_id}")
    ident = candidate.get("source_identity")
    tech = candidate.get("technical_capability")
    quality = candidate.get("quality")
    evidence = candidate.get("evidence")
    if not isinstance(ident, dict) or not isinstance(tech, dict) or not isinstance(quality, dict) or not isinstance(evidence, dict):
        raise ValueError(f"candidate evidence {candidate_id} is incomplete")
    if not evidence.get("provenance") or evidence.get("name_hints_supporting_only") is not True:
        raise ValueError(f"candidate evidence {candidate_id} lacks authoritative provenance")
    safety = candidate.get("safety") or {}
    if any(safety.get(key) is not False for key in ("creates_binding", "creates_runtime_truth", "creates_public_contract", "executes_commands")):
        raise ValueError(f"candidate evidence {candidate_id} has invalid safety flags")


def _match_fingerprint(match: dict[str, Any]) -> str:
    import json
    return json.dumps(match, sort_keys=True, separators=(",", ":"))


def _candidate_matches_for_group(group: dict[str, Any], spec_rule: dict[str, Any], integration_domain: str) -> dict[str, dict[str, Any]]:
    matches = group.get("candidate_matches")
    if not isinstance(matches, list):
        raise ValueError(f"{group.get('input_id')}: candidate_matches must be an array")
    candidate_ids = [str(x) for x in group.get("candidate_ids") or []]
    if len(matches) != len(candidate_ids):
        raise ValueError(f"{group.get('input_id')}: candidate_matches must contain exactly one match per candidate_id")
    published = {_match_fingerprint(x): x for x in spec_rule.get("integration_matches") or [] if x.get("integration_domain") == integration_domain}
    if not published:
        raise ValueError(f"{group.get('input_id')}: Mobility specification has no raw matching rule for {integration_domain}")
    by_id: dict[str, dict[str, Any]] = {}
    for row in matches:
        if not isinstance(row, dict):
            raise ValueError(f"{group.get('input_id')}: invalid candidate match")
        cid = str(row.get("candidate_id") or "")
        if not cid or cid in by_id or cid not in candidate_ids:
            raise ValueError(f"{group.get('input_id')}: candidate match id mismatch or duplicate")
        if row.get("integration_domain") != integration_domain:
            raise ValueError(f"{group.get('input_id')}: candidate match integration mismatch")
        pm = row.get("published_match")
        if not isinstance(pm, dict) or _match_fingerprint(pm) not in published:
            raise ValueError(f"{group.get('input_id')}: published_match was not published by Mobility")
        if row.get("raw_capability_id") != pm.get("raw_capability_id"):
            raise ValueError(f"{group.get('input_id')}: raw_capability_id does not match published rule")
        if row.get("source_kind") != pm.get("source_kind"):
            raise ValueError(f"{group.get('input_id')}: source_kind does not match published rule")
        by_id[cid] = row
    if set(by_id) != set(candidate_ids):
        raise ValueError(f"{group.get('input_id')}: incomplete candidate_matches")
    return by_id


def _enforce_group_cardinality(asset_id: str, input_id: str, cardinality: str, count: int) -> None:
    if cardinality in {"one", "exactly_one", "one_per_system", "exactly_one_per_group"} and count != 1:
        raise ValueError(f"{asset_id}/{input_id}: cardinality {cardinality} requires exactly one candidate")
    if cardinality in {"zero_or_one", "zero_or_one_per_group"} and count > 1:
        raise ValueError(f"{asset_id}/{input_id}: cardinality {cardinality} allows at most one candidate")
    if cardinality in {"one_or_more", "one_or_more_per_group"} and count < 1:
        raise ValueError(f"{asset_id}/{input_id}: cardinality {cardinality} requires one or more candidates")


def _capability_diag(*, builder_id: str, integration_domain: str, selection_id: str, asset_id: str,
                     device_id: str | None, input_id: str, required: bool, status: str, reason: str,
                     candidate: dict[str, Any] | None = None, candidate_match: dict[str, Any] | None = None,
                     normalized_properties: list[str] | None = None) -> dict[str, Any]:
    ident = candidate.get("source_identity") if isinstance(candidate, dict) and isinstance(candidate.get("source_identity"), dict) else {}
    tech = candidate.get("technical_capability") if isinstance(candidate, dict) and isinstance(candidate.get("technical_capability"), dict) else {}
    return {
        "builder_id": builder_id,
        "integration_domain": integration_domain,
        "selection_id": selection_id,
        "asset_id": asset_id,
        "device_id": device_id,
        "input_id": input_id,
        "required": bool(required),
        "status": status,
        "reason": reason,
        "candidate_id": None if candidate is None else candidate.get("candidate_id"),
        "source_kind": ident.get("source_kind"),
        "entity_id": ident.get("current_entity_id"),
        "entity_registry_id": ident.get("entity_registry_id"),
        "target_scope": ident.get("target_scope"),
        "technical_capability": tech.get("capability_class"),
        "raw_capability_id": None if candidate_match is None else candidate_match.get("raw_capability_id"),
        "published_match": None if candidate_match is None else candidate_match.get("published_match"),
        "normalized_properties": list(normalized_properties or []),
    }


def prepare_selected_build_input(payload: dict[str, Any], registry) -> PreparedBuildInput:
    """Prepare as much trustworthy Mobility runtime state as the handoff proves.

    Structural contract violations remain fail-closed. Capability-level gaps, ambiguity,
    review requirements and unavailable technical evidence are isolated to the affected
    integration/device/capability. Known evidence is never discarded merely because a
    different capability is missing. Physical command/control evidence stays blocked
    until target scope is attributable and Foundation review is complete.
    """
    _structural_contract_validation(payload)

    builder_id = str(payload["builder_id"])
    spec = registry.build_spec(builder_id)
    model = registry.builder_model(builder_id)
    selection = payload["selection"]
    assessment = dict(payload["discovery_assessment"])

    if selection.get("concept") not in (None, "", spec["concept"]["concept_id"]):
        raise ValueError("selection concept does not match builder")
    integration_domain = str(selection.get("integration_domain") or "")
    if not integration_domain:
        raise ValueError("selection.integration_domain is required")
    supported_integrations = {row["integration_domain"] for row in spec["supported_sources"]}
    if integration_domain not in supported_integrations:
        raise ValueError(f"integration {integration_domain} not supported by builder")

    selection_id = _selection_id(payload)
    logical_concept = model.get("logical_asset_type") or model["concept_id"]
    spec_inputs = {row["input_id"]: row for row in spec["candidate_requirements"]["normalized_inputs"]}

    # Object identity is intentionally narrower than candidate identity. One selected
    # technical device becomes one logical Mobility object. Integration-global/config-entry
    # surfaces never create phantom vehicles/chargers. Explicit specific-device selections
    # stay visible even if Foundation cannot currently match a required capability.
    asset_inputs: dict[str, dict[str, dict[str, Any]]] = {}
    asset_device_ids: dict[str, str | None] = {}
    asset_config_entry_ids: dict[str, str | None] = {}
    selected_device_ids = {str(x) for x in (selection.get("selected_device_ids") or []) if str(x) != "__all_matching__"}
    for device_id in sorted(selected_device_ids):
        key = f"device:{device_id}"
        asset_inputs.setdefault(key, {})
        asset_device_ids[key] = device_id
        asset_config_entry_ids[key] = None

    evidence_by_id: dict[str, dict[str, Any]] = {}
    evidence_errors: dict[str, str] = {}
    evidence_object_keys: dict[str, str | None] = {}
    for candidate in payload["candidate_evidence"]:
        candidate_id = str(candidate.get("candidate_id") or "") if isinstance(candidate, dict) else ""
        if not candidate_id:
            raise ValueError("candidate_evidence candidate_id required")
        if candidate_id in evidence_by_id or candidate_id in evidence_errors:
            raise ValueError(f"duplicate candidate evidence {candidate_id}")
        try:
            _validate_candidate(candidate, candidate_id=candidate_id)
        except Exception as exc:
            evidence_errors[candidate_id] = str(exc)
        else:
            evidence_by_id[candidate_id] = candidate
            ident = candidate.get("source_identity") or {}
            anchor = _concrete_object_identity(ident, builder_id)
            if anchor is None:
                evidence_object_keys[candidate_id] = None
                continue
            key, device_id, config_entry_id = anchor
            if selected_device_ids and device_id is not None and device_id not in selected_device_ids:
                evidence_object_keys[candidate_id] = None
                continue
            evidence_object_keys[candidate_id] = key
            asset_inputs.setdefault(key, {})
            asset_device_ids.setdefault(key, device_id)
            asset_config_entry_ids.setdefault(key, config_entry_id)

    groups_by_input: dict[str, dict[str, Any]] = {}
    group_errors: dict[str, str] = {}
    referenced_ids: set[str] = set()
    for group in payload["candidate_groups"]:
        if not isinstance(group, dict):
            raise ValueError("candidate group must be an object")
        input_id = str(group.get("input_id") or "")
        if input_id not in spec_inputs:
            raise ValueError(f"candidate group input not declared by builder: {input_id}")
        if input_id in groups_by_input or input_id in group_errors:
            raise ValueError(f"duplicate candidate group for {input_id}")
        candidate_ids = group.get("candidate_ids")
        if not isinstance(candidate_ids, list):
            raise ValueError(f"{input_id}: candidate_ids must be an array")
        if group.get("candidate_count") != len(candidate_ids):
            raise ValueError(f"{input_id}: candidate_count does not match candidate_ids")
        referenced_ids.update(str(x) for x in candidate_ids)
        copy = dict(group)
        try:
            copy["_rhi_matches_by_id"] = _candidate_matches_for_group(copy, spec_inputs[input_id], integration_domain)
        except Exception as exc:
            group_errors[input_id] = str(exc)
            continue
        groups_by_input[input_id] = copy

    # Missing evidence referenced by a group is isolated to that capability instead of
    # destroying unrelated object truth. It is never accepted as a source.
    missing_evidence_ids = referenced_ids - set(evidence_by_id) - set(evidence_errors)

    capability_diagnostics: list[dict[str, Any]] = []
    ambiguous_inputs: set[tuple[str, str]] = set()

    for input_id, group in groups_by_input.items():
        spec_rule = spec_inputs[input_id]
        model_rule = model["input_rules"][input_id]
        usage = model_rule.get("usage", "observation")
        outputs = list(model_rule.get("outputs") or [])
        for raw_candidate_id in group.get("candidate_ids") or []:
            candidate_id = str(raw_candidate_id)
            candidate_match = group["_rhi_matches_by_id"].get(candidate_id)
            candidate = evidence_by_id.get(candidate_id)
            if candidate is None:
                reason = evidence_errors.get(candidate_id) or ("candidate evidence not supplied" if candidate_id in missing_evidence_ids else "candidate evidence unavailable")
                # There may be no source identity to locate the exact object. Emit a
                # selection-scoped diagnostic; selected device seeds below get their own
                # missing-required rows.
                capability_diagnostics.append(_capability_diag(
                    builder_id=builder_id, integration_domain=integration_domain, selection_id=selection_id,
                    asset_id="selection_scope", device_id=None, input_id=input_id, required=bool(spec_rule.get("required")),
                    status="INVALID_EVIDENCE", reason=reason, candidate=None, candidate_match=candidate_match,
                    normalized_properties=outputs,
                ))
                continue

            ident = candidate["source_identity"]
            tech = candidate["technical_capability"]
            source_kind = ident.get("source_kind")
            technical_key = evidence_object_keys.get(candidate_id)
            if technical_key is None:
                capability_diagnostics.append(_capability_diag(
                    builder_id=builder_id, integration_domain=integration_domain, selection_id=selection_id,
                    asset_id="selection_scope", device_id=None, input_id=input_id, required=bool(spec_rule.get("required")),
                    status="BLOCKED_BY_TARGET_SCOPE" if model_rule.get("usage", "observation") in {"control", "command"} else "UNATTRIBUTED",
                    reason="technical evidence is not attributable to one selected Mobility object",
                    candidate=candidate, candidate_match=candidate_match, normalized_properties=outputs,
                ))
                continue
            device_id = asset_device_ids.get(technical_key)
            asset_id = _safe_asset_id(logical_concept, technical_key)

            def reject(status: str, reason: str) -> None:
                capability_diagnostics.append(_capability_diag(
                    builder_id=builder_id, integration_domain=integration_domain, selection_id=selection_id,
                    asset_id=asset_id, device_id=device_id, input_id=input_id, required=bool(spec_rule.get("required")),
                    status=status, reason=reason, candidate=candidate, candidate_match=candidate_match,
                    normalized_properties=outputs,
                ))

            if candidate_match is None or candidate_match.get("source_kind") != source_kind:
                reject("INVALID_EVIDENCE", "candidate evidence source_kind differs from published match")
                continue
            if source_kind == "service" and usage in {"control", "command"} and ident.get("target_scope") not in {"entity", "device"}:
                reject("BLOCKED_BY_TARGET_SCOPE", "physical command lacks attributable entity/device target")
                continue
            try:
                _validate_identity(asset_id, input_id, ident)
            except Exception as exc:
                reject("INVALID_EVIDENCE", str(exc))
                continue
            if source_kind not in spec_rule["allowed_source_kinds"]:
                reject("INVALID_EVIDENCE", f"source_kind {source_kind} not allowed")
                continue
            if ident.get("integration_domain") not in (None, integration_domain):
                reject("INVALID_EVIDENCE", "candidate belongs to another integration")
                continue
            capability = str(tech.get("capability_class") or "")
            allowed_caps = set(spec_rule.get("technical_capabilities", {}).get("any_of", []))
            if capability not in allowed_caps:
                reject("INVALID_EVIDENCE", f"capability {capability} not allowed; expected {sorted(allowed_caps)}")
                continue
            if usage == "observation" and source_kind not in {"entity", "configured_product_capability"}:
                reject("INVALID_EVIDENCE", "observation requires entity/configured source")
                continue
            if usage in {"control", "command"} and tech.get("writable") is not True:
                reject("INVALID_EVIDENCE", "control/command candidate must be writable")
                continue
            quality = candidate.get("quality") or {}
            if quality.get("ambiguity") != "none":
                reject("AMBIGUOUS", "technical candidate is ambiguous")
                ambiguous_inputs.add((technical_key, input_id))
                continue
            # Review blocks only actuation semantics. Mechanically proven observations
            # remain usable and visible for diagnostics/runtime normalization.
            if assessment.get("review_required") is True and usage in {"control", "command"}:
                reject("BLOCKED_BY_REVIEW", "Foundation review is required before command/control promotion")
                continue
            existing = asset_inputs[technical_key].get(input_id)
            if existing is not None:
                # Never choose arbitrarily between equal candidates.
                asset_inputs[technical_key].pop(input_id, None)
                ambiguous_inputs.add((technical_key, input_id))
                reject("AMBIGUOUS", "multiple candidates violate Mobility cardinality")
                continue
            selected_candidate = dict(candidate)
            selected_candidate["_rhi_candidate_match"] = candidate_match
            asset_inputs[technical_key][input_id] = selected_candidate

    # Group-level failures become capability diagnostics for every identified object.
    for technical_key in list(asset_inputs):
        asset_id = _safe_asset_id(logical_concept, technical_key)
        device_id = asset_device_ids.get(technical_key)
        for input_id, reason in group_errors.items():
            rule = spec_inputs[input_id]
            capability_diagnostics.append(_capability_diag(
                builder_id=builder_id, integration_domain=integration_domain, selection_id=selection_id,
                asset_id=asset_id, device_id=device_id, input_id=input_id, required=bool(rule.get("required")),
                status="INVALID_EVIDENCE", reason=reason,
                normalized_properties=list(model["input_rules"][input_id].get("outputs") or []),
            ))

    source_bindings: list[AcceptedSourceBinding] = []
    asset_seeds: list[PreparedAssetSeed] = []
    role = model["source_role"]
    for technical_key, inputs in sorted(asset_inputs.items()):
        asset_id = _safe_asset_id(logical_concept, technical_key)
        device_id = asset_device_ids.get(technical_key)
        asset_seeds.append(PreparedAssetSeed(
            asset_id, logical_concept, technical_key, asset_id.replace("_", " ").title(),
            integration_domain, asset_device_ids.get(technical_key), asset_config_entry_ids.get(technical_key),
        ))
        parsed: dict[str, SourceRef] = {}
        for input_id, candidate in sorted(inputs.items()):
            if (technical_key, input_id) in ambiguous_inputs:
                continue
            ident = candidate["source_identity"]
            tech = candidate["technical_capability"]
            quality = candidate["quality"]
            cm = candidate["_rhi_candidate_match"]
            parsed[input_id] = SourceRef(
                candidate_id=str(candidate["candidate_id"]), source_kind=str(ident["source_kind"]),
                integration_domain=integration_domain, technical_capability=str(tech["capability_class"]),
                writable=bool(tech.get("writable", False)), identity=dict(ident),
                raw_capability_id=str(cm["raw_capability_id"]), published_match=dict(cm["published_match"]),
                native_unit=tech.get("native_unit"), technical_match_confidence=quality.get("technical_match_confidence"),
                availability=quality.get("availability"),
            )
            capability_diagnostics.append(_capability_diag(
                builder_id=builder_id, integration_domain=integration_domain, selection_id=selection_id,
                asset_id=asset_id, device_id=device_id, input_id=input_id, required=bool(spec_inputs[input_id].get("required")),
                status="MATCHED", reason="technical evidence accepted for runtime normalization",
                candidate=candidate, candidate_match=cm,
                normalized_properties=list(model["input_rules"][input_id].get("outputs") or []),
            ))
        # A binding with zero trustworthy inputs has no semantic source value. The asset
        # seed still keeps the configured object visible and degraded in the UX.
        if parsed:
            binding_id = f"binding.mobility.{selection_id}.{role}.{asset_id}"
            source_bindings.append(AcceptedSourceBinding(
                binding_id=binding_id, selection_id=selection_id, group_id=technical_key,
                asset_id=asset_id, logical_concept_id=logical_concept, builder_id=builder_id,
                source_role=role, source_precedence=int(model.get("source_precedence", 0)),
                integration_domain=integration_domain, source_configuration_revision=payload["configuration_revision"],
                candidate_revision=payload["candidate_revision"], build_input_revision=payload["build_input_revision"],
                inputs=parsed,
            ))

        # Explicitly surface every missing capability at object scope. Optional inputs are
        # UNSUPPORTED; required inputs are MISSING. Already emitted hard problems win.
        existing_diag={(d["input_id"],d["status"]) for d in capability_diagnostics if d.get("asset_id")==asset_id}
        for input_id, rule in spec_inputs.items():
            if input_id in parsed or any(i==input_id and st in {"AMBIGUOUS","INVALID_EVIDENCE","BLOCKED_BY_REVIEW","BLOCKED_BY_TARGET_SCOPE"} for i,st in existing_diag):
                continue
            status = "MISSING" if rule.get("required") else "UNSUPPORTED"
            reason = "required technical capability not available for selected object" if rule.get("required") else "optional technical capability not available for selected object"
            capability_diagnostics.append(_capability_diag(
                builder_id=builder_id, integration_domain=integration_domain, selection_id=selection_id,
                asset_id=asset_id, device_id=device_id, input_id=input_id, required=bool(rule.get("required")),
                status=status, reason=reason,
                normalized_properties=list(model["input_rules"][input_id].get("outputs") or []),
            ))

    # A legitimate empty concept contributes no object and no binding. Foundation may
    # still mark its required input assessment incomplete; that is not a domain defect.
    zero_groups_allowed = spec.get("candidate_requirements", {}).get("topology", {}).get("minimum_groups") == 0
    if not asset_seeds and not zero_groups_allowed:
        raise ValueError("candidate groups contain no object identity")

    return PreparedBuildInput(
        selection_id=selection_id, builder_id=builder_id, integration_domain=integration_domain,
        source_configuration_revision=payload["configuration_revision"], candidate_revision=payload["candidate_revision"],
        build_input_revision=payload["build_input_revision"], source_bindings=tuple(source_bindings),
        asset_seeds=tuple(asset_seeds), capability_diagnostics=tuple(capability_diagnostics),
        discovery_assessment=assessment, relationships=tuple(), control_profiles=tuple(), planning_profiles=tuple(),
    )
