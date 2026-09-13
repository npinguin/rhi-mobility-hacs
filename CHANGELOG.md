# Changelog

## M0.7.3 — Runtime quiescence and supervision boundary recovery

- Require Foundation `F1.8.1` / Shared Baseline `1.8.1` as the exact compatible control-plane contract.
- Remove all Mobility runtime/control notifications back into Foundation supervision; supervision registration is lifecycle-only and downstream observability never re-enters discovery or binding.
- Adopt `RHI_DOMAIN_SUPERVISORY_STATUS_V1` contract `1.1.0`: shared supervision contains generic technical/domain readiness only; Mobility intelligence remains Mobility-owned and does not affect Foundation readiness.
- Stop the command executor from waking the command/control publication lane on ordinary telemetry when no execution is awaiting late readback.
- Move broad Mobility/intelligence device surfaces off the per-asset runtime telemetry listener; scalar properties remain live through asset-scoped listeners while broad summaries update on bounded topology/control changes.
- Add regression gates for boot quiescence, no supervision feedback, no broad-surface telemetry subscription and exact Foundation/Mobility baseline pairing.
- Preserve M0.7.2 semantic catalogs, integration adapters, V1 facade, profile/property/relationship/command contracts and public entity IDs; this release is a runtime/recovery delta, not a semantic remap.
- Target Home Assistant cold-boot, restart, unload/reload, upgrade and rollback acceptance remains mandatory before public promotion.

## M0.7.2 — V1 facade closure and domain supervision

- Adopt Shared Baseline `1.8.0` and publish Mobility domain supervisory status without moving Mobility semantic ownership into Foundation.
- Isolate all intentional V1 compatibility debt under `custom_components/rhi_mobility/compat_v1/`; V1 is a removable projection/facade over canonical `MOBILITY_PUBLIC_RUNTIME_V2` truth and command surfaces.
- Add fail-closed V1 facade parity and compatibility-architecture audits so legacy entity shape, placement and write semantics cannot silently drift.
- Complete command-surface closure checks from canonical command declaration through target resolution, execution lifecycle and readback attribution.
- Add Mobility-owned logical device surfaces and source diagnostics while keeping HA device/entity projection a renderer of backend-owned semantics.
- Keep guest vehicles Mobility-owned, preserve add/edit/remove persistence, and retain the Home Assistant 2026.9 options-flow correction without reintroducing obsolete `battery_energy_kwh` form authoring.
- Add zero-runtime-tech-debt and device-surface architecture gates alongside canonical contract authority, normalized mapping coverage and completeness/presentation gates.
- Preserve the M0.7.1 normalized property, profile, image, relationship, Energy interop and physical command behavior with no intentional public entity ID, unique ID, service or command rename/removal.
- Static source, package, test and hassfest validation are required to be green for the merge candidate. Target Home Assistant clean-install, upgrade, rollback and full V1 runtime parity remain explicit post-merge test-candidate acceptance gates.

## M0.7.1 — Structural runtime chain recovery

- Move all effective Foundation-facing Mobility matching, builder-version and presentation semantics out of runtime mutation code and into the canonical generated DomainBuildSpecification authority.
- Make `MobilityModelRegistry` a pure loader; runtime code no longer rewrites technical matches, builder versions, aliases, presentation or source evidence.
- Add a fail-closed contract-authority CI gate proving canonical source DBS, packaged DBS, registry output and Foundation publication are identical.
- Add deterministic adapter-conformance fixture generation and CI drift detection so adapter changes cannot silently outpace their test evidence.
- Complete typed producer ownership for compatibility aliases and accepted logical-asset identity; stale observations resolve as temporary unavailability rather than normalization errors.
- Keep invalid values and unresolved ownership hard-failing; the completeness gate is not relaxed.
- Correct Cupra/Data Act odometer selection using integration-native technical identity so trip mileage is never promoted to canonical vehicle odometer truth.
- Keep OCPP physical connector state distinct from central-system status and retain measured charger power as an optional capability.
- Preserve historical runtime-observed evidence as history rather than forcing old published matches to equal current canonical matching rules.
- Derive build/package release identity from the integration manifest and runtime release constant instead of hardcoded legacy versions.
- Preserve the complete M0.7.0/M0.6.7 public property, profile, image, guest-vehicle, relationship, command and V1 compatibility surfaces while repairing the authority chain.
- Target Home Assistant acceptance remains mandatory before the release can be declared complete.

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
