from __future__ import annotations

from typing import Any

from .normalization import normalize


def _source_candidates(manager: Any, asset_id: str) -> dict[str, dict[str, Any]]:
    """Collect canonical SOURCE candidates without applying cross-producer precedence."""
    asset = manager.assets.get(asset_id)
    if asset is None:
        return {}
    chosen: dict[str, tuple[int, dict[str, Any]]] = {}
    for binding in sorted(asset.source_bindings.values(), key=lambda row: row.source_precedence):
        model = manager.registry.builder_model(binding.builder_id)
        for input_id, source in binding.inputs.items():
            rule = (model.get("input_rules") or {}).get(input_id) or {}
            if rule.get("usage", "observation") != "observation" or not source.entity_id:
                continue
            state = manager.hass.states.get(source.entity_id)
            raw = None if state is None else state.state
            unit = source.native_unit or (state.attributes.get("unit_of_measurement") if state else None)
            normalized = normalize(rule.get("normalizer"), source.integration_domain, raw, unit)
            outputs = [str(value) for value in rule.get("outputs") or []]
            if "value" in normalized and len(outputs) == 1:
                normalized = {outputs[0]: normalized["value"]}
            precedence = binding.source_precedence * 100 + int(rule.get("precedence", 0) or 0)
            for property_id in outputs:
                value = normalized.get(property_id)
                if value is None:
                    continue
                candidate = {
                    "producer_kind": "SOURCE",
                    "value": value,
                    "quality": f"candidate:{source.candidate_id}",
                    "source_reference": {
                        "candidate_id": source.candidate_id,
                        "source_integration": source.integration_domain,
                        "source_device_id": source.device_id,
                        "source_config_entry_id": source.config_entry_id,
                        "source_entity_id": source.entity_id,
                        "raw_capability_id": source.raw_capability_id,
                        "technical_capability": source.technical_capability,
                        "source_input_id": input_id,
                        "target_scope": source.target_scope,
                    },
                }
                previous = chosen.get(property_id)
                if previous is None or precedence >= previous[0]:
                    chosen[property_id] = (precedence, candidate)
    return {key: row[1] for key, row in chosen.items()}


def _identity_source_candidates(manager: Any, asset_id: str) -> dict[str, dict[str, Any]]:
    """Expose accepted logical asset identity as typed SOURCE evidence."""
    asset = manager.assets.get(asset_id)
    display_name = None if asset is None else getattr(asset, "display_name", None)
    if not display_name:
        return {}
    primary = manager.primary_source_metadata(asset_id) if callable(getattr(manager, "primary_source_metadata", None)) else {}
    reference = {
        "source_integration": primary.get("integration_domain"),
        "source_device_id": primary.get("device_id"),
        "source_config_entry_id": primary.get("config_entry_id"),
        "identity_kind": "accepted_logical_asset_identity",
    }
    reference = {key: value for key, value in reference.items() if value not in (None, "")}
    candidate = {
        "producer_kind": "SOURCE",
        "value": display_name,
        "quality": "source_device_identity",
        "source_reference": reference,
    }
    return {
        "asset.display_name": dict(candidate),
        "asset.short_name": dict(candidate),
    }


def collect_producer_candidates(manager: Any, asset_id: str) -> dict[str, dict[str, dict[str, Any]]]:
    """Return producer-native candidates before truth_precedence chooses a winner."""
    asset = manager.assets.get(asset_id)
    if asset is None:
        return {}

    ledger: dict[str, dict[str, dict[str, Any]]] = {}
    for property_id, candidate in _source_candidates(manager, asset_id).items():
        ledger.setdefault(property_id, {})["SOURCE"] = candidate
    for property_id, candidate in _identity_source_candidates(manager, asset_id).items():
        ledger.setdefault(property_id, {})["SOURCE"] = candidate

    semantic = (getattr(manager.registry, "semantic_catalog", {}) or {}).get("properties") or {}
    selected_profile = manager._selected_profile(asset_id)
    if isinstance(selected_profile, dict):
        profile_id = str(selected_profile.get("profile_id") or "")
        for property_id, definition in semantic.items():
            if asset.concept_id not in set(definition.get("applicable_asset_types") or [asset.concept_id]):
                continue
            field = definition.get("profile_field")
            if not field or "PROFILE" not in set(definition.get("producer_types") or []):
                continue
            value = selected_profile.get(field)
            if value is None:
                continue
            ledger.setdefault(str(property_id), {})["PROFILE"] = {
                "producer_kind": "PROFILE",
                "value": value,
                "quality": f"mobility_profile:{profile_id}",
                "source_reference": {"profile_id": profile_id, "profile_field": field},
            }

    for property_id, definition in semantic.items():
        if asset.concept_id not in set(definition.get("applicable_asset_types") or [asset.concept_id]):
            continue
        if "CONFIGURED" not in set(definition.get("producer_types") or []):
            continue
        sentinel = object()
        value = manager.configuration_value(asset_id, str(property_id), sentinel)
        if value is sentinel:
            continue
        ledger.setdefault(str(property_id), {})["CONFIGURED"] = {
            "producer_kind": "CONFIGURED",
            "value": value,
            "quality": "mobility_domain_configuration",
            "source_reference": {
                "configuration_revision": int(getattr(manager.domain_config, "revision", 0) or 0),
            },
        }

    return ledger
