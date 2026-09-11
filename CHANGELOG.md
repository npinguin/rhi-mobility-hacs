# Changelog

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
