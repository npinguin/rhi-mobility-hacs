from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .source_normalization import normalize_source_observation


@dataclass(frozen=True)
class BoundObservation:
    input_id: str
    entity_id: str
    integration_domain: str
    raw_capability_id: str | None
    normalizer: str
    outputs: tuple[str, ...]
    precedence: int
    candidate_id: str
    native_unit: str | None
    required: bool


@dataclass(frozen=True)
class BoundSource:
    input_id: str
    precedence: int
    source: Any


@dataclass(frozen=True)
class ActiveBindingPlan:
    asset_id: str
    observations: tuple[BoundObservation, ...]
    sources_by_input: dict[str, tuple[BoundSource, ...]]
    entity_ids: tuple[str, ...]
    canonical_outputs: frozenset[str]

    def preferred_source(self, input_id: str):
        rows = self.sources_by_input.get(str(input_id), ())
        return rows[-1].source if rows else None


def build_active_binding_plan(asset: Any, registry: Any) -> ActiveBindingPlan:
    """Resolve stable source-to-fact mappings once per structural handoff."""

    semantic = (getattr(registry, "semantic_catalog", {}) or {}).get("properties") or {}
    observations: list[BoundObservation] = []
    source_rows: dict[str, list[BoundSource]] = {}
    entity_ids: set[str] = set()
    outputs: set[str] = set()

    for binding in sorted(asset.source_bindings.values(), key=lambda row: row.source_precedence):
        model = registry.builder_model(binding.builder_id)
        spec = registry.build_spec(binding.builder_id)
        required_by_input = {
            str(row.get("input_id")): bool(row.get("required"))
            for row in (spec.get("candidate_requirements") or {}).get("normalized_inputs") or ()
            if isinstance(row, dict) and row.get("input_id")
        }
        rules = model.get("input_rules") or {}

        for input_id, source in binding.inputs.items():
            input_id = str(input_id)
            rule = rules.get(input_id) or {}
            precedence = int(binding.source_precedence) * 100 + int(rule.get("precedence", 0) or 0)
            source_rows.setdefault(input_id, []).append(BoundSource(input_id, precedence, source))
            if source.entity_id:
                entity_ids.add(str(source.entity_id))

            if rule.get("usage", "observation") != "observation" or not source.entity_id:
                continue
            declared_outputs = tuple(str(value) for value in rule.get("outputs") or ())
            observations.append(
                BoundObservation(
                    input_id=input_id,
                    entity_id=str(source.entity_id),
                    integration_domain=str(source.integration_domain or ""),
                    raw_capability_id=source.raw_capability_id,
                    normalizer=str(rule.get("normalizer") or "none"),
                    outputs=declared_outputs,
                    precedence=precedence,
                    candidate_id=str(source.candidate_id),
                    native_unit=source.native_unit,
                    required=bool(required_by_input.get(input_id, False)),
                )
            )
            outputs.update(declared_outputs)

    return ActiveBindingPlan(
        asset_id=str(asset.asset_id),
        observations=tuple(sorted(observations, key=lambda row: (row.precedence, row.input_id, row.entity_id))),
        sources_by_input={
            input_id: tuple(sorted(rows, key=lambda row: row.precedence))
            for input_id, rows in source_rows.items()
        },
        entity_ids=tuple(sorted(entity_ids)),
        canonical_outputs=frozenset(outputs),
    )


def materialize_observations(
    hass: Any,
    plan: ActiveBindingPlan,
    semantic_properties: dict[str, Any],
) -> tuple[dict[str, tuple[int, Any, str]], list[str], list[str]]:
    """Materialize current canonical facts from a prebound plan."""

    candidates: dict[str, tuple[int, Any, str]] = {}
    required_missing: list[str] = []
    required_unknown: list[str] = []

    for bound in plan.observations:
        state = hass.states.get(bound.entity_id)
        raw = None if state is None else state.state
        attributes = {} if state is None else dict(getattr(state, "attributes", {}) or {})
        unit = bound.native_unit or attributes.get("unit_of_measurement")
        normalized = normalize_source_observation(
            bound.normalizer,
            bound.integration_domain,
            bound.raw_capability_id,
            raw,
            unit,
            attributes,
        )
        if "value" in normalized and len(bound.outputs) == 1:
            normalized = {**normalized, bound.outputs[0]: normalized["value"]}

        extra = [key for key in normalized if key != "value" and key in semantic_properties]
        materialized = tuple(dict.fromkeys((*bound.outputs, *extra)))
        usable = False
        declared = set(bound.outputs)
        for property_key in materialized:
            if property_key not in declared and property_key not in semantic_properties:
                continue
            value = normalized.get(property_key)
            if value is None:
                continue
            usable = True
            previous = candidates.get(property_key)
            if previous is None or bound.precedence >= previous[0]:
                candidates[property_key] = (bound.precedence, value, bound.candidate_id)

        if bound.required:
            if state is None or raw in (None, "unknown", "unavailable", ""):
                required_missing.append(bound.input_id)
            elif not usable:
                required_unknown.append(bound.input_id)

    return candidates, required_missing, required_unknown
