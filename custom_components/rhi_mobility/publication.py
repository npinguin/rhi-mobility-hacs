from __future__ import annotations
from typing import Any
from pathlib import Path
import json


_DISCOVERY_REQUIREMENTS_PATH = Path(__file__).resolve().parent / "contracts" / "runtime" / "canonical_discovery_requirements.json"


def _canonical_discovery_requirements() -> dict[str, Any]:
    payload = json.loads(_DISCOVERY_REQUIREMENTS_PATH.read_text(encoding="utf-8"))
    if payload.get("contract_id") != "RHI_DOMAIN_DISCOVERY_REQUIREMENTS_V1":
        raise ValueError("canonical_discovery_requirements_contract_invalid")
    if payload.get("runtime_code_generation") is not False:
        raise ValueError("canonical_discovery_requirements_must_not_generate_runtime")
    return payload


def _validate_against_canonical_model(spec: dict[str, Any]) -> dict[str, Any]:
    requirements = _canonical_discovery_requirements()
    builder_id = str(spec.get("builder_id") or "")
    canonical = (requirements.get("builders") or {}).get(builder_id)
    if canonical is None:
        raise ValueError(f"domain_build_specification_undeclared_builder:{builder_id or 'missing'}")
    declared_inputs = canonical.get("inputs") or {}
    published_inputs = ((spec.get("candidate_requirements") or {}).get("normalized_inputs") or [])
    undeclared = sorted({
        str(row.get("input_id") or "")
        for row in published_inputs
        if row.get("input_id") and str(row.get("input_id")) not in declared_inputs
    })
    if undeclared:
        raise ValueError(
            f"domain_build_specification_undeclared_input:{builder_id}:" + ",".join(undeclared)
        )
    return spec


class MobilityBuildSpecificationProvider:
    """Bounded Shared Baseline 1.8.1 DomainBuildSpecification provider.

    Foundation owns ingestion and validation. Mobility only exposes immutable
    build specifications through the canonical synchronous provider surface.
    """

    publisher_domain = "rhi_mobility"
    publication_revision = 13

    def __init__(self, registry) -> None:
        self.registry = registry

    def get_build_specifications(self) -> tuple[dict[str, Any], ...]:
        """Return the bounded authoritative Mobility build specifications.

        Manual/guest vehicles are deliberately not published. They are Mobility-owned
        semantic products and never participate in Foundation integration/device discovery.
        """
        return tuple(
            _validate_against_canonical_model(self.registry.specs[key])
            for key in sorted(self.registry.specs)
            if key not in set(_canonical_discovery_requirements().get("manual_product_builders_not_published") or [])
        )

    def specifications(self) -> tuple[dict[str, Any], ...]:
        """Internal compatibility alias; Foundation uses get_build_specifications()."""
        return self.get_build_specifications()
