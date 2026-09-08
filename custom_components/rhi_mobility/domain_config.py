from __future__ import annotations
from copy import deepcopy
from typing import Any, Callable

CONFIG_KEY = "domain_semantic_configuration"
REVISION_KEY = "domain_semantic_configuration_revision"
LEGACY_CONFIG_KEY = "domain_config_overrides"

class MobilityDomainConfiguration:
    """Revisioned Mobility-owned semantic product configuration.

    Foundation remains authority for technical integration/device/candidate selection and
    SelectedDomainBuildInput revisions. This store contains only Mobility semantics that
    never mutate AcceptedSourceBinding or technical source identity.
    """
    def __init__(self, hass, entry) -> None:
        self.hass = hass
        self.entry = entry
        options = dict(getattr(entry, "options", {}) or {})
        raw = options.get(CONFIG_KEY, options.get(LEGACY_CONFIG_KEY, {}))
        self._data: dict[str, dict[str, Any]] = deepcopy(raw) if isinstance(raw, dict) else {}
        try:
            self._revision = max(0, int(options.get(REVISION_KEY, 0)))
        except (TypeError, ValueError):
            self._revision = 0
        self._legacy_migration_required = LEGACY_CONFIG_KEY in options and CONFIG_KEY not in options
        self._listeners: list[Callable[[str, str], None]] = []

    @property
    def revision(self) -> int:
        return self._revision

    async def async_initialize(self) -> None:
        """Migrate the M0.3.1/0.3.2 storage key without changing semantic values."""
        if not self._legacy_migration_required:
            return
        options = dict(getattr(self.entry, "options", {}) or {})
        options.pop(LEGACY_CONFIG_KEY, None)
        options[CONFIG_KEY] = deepcopy(self._data)
        self._revision = max(1, self._revision)
        options[REVISION_KEY] = self._revision
        self.hass.config_entries.async_update_entry(self.entry, options=options)
        self._legacy_migration_required = False

    def get(self, asset_id: str, property_key: str, default: Any = None) -> Any:
        row = self._data.get(asset_id, {})
        return row.get(property_key, default) if isinstance(row, dict) else default

    def asset_values(self, asset_id: str) -> dict[str, Any]:
        row = self._data.get(asset_id, {})
        return dict(row) if isinstance(row, dict) else {}

    def snapshot(self) -> dict[str, dict[str, Any]]:
        return deepcopy(self._data)

    def add_listener(self, callback: Callable[[str, str], None]) -> Callable[[], None]:
        self._listeners.append(callback)
        def remove() -> None:
            if callback in self._listeners:
                self._listeners.remove(callback)
        return remove

    async def async_set(self, asset_id: str, property_key: str, value: Any) -> None:
        if not asset_id or not property_key:
            raise ValueError("asset_id and property_key are required")
        updated = deepcopy(self._data)
        row = dict(updated.get(asset_id, {}))
        if value is None:
            row.pop(property_key, None)
        else:
            row[property_key] = value
        if row:
            updated[asset_id] = row
        else:
            updated.pop(asset_id, None)
        options = dict(getattr(self.entry, "options", {}) or {})
        options.pop(LEGACY_CONFIG_KEY, None)
        options[CONFIG_KEY] = updated
        self._revision += 1
        options[REVISION_KEY] = self._revision
        self.hass.config_entries.async_update_entry(self.entry, options=options)
        self._data = updated
        self._legacy_migration_required = False
        for callback in tuple(self._listeners):
            callback(asset_id, property_key)
