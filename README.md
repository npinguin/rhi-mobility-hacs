# Robotix Home Intelligence — Mobility

Public HACS distribution mirror for the Home Assistant custom integration `rhi_mobility`.

The engineering source of truth is the private `npinguin/rhi-mobility` repository. This public repository contains only installable runtime/distribution content. Private contracts, models, tests and governance evidence remain in the engineering repository.

## Installation with HACS

Add `https://github.com/npinguin/rhi-mobility-hacs` to HACS as a custom **Integration** repository, download the desired version and restart Home Assistant.

- Default branch: current validated deployment candidate.
- GitHub releases: approved versions only.

## Status

A candidate published to the default branch is intended for deployment/runtime qualification but is not automatically an approved production release. Approval remains subject to clean install, upgrade, rollback, target Home Assistant runtime proof and bundle compatibility.

## Architecture

Mobility owns vehicles, chargers, persons, accepted Mobility bindings, runtime truth, relationships, controls, readiness, commands and physical charging execution. Foundation owns technical discovery and build selection. Energy may plan charging intent but does not execute charger or OCPP services.

## License

The installable software and distribution content in this public repository are licensed under **GNU General Public License v3.0 only (GPL-3.0-only)**. See `LICENSE`.

The separate private engineering repository remains private and is not published by this HACS projection.
