# Changelog

## M0.9.4 — Product configuration / runtime parity closure

- Publish structured backend-owned profile and charger choices so the frozen UX receives readable labels instead of unusable raw option IDs.
- Keep configured `vehicle.selected_charger` distinct from effective/physical relationship truth and allow explicit unassignment.
- Keep VehicleProfile/ChargerProfile selection Mobility-owned, clearable and topology-published without mutating Foundation technical selection.
- Restore profile-owned image selection end-to-end: assigning a profile drives canonical image identity; UX remains inference-free.
- Honor catalog `hide_if_unavailable` semantics in the V1 facade for unavailable read-only rows while retaining all canonical V2 typed resolutions for diagnostics/coverage.
- Keep editable configuration-required rows visible and writable.
- Add behavioral gates for profile choices, charger assignment, clear semantics, configured-vs-effective separation, structured V1 editor metadata, image identity and empty-state presentation.
- Preserve Shared Baseline 1.8.1, Foundation F1.8.3 target, exact R43.2.65/V1 entity identities, V2 canonical ownership and zero accepted technical debt.
- Target Home Assistant persistence/runtime/upgrade/rollback proof remains mandatory before pilot or production approval.

## M0.9.3 — Release integrity / zero-debt closure

- Make release correctness fail-closed: active documentation, release metadata, source validation, packaging, distribution provenance and approval must agree for the declared release state.
- Separate source/package verification from target-runtime approval so a fully qualified release can actually pass the production workflow.
- Verify every generated install ZIP by reopening it and comparing the exact member set and bytes with `custom_components/rhi_mobility/`; reject duplicate, missing, unexpected, corrupt, path-unsafe or generated members.
- Require two independent package builds with identical SHA-256 output in normal CI and candidate publication.
- Bind recorded candidate package SHA-256 to the exact verified archive.
- Verify candidate-to-production equivalence by exact runtime file set/hash plus version, Shared Baseline and Foundation target rather than brittle equality with an evidence-only source commit.
- Make current sensitive-data scanning a mandatory public-distribution/release gate.
- Publish HACS TEST CANDIDATE releases as GitHub prereleases and remove false-positive PASS/RELEASED summaries from failure paths.
- Synchronize current README, product/architecture/ownership/lifecycle/requirements, installation/upgrade, pilot/handover, release governance, release notes and active release evidence with M0.9.3 / Shared Baseline 1.8.1 / Foundation F1.8.3.
- Remove stale, non-consumed Foundation-carried `mobility_control_profile` / `mobility_planning_profile` authority metadata plus dead PreparedBuildInput/manager carrier lanes; current control/planning views remain derived from Mobility-owned VehicleProfile/ChargerProfile and semantic configuration.
- Add a permanent zero-debt gate that rejects reintroduction of those Foundation semantic-profile carriers and verifies canonical/packaged runtime-model identity.
- Preserve M0.9.2 observable runtime semantics, V2 canonical authority, frozen R43.2.65/V1 exterior, Foundation-facing shared contract versions, builder version/publication revision and frozen Mobility UX unchanged.
- Known accepted technical debt remains exactly `0`.

## M0.9.2 — Frozen UX V1 parity closure

- Keep Mobility UX frozen and restore compatibility strictly in the V1 facade over canonical V2 truth.
- Restore frozen-UX component/layout row shape and property-index ownership/placement metadata.
- Project configured Mobility assignments into the historical V1 selected/effective relationship vocabulary without fabricating physical vehicle identity.
- Restore legacy V1 command invocation metadata while V2 remains command support/readiness/execution owner.
- Translate V2 profile/image identity into the frozen V1 image-key namespace.
- Refresh profile projection from the current Mobility profile registry and restore compatibility health projection.
- Preserve the required R43.2.65/V1 public entity identity set with no intentional Foundation-facing contract change.
- Static parity/package/HACS gates passed for the test candidate; target Home Assistant parity and lifecycle acceptance remain separate gates.

## M0.9.1 — Pilot closure: profiles and readiness

- Keep exactly two profile types: `VehicleProfile` and `ChargerProfile`.
- Add Mobility-owned create/edit/delete profile lifecycle and connected/guest asset profile assignment without mutating Foundation technical selection or `AcceptedSourceBinding`.
- Treat packaged profiles as immutable defaults with a bounded Mobility-owned configured overlay; prevent deletion while referenced.
- Allow guest vehicles to use the normal VehicleProfile inventory instead of two hard-coded guest profile IDs.
- Keep model identity and image identity profile-owned rather than UX-inferred.
- Stop optional feature configuration such as owner/location/target SoC/ready-by/charger assignment from globally collapsing otherwise valid asset readiness.
- Evaluate accepted command execution readiness against the live accepted HA source so recovered OCPP write surfaces no longer remain permanently blocked by stale discovery-time availability.
- Keep unsupported/unavailable writes fail-closed and preserve Peblar/read-only behavior where no attributable write evidence exists.
- Preserve Shared Baseline 1.8.1, Foundation-facing contract versions, V1 identities and no-automatic-fusion rule.

## M0.9.0 — Product semantic ownership

- Move vehicle/charger semantic product configuration into Mobility ownership while Foundation remains technical discovery/configured technical-selection authority.
- Drive product configuration from canonical semantic property/profile catalogs rather than per-integration product-flow branches.
- Persist revisioned `domain_semantic_configuration` without allowing semantic changes to mutate technical source identity, selected candidates or Foundation build-input revision.
- Add selected-input semantic policy for optional evidence and deterministic integration-specific semantic disambiguation without extending the shared SDBI envelope.
- Keep automatic multi-source fusion forbidden and writable capability attributable to explicit accepted technical evidence only.
- Keep Peblar read-only without write evidence and OCPP writes behind accepted attributable surfaces/readback semantics.
- Preserve V2/V1/Energy/public command identity boundaries and one-generation lifecycle/teardown behavior.
- Target-runtime product completeness, relationships, placement and physical execution proof remain mandatory before pilot approval.

## M0.8.0 — KISS runtime projection

- Simplify the Mobility runtime/projection path while preserving canonical V2 truth, V1 compatibility, command safety and Shared Baseline 1.8.1 ownership boundaries.
- Keep runtime measurements direct from accepted source bindings and keep Foundation outside measurement/command fast paths.
- Remove/avoid speculative generic runtime abstractions in favor of domain-specific typed projection and existing resolver/manager authorities.
- Preserve public/entity/command semantics and require target Home Assistant acceptance before promotion.

## M0.7.9 — Foundation reload serialization

- Serialize Foundation/Mobility structural reload handling so overlapping provider/reload generations cannot create duplicate registrations or stale teardown effects.
- Preserve last-good runtime semantics, generation-owned lifecycle cleanup and existing public/semantic surfaces.
- Keep runtime telemetry outside Foundation structural refresh and require bounded convergence after reload/reconfiguration.

## M0.7.8 — Reload quiescence

- Harden unload/reload quiescence so old Mobility generations release listeners/providers/services before replacement activation.
- Keep unsubscribe/teardown idempotent and prevent duplicate runtime subscriptions/event amplification across reload cycles.
- Preserve the existing semantic catalogs, V1/V2 surfaces, Energy boundary and command execution semantics.

## M0.7.7 — Foundation 1.8.2 lifecycle compatibility

- Accept Foundation F1.8.1 and F1.8.2 only while the Shared Baseline remains exactly 1.8.1; unknown Foundation releases still fail closed.
- Adopt Foundation F1.8.2 generation-owned build/specification and supervision unsubscribe handles so an old unload cannot remove a newer provider generation during reload races.
- Keep the F1.8.1 unregister path as a backward-compatible fallback; no shared contract, binding, normalization, property, profile, relationship, command or public entity contract changes are introduced.
- Add producer-owned config-entry deletion cleanup through Foundation F1.8.2 `async_remove_domain_configuration`; normal unload/restart preserves Foundation-persisted Mobility technical intent.
- Preserve M0.7.6 runtime/control publication separation, Mobility-to-Energy quiescence and R43.2.65/MOBILITY_PUBLIC_RUNTIME_V1 facade behavior.
- Target Home Assistant qualification with Foundation F1.8.2 remains mandatory before pilot/stable promotion.

## M0.7.6 — Runtime boundary quiescence

- Restore the existing ownership boundary between Mobility runtime truth and command/activity control notifications without introducing a new event framework.
- Split the frozen V1 compatibility publisher into independent coalesced runtime and control lanes; control changes now refresh only command/activity-owned surfaces.
- Keep `sensor.mobility_energy_asset_publication` change-only and remove command-history churn (`last_command_result`) as a changing Mobility-to-Energy dependency while preserving its exact V1 attribute shape.
- Preserve M0.7.5 startup handoff convergence, all normalized properties, profiles, relationships, command semantics, public entity IDs and R43.2.65/MOBILITY_PUBLIC_RUNTIME_V1 compatibility.
- Keep Foundation F1.8.1 / Shared Baseline 1.8.1 unchanged and authoritative; canonical runtime model identity remains M0.7.2 because no mapping/normalization/business semantics changed.
- Align all release/distribution identity metadata on M0.7.6 so HACS candidate staging remains fail-closed and reproducible.
- Static qualification is green with 240/240 tests, contract/drift verification, Hassfest and deterministic packaging. Target Home Assistant quiescence, Energy coexistence, unload/reload and bounded event convergence remain mandatory runtime gates.

## M0.7.5 — Startup handoff convergence

- Close the target-HA startup race proven by M0.7.4 diagnostics: Mobility consumed a pre-publication Foundation slice before Foundation's provider-triggered structural refresh completed during the same setup window.
- Perform exactly one final `SelectedDomainBuildInput` read after Home Assistant platform setup, then reconcile projection and shared structural supervision before starting the V1 state publisher.
- Keep Foundation F1.8.1 / Shared Baseline 1.8.1 unchanged and authoritative; the fix belongs entirely in Mobility's consumption/startup lifecycle.
- Keep the existing structural Foundation event listener as the only ongoing handoff trigger after setup; no polling, timer, retry loop, sleep or Foundation refresh call is introduced.
- Preserve all M0.7.4 semantic catalogs, normalized property keys, profiles, relationships, commands, public entity IDs and R43.2.65/MOBILITY_PUBLIC_RUNTIME_V1 projection contracts.
- Static qualification is green with 235/235 tests, contract/drift verification, Hassfest and deterministic packaging. Target Home Assistant runtime proof remains mandatory before production approval.

## M0.7.4 — Foundation handoff and materialization recovery

- Fix the startup/control-plane race that allowed Mobility to remain at `WAITING_FOR_FOUNDATION` even when Foundation F1.8.1 had already published a valid `SelectedDomainBuildInput` slice.
- Preserve domain-first startup: if the Mobility handoff slice is not published yet, record bounded `WAITING_FOR_FOUNDATION_REFRESH` evidence with timestamp/reason and consume the later structural Foundation event instead of adding a hard config-entry readiness dependency.
- Keep Mobility build-specification publication Foundation-owned at the shared registry boundary and consume only the authoritative `SelectedDomainBuildInput`; no Foundation private candidate store or runtime measurement path is introduced.
- Register or structurally refresh Mobility supervision only after a handoff build result has actually been processed, so Foundation does not retain a stale pre-build `CONFIGURATION_REQUIRED` snapshot; runtime telemetry never triggers Foundation supervision.
- Preserve capability-isolated materialization: valid Audi/MBAPI/OCPP/Peblar/MQTT selections can materialize independently while source-specific Wallbox/Cupra findings remain scoped to their own selection/capability.
- Recognize the manager's canonical `ACCEPTED` build result as `OK` in shared supervision; `STALE` and `REJECTED` remain explicit fail-closed states.
- Make coverage fail closed when configured Mobility build inputs exist but zero logical assets materialize; a configured-empty runtime can no longer report a false-green completeness PASS.
- Preserve topology-driven dynamic HA projection: scalar, editable and diagnostic entities remain created from materialized logical assets, while the R43.2.65/MOBILITY_PUBLIC_RUNTIME_V1 surface remains a projection over canonical V2 truth.
- No public entity ID, unique ID, service, command name, semantic property key, profile or ownership boundary is intentionally renamed or removed.
- Target Home Assistant runtime qualification remains mandatory: this release may become a versioned test candidate after source/package/HACS/hassfest gates pass, but it is not production-approved until the exact F1.8.1 + M0.7.4 deployment is proven.

## M0.7.3 — Runtime quiescence and supervision boundary recovery

- Require Foundation `F1.8.1` / Shared Baseline `1.8.1` as the exact compatible control-plane contract.
- Remove all Mobility runtime/control notifications back into Foundation supervision; supervision registration is lifecycle-only and downstream observability never re-enters discovery or binding.
- Adopt `RHI_DOMAIN_SUPERVISORY_STATUS_V1` contract `1.1.0`: shared supervision contains generic technical/domain readiness only; Mobility intelligence remains Mobility-owned and does not affect Foundation readiness.
- Stop the command executor from waking the command/control publication lane on ordinary telemetry when no execution is awaiting late readback.
- Move broad Mobility/intelligence device surfaces off the per-asset runtime telemetry listener; scalar properties remain live through asset-scoped listeners while broad summaries update on bounded topology/control changes.
- Retain the last-good Mobility runtime across transient Foundation selected-input registry gaps; only an explicit Foundation `removed` event clears the authoritative Mobility slice.
- Isolate source/property normalization conversion failures so one bad value cannot abort unrelated asset truth; required failures degrade the affected asset, optional failures remain scoped and diagnosable, and unknown normalizer names still fail closed as contract/programming errors.
- Add regression gates for boot quiescence, no supervision feedback, no broad-surface telemetry subscription, exact Foundation/Mobility baseline pairing, transient handoff gaps, explicit removal, and required/optional normalization-fault isolation.
- Preserve M0.7.2 semantic catalogs, integration adapters, V1 facade, profile/property/relationship/command contracts and public entity IDs; this release is a runtime/recovery delta, not a semantic remap.
- Source validation, deterministic packaging, hassfest, candidate publication and public HACS validation are green for the merged candidate. Target Home Assistant cold-boot, restart, unload/reload, clean-install, upgrade and rollback acceptance remains mandatory before stable public promotion.

## M0.7.2 — V1 facade closure and domain supervision

- Adopt Shared Baseline `1.8.0` and publish Mobility domain supervisory status without moving Mobility semantic ownership into Foundation.
- Isolate all intentional V1 compatibility code under `custom_components/rhi_mobility/compat_v1/`; V1 is a removable projection/facade over canonical `MOBILITY_PUBLIC_RUNTIME_V2` truth and command surfaces.
- Add fail-closed V1 facade parity and compatibility-architecture audits so legacy entity shape, placement and write semantics cannot silently drift.
- Complete command-surface closure checks from canonical command declaration through target resolution, execution lifecycle and readback attribution.
- Add Mobility-owned logical device surfaces and source diagnostics while keeping HA device/entity projection a renderer of backend-owned semantics.
- Keep guest vehicles Mobility-owned, preserve add/edit/remove persistence, and retain the Home Assistant 2026.9 options-flow correction without reintroducing obsolete `battery_energy_kwh` form authoring.
- Add zero-runtime-tech-debt and device-surface architecture gates alongside canonical contract authority, normalized mapping coverage and completeness/presentation gates.
- Preserve the complete M0.7.1 normalized property, profile, image, relationship, Energy interop and physical command behavior with no intentional public entity ID, unique ID, service or command rename/removal.
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
- Preserve the complete M0.7.0/M0.6.7 public property, profile, image/presentation surface; target Home Assistant runtime acceptance remains mandatory before release can be declared complete.

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
- Added HACS metadata, GitHub workflows, repository build/verification scripts and migration inventories, checksums and CI gates.
- Preserved Shared Baseline 1.7.0 exactly.
- No intended runtime, normalization, public entity, command, unique-ID or domain-contract semantic change.

## M0.5.7

Full original release notes are preserved at `release/source-package/M0.5.7/RELEASE_NOTES_M0.5.7.md`.
