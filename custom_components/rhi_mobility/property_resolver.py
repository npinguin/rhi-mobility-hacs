from __future__ import annotations

from typing import Any

from .producer_policy import declared_producer_types
from .property_resolution import (
    PropertyProducerKind,
    PropertyQuality,
    PropertyResolution,
    PropertyResolutionError,
    PropertyResolutionStatus,
)


_PRODUCER_KIND = {
    "SOURCE": PropertyProducerKind.SOURCE,
    "PROFILE": PropertyProducerKind.PROFILE,
    "CONFIGURED": PropertyProducerKind.CONFIGURATION,
    "RELATIONSHIP": PropertyProducerKind.RELATIONSHIP,
    "CONTROL_READBACK": PropertyProducerKind.CONTROL_READBACK,
    "DERIVED": PropertyProducerKind.DERIVED,
    "ALIAS": PropertyProducerKind.ALIAS,
}

_CAPABILITY_FAILURES = {
    "AMBIGUOUS": PropertyResolutionError.AMBIGUOUS_SOURCE,
    "CARDINALITY_ERROR": PropertyResolutionError.CARDINALITY_ERROR,
    "BLOCKED_BY_TARGET_SCOPE": PropertyResolutionError.TARGET_SCOPE_ERROR,
    "INVALID_VALUE": PropertyResolutionError.NORMALIZATION_ERROR,
    "NORMALIZATION_ERROR": PropertyResolutionError.NORMALIZATION_ERROR,
    "INVALID_EVIDENCE": PropertyResolutionError.NORMALIZATION_ERROR,
}

_CAPABILITY_PRIORITY = (
    "AMBIGUOUS",
    "CARDINALITY_ERROR",
    "BLOCKED_BY_TARGET_SCOPE",
    "INVALID_VALUE",
    "NORMALIZATION_ERROR",
    "INVALID_EVIDENCE",
    "BLOCKED_BY_REVIEW",
    "REJECTED_REVIEW_REQUIRED",
    "STALE",
    "UNAVAILABLE",
    "NORMALIZED",
    "MATCHED",
    "MISSING",
)


def _quality_for(
    *,
    producer: PropertyProducerKind | None,
    status: PropertyResolutionStatus,
    capability_status: str | None,
) -> PropertyQuality:
    """Derive quality from typed ownership/status only; never parse free-form strings."""
    if status == PropertyResolutionStatus.RESOLUTION_ERROR:
        return PropertyQuality.INVALID
    if status != PropertyResolutionStatus.AVAILABLE:
        return PropertyQuality.STALE if capability_status == "STALE" else PropertyQuality.UNKNOWN
    if producer in {PropertyProducerKind.PROFILE, PropertyProducerKind.DERIVED}:
        return PropertyQuality.ESTIMATED
    return PropertyQuality.VALID


class PropertyResolver:
    """Typed resolution/status view over prebound canonical Mobility truth.

    MobilityRuntimeManager materialises the single canonical winner using the semantic
    catalog precedence. This layer never arbitrates producers again; it classifies the
    already-selected value with typed availability, provenance, quality and error semantics
    for consumers such as HA projection, Energy and diagnostics.
    """

    def __init__(self, manager: Any, controller: Any = None, *, registry: Any = None) -> None:
        self.manager = manager
        self.controller = controller
        self.registry = registry if registry is not None else getattr(manager, "registry", None)

    def _definition(self, asset_id: str, property_id: str) -> dict[str, Any] | None:
        asset = self.manager.assets.get(asset_id)
        if asset is None:
            return None
        if self.registry is None:
            return None
        from .model_registry import MobilityModelRegistry
        definition = MobilityModelRegistry.property_definition(
            self.registry, property_id, asset.concept_id
        )
        return dict(definition) if isinstance(definition, dict) else None

    def _capability_status(self, asset_id: str, property_id: str) -> str | None:
        statuses: set[str] = set()
        for row in getattr(self.manager, "_capability_diagnostics", ()) or ():
            if not isinstance(row, dict):
                continue
            row_asset = row.get("asset_id") or row.get("logical_asset_id")
            if row_asset not in (None, "", asset_id):
                continue
            outputs = {str(value) for value in row.get("normalized_properties") or ()}
            if property_id not in outputs:
                continue
            status = str(row.get("status") or "").upper()
            if status:
                statuses.add(status)
        for wanted in _CAPABILITY_PRIORITY:
            if wanted in statuses:
                return wanted
        return sorted(statuses)[0] if statuses else None

    @staticmethod
    def _absence_status(
        definition: dict[str, Any], capability_status: str | None
    ) -> tuple[PropertyResolutionStatus, PropertyResolutionError | None, str]:
        if capability_status in _CAPABILITY_FAILURES:
            return (
                PropertyResolutionStatus.RESOLUTION_ERROR,
                _CAPABILITY_FAILURES[capability_status],
                capability_status.lower(),
            )
        if capability_status in {"BLOCKED_BY_REVIEW", "REJECTED_REVIEW_REQUIRED"}:
            return PropertyResolutionStatus.CONFIGURATION_REQUIRED, None, "configuration_review_required"
        if capability_status in {"STALE", "UNAVAILABLE", "NORMALIZED", "MATCHED"}:
            return PropertyResolutionStatus.UNAVAILABLE_TEMPORARY, None, "temporarily_unavailable"
        if capability_status == "MISSING":
            return PropertyResolutionStatus.UNSUPPORTED_BY_SOURCE, None, "source_capability_missing"

        declared = set(declared_producer_types(definition))
        if declared and declared <= {"CONFIGURED", "PROFILE"}:
            return PropertyResolutionStatus.CONFIGURATION_REQUIRED, None, "configuration_required"
        if "RELATIONSHIP" in declared and not (declared & {"SOURCE", "CONTROL_READBACK", "DERIVED"}):
            return PropertyResolutionStatus.CONFIGURATION_REQUIRED, None, "relationship_required"
        if declared & {"SOURCE", "CONTROL_READBACK"}:
            return PropertyResolutionStatus.UNSUPPORTED_BY_SOURCE, None, "unsupported_by_source"
        if "DERIVED" in declared:
            return PropertyResolutionStatus.UNAVAILABLE_TEMPORARY, None, "derived_dependencies_unavailable"
        return PropertyResolutionStatus.UNSUPPORTED_BY_SOURCE, None, "no_available_producer"

    def _alias_resolution(self, asset_id: str, property_id: str, canonical: str) -> PropertyResolution:
        target_asset_id = asset_id
        # A vehicle's requested-power display is a typed alias of the effective
        # charger's *physical* controller readback, not a vehicle-local charger fact.
        if property_id == "vehicle.requested_charge_power_kw" and canonical == "charger.requested_power_kw":
            owner = getattr(self.manager, "effective_charger_for_vehicle", None)
            target_asset_id = owner(asset_id) if callable(owner) else None
            if not target_asset_id or target_asset_id not in self.manager.assets:
                return PropertyResolution(
                    asset_id=asset_id,
                    property_id=property_id,
                    value=None,
                    producer_kind=PropertyProducerKind.ALIAS,
                    status=PropertyResolutionStatus.CONFIGURATION_REQUIRED,
                    quality=PropertyQuality.UNKNOWN,
                    reason_code="effective_charger_unavailable",
                    source_reference={"compatibility_alias_of": canonical},
                    dependencies=(canonical,),
                )
        target = self.resolve(target_asset_id, canonical)
        reference = dict(target.source_reference)
        if target_asset_id != asset_id:
            reference["canonical_target_asset_id"] = target_asset_id
        reference["compatibility_alias_of"] = canonical
        return PropertyResolution(
            asset_id=asset_id,
            property_id=property_id,
            value=target.value,
            producer_kind=PropertyProducerKind.ALIAS,
            status=target.status,
            quality=target.quality,
            reason_code=target.reason_code,
            error_kind=target.error_kind,
            observed_at=target.observed_at,
            source_binding_id=target.source_binding_id,
            source_reference=reference,
            dependencies=(canonical,),
            configuration_revision=target.configuration_revision,
            build_input_revision=target.build_input_revision,
        )

    def resolve(self, asset_id: str, property_id: str) -> PropertyResolution:
        asset = self.manager.assets.get(asset_id)
        if asset is None:
            return PropertyResolution(
                asset_id=asset_id,
                property_id=property_id,
                value=None,
                producer_kind=None,
                status=PropertyResolutionStatus.RESOLUTION_ERROR,
                quality=PropertyQuality.INVALID,
                reason_code="asset_not_found",
                error_kind=PropertyResolutionError.INVALID_BINDING,
            )

        aliases = dict(getattr(self.registry, "semantic_aliases", {}) or {})
        canonical_alias = str(aliases.get(property_id, property_id))
        if canonical_alias != property_id:
            return self._alias_resolution(asset_id, property_id, canonical_alias)

        definition = self._definition(asset_id, property_id)
        if definition is None:
            return PropertyResolution(
                asset_id=asset_id,
                property_id=property_id,
                value=None,
                producer_kind=None,
                status=PropertyResolutionStatus.NOT_APPLICABLE,
                quality=PropertyQuality.UNKNOWN,
                reason_code="not_applicable",
            )

        snap = self.manager.snapshots.get(asset_id)
        # Prebound canonical values, quality and provenance already belong to the
        # manager. Keep the existing provider only for non-materialized relationship,
        # command/readback and configuration owners until their native cutover.
        canonical_key = str(
            (getattr(self.registry, "semantic_aliases", {}) or {}).get(
                property_id, property_id
            )
        )
        declared_owners = set(declared_producer_types(definition))
        use_prebound = (
            snap is not None
            and canonical_key in (getattr(snap, "values", {}) or {})
            and callable(getattr(self.manager, "property_provenance", None))
            and not declared_owners.intersection(
                {"CONTROL_READBACK", "RELATIONSHIP", "CONFIGURED"}
            )
        )
        if use_prebound:
            value = snap.values[canonical_key]
            reference = dict(self.manager.property_provenance(asset_id, canonical_key) or {})
        elif canonical_key in {
            "vehicle.selected_charger",
            "vehicle.effective_charger",
            "charger.assigned_vehicle_id",
            "charger.effective_assigned_vehicle_id",
        } and callable(getattr(self.manager, "effective_charger_for_vehicle", None)):
            # The existing relationship resolution is Mobility-owned and does
            # not promote connector occupancy to identified vehicle identity.
            if canonical_key == "vehicle.selected_charger":
                from .relationship_resolution import resolve_vehicle_charger_relationship
                value = resolve_vehicle_charger_relationship(
                    self.manager, asset_id
                ).configured_charger_id
            elif canonical_key == "vehicle.effective_charger":
                value = self.manager.effective_charger_for_vehicle(asset_id)
            else:
                assigned = getattr(self.manager, "configured_vehicle_for_charger", None)
                value = assigned(asset_id) if callable(assigned) else None
            reference = {
                "producer_kind": "RELATIONSHIP",
                "derived_from": ["mobility.configured_assignment"],
                "quality": "mobility_relationship",
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
            }
        elif self.controller is not None and canonical_key in {
            "charger.requested_power_kw", "charger.requested_charge_power_kw",
            "vehicle.requested_charge_power_kw", "charger.current_limit_a",
            "limits.requested_current_limit_a", "vehicle.charge_mode",
        }:
            # Physical controller is the unique write/readback owner. The
            # requested setpoint never masquerades as measured charge power.
            controller = self.controller
            charger_id = asset_id
            if canonical_key == "vehicle.requested_charge_power_kw":
                get_charger = getattr(self.manager, "effective_charger_for_vehicle", None)
                charger_id = get_charger(asset_id) if callable(get_charger) else None
            if canonical_key == "vehicle.charge_mode":
                fn = getattr(controller, "vehicle_charge_mode_readback", None)
                value = fn(asset_id) if callable(fn) else None
            elif canonical_key in {"charger.current_limit_a", "limits.requested_current_limit_a"}:
                fn = getattr(controller, "requested_current_readback", None)
                value = fn(charger_id) if callable(fn) and charger_id else None
                if value is None and snap is not None:
                    value = (getattr(snap, "values", {}) or {}).get("charger.current_limit_a")
            else:
                fn = getattr(controller, "requested_power_readback", None)
                value = fn(charger_id) if callable(fn) and charger_id else None
            reference = {
                "producer_kind": "CONTROL_READBACK",
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
                "quality": "physical_setpoint_readback",
                "controller_owner": "rhi_mobility",
            }
        elif canonical_key in {"asset.display_name", "asset.short_name"}:
            # Asset identity is Mobility-owned; no fleet-wide public projection needed.
            observed = None if snap is None else snap.values.get(canonical_key)
            value = observed or asset.display_name
            reference = {
                "producer_kind": "CONFIGURED",
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
                "derived_from": ["mobility.asset_identity"],
            }
        elif canonical_key == "lifecycle_status":
            observed = None if snap is None else snap.values.get("asset.lifecycle_status")
            value = observed or self.manager.configuration_value(asset_id, "asset.lifecycle_status", "active")
            reference = {
                "producer_kind": "CONFIGURED",
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
                "derived_from": ["mobility.asset_lifecycle"],
            }
        elif canonical_key == "asset.selected_candidate_id":
            # Selection identity is defined by the accepted source bindings.
            candidates = sorted({
                source.candidate_id
                for binding in asset.source_bindings.values()
                for source in binding.inputs.values()
            })
            value = candidates[0] if len(candidates) == 1 else None
            reference = {
                "producer_kind": "SOURCE",
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
                "derived_from": ["mobility.accepted_source_bindings"],
            }
        elif canonical_key == "charger.observed_at":
            # Source freshness belongs to the accepted Mobility bindings.
            # Read only their specific HA states; never rebuild a fleet snapshot.
            stamps = []
            hass = getattr(self.manager, "hass", None)
            states = getattr(hass, "states", None)
            for binding in asset.source_bindings.values():
                for source in binding.inputs.values():
                    entity_id = getattr(source, "entity_id", None)
                    if not entity_id or states is None:
                        continue
                    state = states.get(entity_id)
                    stamp = getattr(state, "last_updated", None) if state is not None else None
                    if stamp is not None:
                        stamps.append(stamp)
            value = max(stamps).isoformat() if stamps else None
            reference = {
                "producer_kind": "SOURCE",
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
                "derived_from": ["mobility.accepted_source_bindings"],
            }
        elif canonical_key == "charger.available_for_connection":
            # Source capability is already materialized in the canonical asset snapshot.
            value = None if snap is None else snap.values.get(canonical_key)
            reference = (
                dict(self.manager.property_provenance(asset_id, canonical_key) or {})
                if snap is not None else {}
            )
        elif canonical_key == "charger.available_for_control":
            # Only the physical execution owner can declare command availability.
            descriptors = getattr(self.controller, "command_descriptors", None)
            if callable(descriptors):
                value = any(
                    row.asset_id == asset_id and row.execution_allowed
                    for row in descriptors().values()
                )
            else:
                value = None
            reference = {
                "producer_kind": "DERIVED",
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
                "derived_from": ["mobility.command_descriptors"],
            }
        elif canonical_key in {"charger.snapshot_revision", "charger.health", "charger.health_reason"}:
            # Runtime metadata belongs to the canonical snapshot, not the
            # legacy fleet-wide Public Runtime provider.
            if snap is None:
                value = None
            elif canonical_key == "charger.snapshot_revision":
                value = snap.build_input_revision
            elif canonical_key == "charger.health":
                value = snap.health
            else:
                value = getattr(snap, "health_reason", None)
            reference = {
                "producer_kind": "DERIVED",
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
                "derived_from": ["mobility.runtime_snapshot"],
            }
        elif declared_owners == {"CONFIGURED"} and callable(
            getattr(self.manager, "configuration_value", None)
        ):
            # The single configuration owner is authoritative even when its
            # value is missing. Never fall back to a derived Public V2 value.
            value = self.manager.configuration_value(asset_id, canonical_key, None)
            reference = {
                "producer_kind": "CONFIGURED",
                "configuration_revision": int(
                    getattr(getattr(self.manager, "domain_config", None), "revision", 0) or 0
                ),
                "normalization_status": "AVAILABLE" if value is not None else "UNKNOWN",
            }
        else:
            value = None if snap is None else (getattr(snap, "values", {}) or {}).get(canonical_key)
            provenance = getattr(self.manager, "property_provenance", None)
            reference = dict(provenance(asset_id, canonical_key) or {}) if callable(provenance) else {}

        producer = None
        if value is not None:
            declared = tuple(declared_producer_types(definition))
            explicit = str(reference.get("producer_kind") or "")
            producer = _PRODUCER_KIND.get(explicit)
            if producer is None and len(declared) == 1:
                producer = _PRODUCER_KIND.get(declared[0])
            if producer is None:
                # Compatibility-only fallback for legacy projection rows that have
                # already-resolved values but predate explicit producer metadata.
                # This labels ownership only; it never selects/replaces the value.
                for name in definition.get("truth_precedence") or ():
                    kind = _PRODUCER_KIND.get(str(name))
                    if kind is not None:
                        producer = kind
                        break

        # Diagnostics classification is needed only for absent values; avoid
        # scanning the capability ledger for every healthy scalar read.
        capability_status = self._capability_status(asset_id, property_id) if value is None else None
        if value is not None:
            status = PropertyResolutionStatus.AVAILABLE
            error_kind = None
            reason = None
        else:
            status, error_kind, reason = self._absence_status(definition, capability_status)

        return PropertyResolution(
            asset_id=asset_id,
            property_id=property_id,
            value=value if status == PropertyResolutionStatus.AVAILABLE else None,
            producer_kind=producer,
            status=status,
            quality=_quality_for(producer=producer, status=status, capability_status=capability_status),
            reason_code=reason,
            error_kind=error_kind,
            observed_at=reference.get("observed_at"),
            source_binding_id=reference.get("source_binding_id"),
            source_reference=reference,
            dependencies=tuple(str(x) for x in reference.get("derived_from") or ()),
            configuration_revision=int(reference.get("configuration_revision", 0) or 0),
            build_input_revision=0 if snap is None else int(getattr(snap, "build_input_revision", 0) or 0),
        )

    def resolve_asset(self, asset_id: str) -> dict[str, PropertyResolution]:
        from .model_registry import MobilityModelRegistry

        asset = self.manager.assets.get(asset_id)
        if asset is None:
            return {}
        return {
            property_id: self.resolve(asset_id, property_id)
            for property_id in MobilityModelRegistry.applicable_property_keys(
                self.registry, asset.concept_id
            )
        }
