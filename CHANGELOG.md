## M0.10.7 — EDITOR_METADATA_REPUBLISH

- republish canonical property write metadata after Home Assistant text editor registration;
- close setup-order read-only drift for `vehicle.image_key` and `charger.image_key` while preserving existing select/profile convergence;
- keep Mobility-owned configuration editors and canonical V2 readback as the only write authority;
- preserve M0.10.6 semantics, topology, commands, Foundation capability dependency and zero accepted technical/feature debt.

## M0.10.6 — BOOT_PERFORMANCE

- replace the unconditional second Foundation semantic startup rebuild with revision-aware convergence;
- keep a bounded second build only when Foundation handoff identity changed during platform setup or the initial handoff was unavailable;
- index entity-registry rows once per projection/diagnostics pass instead of per-device lookups;
- expose setup phase timings, convergence decision and projection scan metrics in diagnostics;
- clean the lifecycle projection listener on normal unload to avoid reload-time listener accumulation;
- preserve M0.10.5 topology/lifecycle semantics and defer normalized-property rationalisation.

## M0.10.5 — CANONICAL_DOMAIN_GOVERNANCE

- establish a governed Vehicle/Charger-only domain definition and independently validate effective runtime semantics;
- retire the Mobility-owned Person builder/properties/adapter and reference native Home Assistant `person.*` through `vehicle.person_entity_id`;
- keep integration mappings single-authority in static adapters with deterministic generated DBS output;
- formalize source provenance versus HA device topology and keep Vehicle↔Charger as a domain relationship;
- remove exact Foundation release/baseline runtime coupling in favor of required public capabilities;
- publish exact HA select transport labels separately from canonical persisted values;
- split cheap check from full regressions, keep main as an identity gate and prevent stable approval from rebuilding candidate bytes;
- keep zero accepted technical debt and zero accepted feature debt.

## M0.10.3 — VERIFIED_CHARGER_PRODUCT_CODES

- populate exact manufacturer part numbers for Easee Charge Up, Peblar Business Socket and Zaptec Go 2 from manufacturer evidence;
- leave ambiguous multi-variant charger profiles without product codes instead of guessing;
- require shipped product-code fields to be explicitly evidence-backed;
- preserve product_code as optional Profile Catalog V2 metadata only;
- keep visual_ref primary and preserve runtime/readiness/command/Energy behavior unchanged.

## M0.10.2 — CHARGER_PRODUCT_CODE_HINTS

- allow ChargerProfiles to carry optional `sku` and `manufacturer_part_number` metadata;
- publish those values as a separate optional `product_code` object in MOBILITY_PROFILE_CATALOG_V2;
- keep product codes out of `technical_specification`, readiness and automatic profile resolution;
- keep VehicleProfiles unchanged and `visual_ref` as the primary stable UX visual identity;
- expose the same optional fields in the Mobility charger-profile editor for local catalog/profile maintenance;
- preserve V2-only runtime behavior, command ownership, Shared Baseline 1.8.1 and zero accepted technical/feature debt.

## M0.10.1 — VISUAL_REF_PUBLICATION

- register the bounded Mobility visual catalog with Foundation's package-neutral Visual Asset Registry when that additive API is available;
- publish canonical `visual_ref` on vehicle/charger rows in MOBILITY_PUBLIC_RUNTIME_V2 and MOBILITY_ENERGY_V2;
- keep `vehicle.image_key` / `charger.image_key` as writable configuration compatibility while downstream consumers use `visual_ref`;
- keep image files, filters and rendering inside each consuming UX package; no cross-UX runtime dependency or central URL/path publication;
- add fail-closed resolver/catalog regression coverage and preserve Shared Baseline 1.8.1.

## M0.10.0 — V1_INTERFACE_DECOMMISSION

- remove the complete Mobility V1 public compatibility facade and state/service publisher;
- remove V1 public/command/energy compatibility provider IDs;
- remove active V1 runtime/entity-shape/parity contracts and V1-only audit/generator tooling;
- move retained compatibility vocabulary aliases into the canonical V2 semantic property catalog;
- preserve M0.9.45 Runtime V2 asset-type and entity-registry materialization fixes;
- add blocking anti-drift gates requiring zero active Mobility V1 runtime interfaces;
- retain zero accepted technical debt and zero accepted feature debt.

## M0.9.45 — V2_RUNTIME_CONTRACT_MATERIALIZATION

- publish `asset_type` alongside `concept_id` on Runtime V2 asset rows;
- migrate pre-existing V2 monitor entity registry rows to stable canonical public IDs before platform setup;
- fail closed if a canonical target entity ID is owned by another registry row;
- add blocking producer-shape and registry-migration regressions;
- preserve frozen V1 compatibility pending corrected bundle runtime proof.

## M0.9.44 — V2_INTERFACE_COMPLETION

- expose complete Runtime V2 assets and relationship projection;
- expose direct Activity V2, Profile Catalog V2 and product Supervision V2 HA surfaces;
- stabilize canonical V2 contract entity IDs, including Mobility→Energy V2;
- add per-asset property-publication contract evidence and V2 publication diagnostics;
- make Command V2 canonical in active requirements/runtime metadata;
- retain frozen V1 only as compatibility leaf pending coordinated consumer cutover;
- add regression gates for V2 completeness, V2→V1 independence and active release coherence.

## M0.9.43 — PILOT_HANDOVER_GOVERNANCE

- preserve M0.9.42 runtime semantics and V2 contracts;
- add release-specific engineer handover, lessons learned, open pilot issue register and next-engineer checklist;
- add machine-enforced anti-drift gates for V1 authority regression and MQTT write-surface observation regression;
- document exact owner and exit criterion for every remaining pilot blocker;
- keep target Home Assistant runtime qualification as the final promotion gate.

## M0.9.42 — PILOT_BACKEND_CLOSURE

- remove the MQTT utility write switch as required operating-state evidence; utility state remains power-derived and fail-closed;
- honor persisted Mobility semantic electrical configuration without requiring a product profile;
- make MOBILITY_COMMAND_V2 the canonical command contract while retaining the V1 provider id as one compatibility alias only;
- expose direct Energy V2 and Command V2 HA contract surfaces for first-party consumers;
- remove V1 HA index references from the canonical Mobility Energy V2 contract;
- add bounded diagnostics proof for Public Runtime, Policy, Experience, Command, Energy, Profile and configuration V2 authorities.

## M0.9.41 — V2 contract-gap closure

- Add persistent `MOBILITY_POLICY_V2` for range, maintenance, security-coverage and charge-demand interpretation rules.
- Add backend-owned configuration completeness, runtime/data health and charge-demand facts.
- Add explicit Experience V2 security and maintenance vocabularies so UX no longer needs semantic inference.
- Keep selected, effective and physically proven charger relationships distinct.
- Add fleet charger counts and aggregate actual charging power with explicit completeness.
- Expose compact direct V2 Runtime, Experience and Policy HA surfaces for gradual V1 retirement.
- Keep site capacity/planning Energy-owned, discovery Foundation-owned and presentation UX-owned.
- Preserve frozen V1 through compatibility-only state mapping.
- Add persistence/reboot-boundary and ownership regression coverage.

## M0.9.39 — V2 visual picker write contract

- Expose canonical `vehicle.image_key` and `charger.image_key` as Mobility-owned configuration editors while keeping artwork/catalog ownership in UX.
- Publish complete typed write metadata from the V2 semantic projection so visual pickers can persist and read back selected keys.
- Add regression proof for both vehicle and charger visual-key write transport.
- Preserve M0.9.38 utility charger state semantics unchanged.

## M0.9.39 — utility charger power-state closure

- Scope fake charger state derivation to `mobility.charger.utility_surface.v1`.
- Treat target-observed utility power as canonical semantic state: 0 W free/idle, 2 W connected/preparing, >2 W connected/running.
- Fail closed to unknown for unexpected sub-2 W measurements instead of guessing occupancy.
- Allow utility power semantics to override switch-like technical state while preserving native EVSE state authority for full-EVSE chargers.
- Add release-blocking regression coverage for all utility boundaries and full-EVSE isolation.
- Align current release, handover, verification and traceability authorities with M0.9.39.

## M0.9.37 — 2026-09-23

- Unify OCPP, Peblar and Wallbox EVSE-state tokenization and normalization.
- Fix Peblar/Wallbox space-delimited states such as "No EV connected" normalizing to unknown.
- Derive charger.available_for_connection from canonical physical connection + operating state.
- Keep configured vehicle-to-charger assignment separate from physical occupancy truth.
- Add regression coverage for equivalent charger states across integrations.

## M0.9.36 — 2026-09-23

- Split Mobility configuration into Vehicle profile config, Vehicle config, Guest vehicle config, Charger profile config and Charger config.
- Filter profile catalogs by product type and sort them as Brand — Model · Variant · Year.
- Add explicit connected-vehicle overrides for battery capacity, maximum AC power and phase capability.
- Add charger instance overrides for min/max current, maximum power, phase capability, nominal voltage and current step.
- Add canonical charger.max_power_kw and charger.current_step_a properties.
- Show human labels in HA profile/charger config selectors while persisting stable IDs.
- Keep image keys UX-owned instead of ordinary user-editable configuration.
- Route guest CRUD through the canonical MobilityDomainConfiguration owner.

## M0.9.35 — 2026-09-23

- Replace fragmented profile actions with one searchable profile catalog.
- Use native Home Assistant dropdown and number selectors with human product labels and field guidance.
- Keep the profile catalog open after save for efficient repeated maintenance.
- Make logical vehicle/charger and guest known-product selection searchable.
- Preserve backend product/profile authority and public runtime semantics.

## M0.9.34 — 2026-09-22

- Restore missing OptionsFlow profile-management helpers required by the Configure menu.
- Keep packaged and authored/override profiles manageable by stable profile id.
- Preserve disabled packaged profiles for management/restore while effective runtime resolution continues to hide them.
- Add regression coverage for the exact HTTP 500 failure path seen on Home Assistant 2026.9.3.
- No public entity, command, product-model, V1 or Foundation ownership changes.

## M0.9.33 — 2026-09-22

- Close Home Assistant OptionsFlow lifecycle compatibility after immutable M0.9.32 publication.
- Migrate persisted Mobility semantic configuration in place before runtime rebuild.
- Preserve UX-owned instance image keys during migration.
- Remove obsolete persisted profile/user-policy residue and stale incomplete profile overlays.
- Add regression proof that upgrades require no uninstall or manual reconfigure.
- Preserve M0.9.32 canonical product, command, V1 and ownership semantics unchanged.

## M0.9.32 — 2026-09-22

- Replace broad/incomplete catalog rows with complete evidence-backed VehicleProfile and ChargerProfile knowledge only.
- Forbid required null/unknown technical profile fields, generic product variants, user policy and artwork in profiles.
- Keep target SoC, color and image key on the concrete asset/user experience.
- Remove backend profile artwork serving/presentation from canonical V2.
- Collapse duplicate canonical resolution ownership and remove the unused producer-candidate arbitration layer.
- Make product configuration show resolved canonical truth and persist only deliberate overrides.
- Make Guest Vehicle create/edit explicitly Known Product or Custom/free-format.
- Fix packaged profile disable/restore through OptionsFlow and protect effectively resolved profile use.
- Enforce unique auto-resolve identities and per-profile/per-field evidence coverage.
- Decouple frozen V1 profile metadata from the canonical verified V2 catalog.
- Align evergreen product vision, ownership, architecture and release authority.

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
