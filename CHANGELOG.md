## M0.9.31 — 2026-09-22

- Expand the local/offline canonical catalog to current/common Belgian Vehicle and Charger products.
- Allow packaged profiles to be overridden, disabled and restored through integration options; user profiles remain add/edit/remove capable.
- Keep exact deterministic local profile resolution and unknown technical facts unknown.
- Simplify Guest Vehicle setup to profile-or-custom identity plus instance context; battery capacity and SoC are no longer creation questions.
- Use the same canonical product/profile configuration surface for connected Charger assets.
- Keep `image_key` as a per-device persisted property managed by UX; new profiles do not own artwork.
- Preserve the frozen 10-profile V1 compatibility set as a subset while V2 catalog coverage grows.

## M0.9.30 — 2026-09-22

- Add canonical Vehicle/Charger product identity: brand, model, variant and model year.
- Resolve local profiles only from explicit selection or exact structured identity; no integration-name or fuzzy product inference.
- Keep profile knowledge local/offline and limited to stable product/technical facts.
- Make partial and custom/free-format vehicle identity first-class; a profile is optional when brand/model are explicitly provided.
- Expose identity, profile, color and image key directly on the canonical V2 asset read model.
- Add a small read-only local profile-catalog V2 provider; registries remain projections, not semantic owners.
- Freeze V1 for compatibility/defect fixes; no new product/profile/intelligence semantics are added there.

## M0.9.29 — 2026-09-22

- Add a persistent vehicle visual selection through the existing `vehicle.image_key` semantic property.
- Resolve visual identity as `CONFIGURED > PROFILE > SOURCE`, preserving current profiles and source-provided keys as fallbacks.
- Expose `vehicle.image_key` as a writable Mobility configuration surface for the UX vehicle picker.
- Keep the visual catalog, asset paths, model/color options and rendering entirely UX-owned.
- Preserve all public entity IDs, command IDs, Foundation ownership and Mobility→Energy behavior.

## M0.9.28 — 2026-09-21

- Structural engineering lifecycle cleanup; runtime semantics remain aligned with M0.9.27.
- Added machine-readable ownership, test ownership and package authority.
- Publish/release promote the exact validated candidate instead of repeating the complete validation surface.
- Pinned external GitHub Actions to immutable revisions and documented the transferable engineering lifecycle.

# Changelog

## M0.9.27 — publication convergence closure

- Deterministically republish frozen public surfaces after structural Mobility rebuilds.
- Keep active vehicles visible at the Mobility→Energy boundary even when Energy planning inputs are incomplete.
- Diagnose exact direct-provider versus live-publication consumer/connection drift.
- Preserve M0.9.26 BMW CarData support and existing source DeviceEntry topology.


## M0.9.26 — BMW CarData vehicle support

- Add `cardata` as a first-class connected-vehicle source.
- Match stable BMW CarData descriptor-backed unique IDs through the existing DBS/adapter model.
- Normalize observed BMW vehicle telemetry into existing canonical Mobility properties.
- Keep Cardata fetch, developer and maintenance services out of the physical command surface.
- Preserve Foundation ownership, exact HA source DeviceEntry binding, Energy compatibility and frozen V1 exterior.


## M0.9.26 — structural audit closure

- Exclude lifecycle-disabled configured assets from operational Health/Build and snapshot-completeness degradation.
- Render required build PARTIAL as DEGRADED instead of READY.
- Count INVALID_VALUE source capability defects consistently.
- Prove HA Binding Status placement against the complete expected physical source-device set for single- and multi-source assets.
- Refresh active handover, pilot, upgrade/rollback and release evidence to the current release.
- Harden release-integrity validation against stale active release authorities and release-name drift.
- Serialize HACS publication behind successful exact-main Validate and publish the exact validated SHA.
- Add behavioral regression coverage for lifecycle, registry projection and governance invariants.


## M0.9.24 — HA source device link closure

- Attach Binding Status helper entities through the Home Assistant 2026.8+ entity `device_entry` contract to the exact existing physical source DeviceEntry.
- Copy no source identifiers/connections and create no Mobility proxy or `via_device` provenance topology.
- Keep logical Mobility Vehicle/Charger devices independent from physical source devices.
- Preserve the frozen R43.2.65 / MOBILITY_PUBLIC_RUNTIME_V1 exterior.

## M0.9.23 — runtime diagnostics and device-projection closure

- Remove historical entityless source-proxy devices that caused duplicate Linked devices surfaces.
- Keep disabled guest vehicles as configured inventory while excluding them from operational supervision degradation.
- Split required build defects from optional limitations and publish bounded problem evidence.
- Add HA projection proof for logical/source devices, Binding Status placement and orphan proxy count.
- Add runtime proof for Mobility-to-Energy publication entities, revision and consumer count.

## M0.9.23 — orphan linked device cleanup

- Remove entityless Mobility-owned source proxy devices left by historical projection.
- Reconcile the complete Mobility-owned HA device set, not only devices reached through stale entities.
- Preserve canonical Mobility logical/root/intelligence devices and the real source integration device.
- Eliminate the residual empty Linked devices hop seen after M0.9.22.

## M0.9.22 — exact source device identity

- Attach each Mobility Binding Status diagnostic directly to the accepted Home Assistant source device registry id.
- Remove proxy DeviceInfo and via_device source topology so one physical device is not shown as separate Connected and Linked hops.
- Migrate existing binding diagnostics to the physical source device and remove an orphaned M0.9.21 proxy when safe.
- Preserve logical Mobility asset ownership and AcceptedSourceBinding provenance; no public runtime contract change.

## M0.9.21 — product source normalization

- Bind current observed Mercedes, AudiConnect and Cupra Data Act product facts at the normalization boundary.
- Project authoritative combined range to canonical total range and close Mercedes liquid/fuel range input.
- Prevent false Secure conclusions when door/window coverage is partial.
- Keep intelligence canonical-fact-only and behind the public runtime facade.
- Reuse each accepted source's actual Home Assistant device identity in Connected devices; integration-named proxy devices are no longer created.
- Materialize product properties only when backed by an accepted capability, a configured/derived value, or an explicit editor; unsupported catalog attributes no longer appear permanently as Unknown.

## M0.9.20 — handoff ownership boundary

- Restrict Foundation handoff reconstruction to Foundation-linked technical assets.
- Preserve Mobility-owned configured guest vehicles and their logical runtime identity across Foundation handoffs.
- Keep Mobility-authored profiles and semantic configuration independent of Foundation handoff contents.
- Remove local guest assets only through explicit Mobility configuration changes, never because Foundation omits them.
- Preserve M0.9.19 diagnostic Connected devices projection and R43.2.65 / MOBILITY_PUBLIC_RUNTIME_V1 unchanged.
- Known accepted technical debt = 0; known accepted feature debt = 0; exact target-runtime qualification remains mandatory.

## M0.9.19 — logical device debug surfaces

- Keep each canonical Vehicle/Charger as one stable Home Assistant logical device and add deduplicated AcceptedSourceBinding diagnostic child devices so source provenance appears under Connected devices.
- Expose source integration/device navigation, config-entry identity, binding IDs, source roles and input count for operational verification without duplicating discovery or normalization authority.
- Reconcile stale source-binding diagnostics with logical asset lifecycle.
- Preserve M0.9.18 control behavior, R43.2.65 / MOBILITY_PUBLIC_RUNTIME_V1, canonical V2 ownership and Mobility→Energy contracts unchanged.
- Keep Foundation lifecycle/revision convergence outside Mobility ownership.
- Known accepted technical debt = 0; known accepted feature debt = 0; exact target-runtime qualification remains mandatory.

## M0.9.18 — existing contract runtime closure

- Restore materialization of existing Mobility-owned profile and selected-charger configuration controls when their configured value is unset.
- Keep explicit ChargerProfile selection as the prerequisite for the existing requested charging-power kW to physical-current mapping; never infer product identity, voltage or phase count.
- Keep physical execution controls fail-closed until their existing actuator/readback prerequisites are available.
- Preserve R43.2.65 / MOBILITY_PUBLIC_RUNTIME_V1, canonical V2 ownership, Foundation boundaries and Mobility→Energy contracts without adding public fields or consumer changes.
- Known accepted technical debt = 0; known accepted feature debt = 0; exact target-runtime qualification remains mandatory.

## M0.9.17 — runtime health closure

- Stop optional unavailable observations from degrading whole-asset observation health; required source health remains owned by the canonical runtime snapshot.
- Keep optional feature configuration visible as diagnostics without turning unrelated product readiness into a limitation; command limitations remain owned by control health.
- Distinguish build-time initial degraded count from current runtime health so diagnostics cannot present stale build health as live state.
- Preserve explicit ChargerProfile selection: OCPP never implies a Wallbox product profile; nominal voltage remains configured/profile truth, not fabricated measurement.
- No new framework, fallback engine or duplicate runtime path; frozen V1 exterior preserved.


## M0.9.16 — zero-debt governance cleanup

- Remove obsolete producer-arbitration diagnostic runtime shim; canonical prebound runtime behavior is unchanged.
- Make legacy runtime arbitration residue release-blocking in the zero-debt audit.
- Codify deletion-before-abstraction and no-framework-drift cleanup governance.
- Preserve M0.9.15 features, OCPP behavior, command/readback semantics and frozen V1 compatibility exterior.
- Known accepted technical debt = 0; known accepted feature debt = 0; target-runtime proof remains mandatory.

## M0.9.15 — OCPP nominal-voltage closure

- Keep OCPP measured voltage unavailable when the integration source is unavailable; never manufacture `charger.voltage_v`.
- Use explicit selected ChargerProfile `nominal_voltage_v` for kW↔A conversion and calculated-power fallback.
- Preserve `wallbox_ocpp` capability at 230 V, 3 phases, 6..32 A and 1 A step; custom ChargerProfiles remain editable through Mobility semantic configuration.
- Add resolved charging-control diagnostics including profile, measured/nominal voltage, physical current actuator, effective power descriptor and readback.
- Add release-blocking regressions for nominal-voltage fallback, positive measured-power precedence and diagnostics completeness.
- Preserve M0.9.14 prebound runtime, explicit profile selection, frozen V1 compatibility, zero accepted technical debt and zero accepted feature debt.

## M0.9.14 — Prebound runtime closure

- Replace hot-path source/model lookup with an Active Binding Plan materialized once from Foundation-selected sources and stable domain mappings.
- Normalize entity state and structured OCPP attributes through one prebound source boundary; L1/L2/L3 current, voltage and power attributes become canonical facts without runtime producer arbitration.
- Keep controls on the same prebound plan so physical Maximum Current remains the one current-limit readback/write authority.
- Make canonical runtime truth authoritative for projection/readiness; the PropertyResolver no longer chooses between competing runtime producers.
- Preserve the R43.2.65 / MOBILITY_PUBLIC_RUNTIME_V1 exterior for the existing UX while allowing all internal runtime machinery below that boundary to change.
- Keep direct positive measured power authoritative and calculate power from normalized phase current plus measured/canonical voltage only when direct power is absent or inconsistent zero.
- Make pytest an explicit blocking Validate step in addition to package verification; OCPP prebound-chain, control ownership and hot-path architecture regressions block release.
- Known accepted technical debt = 0; known accepted feature debt = 0; target-runtime proof remains mandatory.

## M0.9.13 — OCPP full-chain closure

- Bind the Foundation-discovered OCPP Voltage measurement into the charger build input.
- Separate Current.Import, Current.Offered and Maximum Current into actual-current, offered-current and physical-current-limit semantics.
- Make physical Maximum Current the single normal Current limit product control/readback.
- Demote Requested current to compatibility/engineering only.
- Recover selected actual power from normalized phase current plus measured aggregate/phase voltage when direct OCPP Power.Active.Import is inconsistent zero; positive measured power remains authoritative.
- Restore Set charging power as the higher product abstraction, resolved from the effective vehicle × charger charging envelope.
- Preserve backend-owned profile choices and physical device/source readback authority.
- Publish corrected current/offered/current-limit semantics to Energy without exposing raw OCPP targets.
- Keep Peblar and other source-family redesign out of scope until OCPP target proof.
- Known accepted technical debt = 0; known accepted feature debt = 0; target-runtime proof remains mandatory.

## M0.9.12 — OCPP materialization and control closure

- Preserve additional governed canonical properties emitted by the single OCPP source-normalization boundary instead of filtering them back to the primary builder output.
- Materialize `Current.Import` L1/L2/L3 telemetry into canonical phase-current producer candidates.
- Materialize direct physical current-limit control from the accepted `maximum_current` number-write surface using live source min/max/step evidence.
- Decouple direct ampere control from requested-power conversion: current control can work without an explicit product profile, while kW control still requires complete electrical mapping.
- Execute current-limit writes only through the Mobility executor and confirm against physical source readback.
- Publish current-control readiness/bounds to Energy without exposing the raw integration target.
- Preserve device/source readback as operational truth; no automatic replay of stale pre-restart intent is introduced.
- Add regressions for multi-output materialization and direct-current-control availability without a power profile.
- Keep Shared Baseline 1.8.1, Foundation F1.8.1+ minimum compatibility, zero accepted technical debt and zero accepted feature debt.
- Remain a TEST-CANDIDATE until exact target Home Assistant qualification proves OCPP materialization/control and isolates the known 32 A restart/reconnect behavior.

## M0.9.11 — OCPP source normalization closure

- Add one accepted-source normalization boundary that consumes OCPP state plus structured attributes and emits integration-independent normalized properties.
- Normalize `Current.Import` scalar state and L1/L2/L3 attributes into canonical current facts without depending on entity, device or friendly names.
- Keep OCPP-specific extraction below generic derivation and logical-asset aggregation; downstream intelligence consumes normalized properties only.
- Preserve positive direct measured `charger.power_kw` as authoritative selected power.
- When direct power is absent or inconsistent zero while normalized phase current proves active charging, calculate selected canonical power only from normalized measured phase voltage or explicit canonical `charger.nominal_voltage_v`; remove the anonymous 230 V fallback.
- Preserve explicit provenance/quality for calculated selected power and fail closed when sufficient voltage evidence is absent.
- Add regressions for structured phase telemetry, rename invariance, measured-voltage calculation, canonical-nominal-voltage calculation, direct-measured-power precedence and no-voltage fail-closed behavior.
- Carry current release state and next-engineer context in the governed package via an updated `docs/ENGINEER_HANDOVER.md`.
- Preserve Shared Baseline 1.8.1, Foundation F1.8.1+ minimum compatibility, R43.2.65 / `MOBILITY_PUBLIC_RUNTIME_V1`, zero accepted technical debt and zero accepted feature debt.
- Remain a TEST-CANDIDATE until PR Validate, main Validate, immutable HACS publication and exact target Home Assistant qualification pass.

## M0.9.10 — UX1 runtime parity closure

- Stop the frozen V1 facade from manufacturing physical vehicle identity from configured assignment plus generic EVSE occupancy; physical occupancy and vehicle identity remain separate canonical truths.
- Expose Mobility-owned explicit VehicleProfile and ChargerProfile editing for every materialized runtime vehicle and charger, with catalog validation and persistent semantic configuration; profile identity is never inferred from integration, entity name, model or device label.
- Republish backend-owned product editor metadata after Home Assistant editor entities are registered so the frozen V1/UX facade receives an actual writable profile target instead of a permanently read-only `Unknown` presentation.
- Apply selected VehicleProfile capacity/control/planning facts as canonical V2 profile inputs so authoritative SoC plus explicit profile/configuration can drive current/target/required battery-energy derivations.
- Restore canonical V2 range completion without compatibility fallback semantics: direct Total range wins; a BEV may expose Total from authoritative EV range; a PHEV may expose Total only when authoritative EV and fuel components are both present. Missing semantic evidence remains unavailable.
- Keep source normalization and canonical units authoritative: direct source facts win, derived/computed facts remain deterministic, requested/current-limit values never substitute actual readback, and V1 only reshapes canonical V2 truth.
- Add regressions for no fabricated physical identity, explicit profile editors, profile-driven battery derivation, canonical range completion and frozen V1 projection behavior.
- Preserve Shared Baseline 1.8.1, Foundation F1.8.1+ minimum compatibility, R43.2.65 / `MOBILITY_PUBLIC_RUNTIME_V1`, zero accepted technical debt and zero accepted feature debt.
- Remain a TEST-CANDIDATE until PR Validate, main Validate, immutable HACS publication and exact target Home Assistant runtime/persistence/upgrade/rollback qualification pass.

## M0.9.9 — Product state closure

- Restore deterministic packaged presentation profiles for known VW ID4, Audi Q8, Mercedes GLA, Wallbox OCPP, Peblar and utility-plug source families while explicit Mobility profile configuration remains authoritative.
- Derive `charger.actual_current_a` from authoritative phase-current readback only when a direct aggregate actual-current source is absent; direct actual source wins and current-limit/requested values are never substituted.
- Make missing `asset.profile_id` a feature-scoped limitation instead of a global `CONFIGURATION_REQUIRED` blocker.
- Keep configured/effective/physical topology distinct and do not fabricate physical vehicle identity from charger power or occupancy.
- Keep maintenance/session technical discovery Foundation-owned; unsupported or undiscovered evidence stays absent rather than guessed.
- Add target-runtime regression coverage and remain a TEST-CANDIDATE until target Home Assistant acceptance passes.

## M0.9.8 — Foundation minimum compatibility

- Replace the exact Foundation F1.8.1/F1.8.2/F1.8.3 bootstrap whitelist with a minimum Foundation release of F1.8.1.
- Accept compatible later Foundation maintenance releases without requiring a Mobility code change solely to extend an allowlist.
- Keep Shared Baseline 1.8.1 exact and fail closed on baseline drift, malformed Foundation release identities or releases older than F1.8.1.
- Keep the change entirely Mobility-owned; no Foundation code, configuration lifecycle or cross-domain behavior is modified.
- Preserve all M0.9.7 semantic/runtime/V1 behavior otherwise unchanged.
- Remain a TEST-CANDIDATE until target Home Assistant runtime qualification passes.

## M0.9.7 — Runtime parity and command closure

- Target Foundation F1.8.4 so deterministic forward DomainBuildSpecification revalidation no longer leaves otherwise valid configured Mobility intent stale.
- Deduplicate accepted semantic candidates structurally before runtime normalization: one electric-range source cannot also become Total range and one shared EVSE state source cannot race through two connection normalizers.
- Keep explicit combined/total range evidence distinct from EV-only evidence; missing Total remains unavailable rather than fabricated.
- Restore the frozen V1 UX projection order for Full/EV/Battery and charger Actual/Limit without adding duplicate canonical V2 properties.
- Restore vehicle Start/Stop compatibility delegation to the exact Mobility-owned charger command through already-published relationship/configuration truth; there is no second physical actuator implementation.
- Keep frozen V1 connected-vehicle presentation bounded to configured assignment plus canonical EVSE occupancy; V2 topology remains authoritative.
- Keep image identity profile/canonical-image owned; missing profile remains generic and is not inferred from device labels.
- Keep unsupported maintenance commands and missing session facts fail-closed; no guessed services, lifetime-as-session substitution or compatibility-generated canonical values.
- Add regression gates for semantic binding stability, relationship projection, positional V1 parity and delegated charging commands.
- Remain a TEST-CANDIDATE until exact target-HA runtime, clean-install, upgrade and rollback proof passes.
