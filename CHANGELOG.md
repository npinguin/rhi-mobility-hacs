# Changelog

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
