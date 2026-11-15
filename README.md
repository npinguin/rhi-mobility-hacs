# RHI Mobility

Mobility provides vehicle and charging-station management.

## Installation

Add `https://github.com/npinguin/rhi-mobility-hacs` as a custom Integration repository in HACS. Choose the appropriate published version, back up Home Assistant and restart after installation. Test versions are not production-approved.

The dashboard URL/path may be chosen freely. Existing `custom:homebrain-mobility-card` dashboard configurations are preserved. The integrated card is registered automatically when UX is enabled (default); remove the old separate Mobility UX resource before loading the new bundle, and keep the old release for rollback. Refresh the browser and use Add card → RHI Mobility; no manual JavaScript resource is required.

## License

Protected TEST backend; optional frontend GPL-3.0-only. Existing GPL releases and rights remain unchanged. Supported target: HA OS/Container 2026.11.1, 64-bit amd64 and arm64. See LICENSE.
