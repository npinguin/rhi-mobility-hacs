# Changelog

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
