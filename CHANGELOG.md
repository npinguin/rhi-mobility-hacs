# Changelog

## M0.7.1 — Structural runtime chain recovery

- Distribute the exact installable Mobility tree from canonical source main `dc285192e5b6dad967633157fc31d81770368d60`.
- Remove hidden runtime mutation of DomainBuildSpecification matching, builder versions, aliases and presentation; `MobilityModelRegistry` is now a pure loader of canonical generated contracts.
- Complete typed producer ownership for compatibility aliases and accepted logical-asset identity while keeping unresolved ownership and invalid normalization fail-closed.
- Treat stale source observations as temporary unavailability rather than normalization failure.
- Resolve Cupra/Data Act odometer semantics inside Mobility using the integration-native canonical mileage field; trip mileage is never promoted to vehicle odometer truth.
- Keep OCPP physical connector status distinct from central-system status and measured charger power optional.
- Preserve Audi central security/lock separately from charging-plug lock.
- Preserve the full normalized property, profile, image, Guest Vehicle, relationship, command/write, Energy interop and deterministic V1 compatibility surfaces.
- Source CI proves canonical source DBS = packaged DBS = registry output = Foundation publication and reports zero static semantic ownership gaps.
- Requires Foundation F1.7.5 and Shared Baseline 1.7.1.
- Target Home Assistant runtime validation remains mandatory before Mobility V2 is declared complete.

## M0.7.0 — Runtime truth architecture

- Introduce typed `PropertyResolution` as the single canonical runtime result consumed by HA, V1, diagnostics/coverage and Mobility→Energy interop.
- Add typed resolution status, quality, producer ownership and error classification; unresolved ownership fails closed.
- Preserve producer candidates before truth precedence and execute `truth_precedence` declaratively in the resolver.
- Make `producer_types` the canonical producer authority; singular `producer_type` becomes compatibility metadata only.
- Add typed binding, observation, property and control health plus product readiness.
- Distinguish configured, effective and physically observed vehicle/charger relationships without fabricating vehicle identity from connector state.
- Reject broad all-matching object creation for generic MQTT, Z-Wave JS and Shelly selections while keeping explicit concrete-device selections.
- Remove model-specific default-profile inference from integration identity alone.
- Keep V1 as a projection over V2 truth instead of a second value-resolution implementation.
- Publish resolved Mobility facts and command references to Energy rather than raw HA target details.
- Preserve the complete M0.6.7 property/profile/image/presentation surface; target Home Assistant runtime acceptance remains mandatory.
- Canonical source main: `40b3e8c8b78013090cde7bfbd23f8371a9fd0c96`.

## M0.6.7 — Completeness and presentation recovery

- Carry forward the M0.6.6 vehicle property-family and command recovery for AudiConnect, Cupra/Data Act and Mercedes sources.
- Restore target-proven security, door/window, hood/trunk, climate, range/odometer and maintenance/service mappings without conflating charging-plug lock state with central vehicle security.
- Restore vehicle command attribution for Foundation-proven config-entry service surfaces; AudiConnect uses its required `device_id + action` payload and Mercedes uses VIN-based routes where safely supported.
- Keep Mercedes unlock fail-closed when integration-managed security authorization is required.
- Expose the complete applicable canonical normalized property surface for every logical vehicle and charger. Missing truth remains visible with an explicit resolution reason instead of disappearing.
- Add fail-closed completeness diagnostics for normalized-property coverage and source-capability classification. Runtime acceptance requires zero ambiguous, unmapped, unclassified or unexplained properties/capabilities.
- Materialize selected profile metadata and profile-derived values through the canonical runtime while preserving source/configuration precedence.
- Add profile presentation and packaged profile images for Audi Q8, VW ID.4, Mercedes GLA, BMW X1, Renault Scenic, guest EV/PHEV, Wallbox OCPP, Peblar, utility plug and generic fallbacks.
- Give Guest Vehicle the same profile-selection and profile-presentation path as discovered vehicles.
- Preserve and expose vehicle ↔ charger relationships, including `vehicle.selected_charger` / effective charger and charger-side assigned vehicle semantics.
- Requires Foundation F1.7.5 and Shared Baseline 1.7.1.
- Source main CI is green at `0a8d1fb823192fe74650b3eae963228c0e391181`; target Home Assistant runtime acceptance remains pending this HACS test release.

## M0.6.5 — Fixed capability binding recovery

- Restore integration-provided technical capability identifiers as authoritative evidence while Foundation creates or repairs a binding.
- Keep mutable Home Assistant `current_entity_id` values out of semantic matching authority.
- Preserve accepted source bindings as the fixed runtime source of truth after onboarding/discovery.
- Restore target-proven Audi charging-state capability matching and OCPP physical connector state matching.
- Keep OCPP measured power optional where the integration does not expose it.
- Requires Foundation F1.7.5 and Shared Baseline 1.7.1.
- Runtime validation remains pending until the target Home Assistant proves real accepted bindings, assets and normalized properties.

## M0.5.10 — Public runtime usability correction

- Fix the Home Assistant options-flow HTTP 500 caused by assigning its read-only config-entry property.
- Restore the complete applicable vehicle and charger property layout instead of removing unknown source values from the public contract.
- Keep profile, configured, derived, relationship and editable properties visible for every applicable asset.
- Resolve deterministic default profiles for the supported Audi, Mercedes, VW ID.4, Peblar, MQTT utility-plug and OCPP source types; explicit user configuration remains authoritative.
- Preserve exact source provenance and the no-automatic-multi-source-fusion rule.

## M0.5.9 — Structural runtime correction

- Filter devices that cannot prove required Mobility inputs; OCPP Central System devices never become chargers.
- Keep filtered infrastructure devices from degrading valid runtime health.
- Remove manual vehicles from Foundation publication and add Mobility Options Flow CRUD for guest vehicles.
- Materialize guest profiles, battery facts, presence and charger assignments without technical bindings.
- Omit absent optional capabilities from diagnostics instead of emitting hundreds of `UNSUPPORTED` rows.
- Add observed Audi Connect and Mercedes identity variants with unchanged provenance and no source fusion.

## M0.5.8 — Repository migration / HACS packaging

- Migrated approved `M0.5.7` self-contained package into the standard `rhi-mobility` repository topology.
- Incremented Home Assistant integration version to `0.5.8` and release identity to `M0.5.8`.
- Added HACS metadata, GitHub workflows, repository build/verification scripts and migration inventories.
- Preserved Shared Baseline 1.7.0 exactly.
- No intended runtime, normalization, public entity, command, unique-ID or domain-contract semantic change.

## M0.5.7

Full original release notes are preserved at `release/source-package/M0.5.7/RELEASE_NOTES_M0.5.7.md`.
