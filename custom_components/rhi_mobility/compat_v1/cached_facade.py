from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

from .facade import MobilityV1Facade as _BaseFacade


class MobilityV1Facade(_BaseFacade):
    """Frozen V1 facade backed by one canonical read view per publication cycle.

    The compatibility boundary is a renderer, not a second runtime. During one
    publication pass every expensive provider snapshot, scalar projection and broad
    V1 collection is computed at most once. Outside a publication pass behaviour
    remains live for command/service callers.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._cycle_depth = 0
        self._cycle_cache: dict[Any, Any] = {}

    def begin_publication_cycle(self) -> None:
        if self._cycle_depth == 0:
            self._cycle_cache = {}
            self._cycle_cache["public_snapshot"] = dict(self.public.snapshot() or {})
        self._cycle_depth += 1

    def end_publication_cycle(self) -> None:
        if self._cycle_depth <= 0:
            return
        self._cycle_depth -= 1
        if self._cycle_depth == 0:
            self._cycle_cache = {}

    @contextmanager
    def publication_cycle(self) -> Iterator[None]:
        self.begin_publication_cycle()
        try:
            yield
        finally:
            self.end_publication_cycle()

    @property
    def _cycle_active(self) -> bool:
        return self._cycle_depth > 0

    def _memo(self, key: Any, factory):
        if not self._cycle_active:
            return factory()
        if key not in self._cycle_cache:
            self._cycle_cache[key] = factory()
        return self._cycle_cache[key]

    def _public_snapshot(self) -> dict[str, Any]:
        if self._cycle_active:
            return self._cycle_cache["public_snapshot"]
        return super()._public_snapshot()

    def _assets(self) -> list[dict[str, Any]]:
        return self._memo(
            "raw_assets",
            lambda: [
                dict(row)
                for row in self._public_snapshot().get("assets", [])
                if isinstance(row, dict)
            ],
        )

    def _asset(self, asset_id: str) -> dict[str, Any] | None:
        if not self._cycle_active:
            return super()._asset(asset_id)
        by_id = self._memo(
            "raw_assets_by_id",
            lambda: {
                str(row.get("asset_id")): row
                for row in self._assets()
                if row.get("asset_id")
            },
        )
        return by_id.get(str(asset_id))

    def _value(self, asset_id: str, key: str) -> Any:
        cache_key = ("value", str(asset_id), str(key))
        return self._memo(
            cache_key,
            lambda: super(MobilityV1Facade, self)._value(asset_id, key),
        )

    def _write_metadata(self, asset_id: str, key: str) -> dict[str, Any]:
        cache_key = ("write_metadata", str(asset_id), str(key))
        return self._memo(
            cache_key,
            lambda: super(MobilityV1Facade, self)._write_metadata(asset_id, key),
        )

    def assets(self) -> list[dict[str, Any]]:
        return self._memo("assets", super().assets)

    def relationship_rows(self) -> list[dict[str, Any]]:
        return self._memo("relationships", super().relationship_rows)

    def relationships_by_asset(self) -> dict[str, dict[str, Any]]:
        return self._memo("relationships_by_asset", super().relationships_by_asset)

    def property_rows(self, asset_type: str, component: str | None = None) -> list[dict[str, Any]]:
        asset_type = str(asset_type)
        if self._cycle_active and component is not None:
            key = ("property_rows", asset_type, component)
            return self._memo(
                key,
                lambda: [
                    row
                    for row in self.property_rows(asset_type, None)
                    if row.get("component_id") == component
                ],
            )
        key = ("property_rows", asset_type, None)
        return self._memo(
            key,
            lambda: super(MobilityV1Facade, self).property_rows(asset_type, None),
        )

    def command_rows(self) -> list[dict[str, Any]]:
        return self._memo("commands", super().command_rows)

    def command_slots(self, asset_type: str) -> list[dict[str, Any]]:
        key = ("command_slots", str(asset_type))
        return self._memo(
            key,
            lambda: super(MobilityV1Facade, self).command_slots(asset_type),
        )

    def component_contract(self, asset_type: str) -> dict[str, Any]:
        key = ("component_contract", str(asset_type))
        return self._memo(
            key,
            lambda: super(MobilityV1Facade, self).component_contract(asset_type),
        )

    def profile_rows(self, profile_type: str) -> list[dict[str, Any]]:
        key = ("profile_rows", str(profile_type))
        return self._memo(
            key,
            lambda: super(MobilityV1Facade, self).profile_rows(profile_type),
        )

    def experience_rows(self, asset_type: str) -> list[dict[str, Any]]:
        key = ("experience_rows", str(asset_type))
        return self._memo(
            key,
            lambda: super(MobilityV1Facade, self).experience_rows(asset_type),
        )

    def supervisory(self) -> dict[str, Any]:
        return self._memo("supervisory", super().supervisory)

    def energy_v1(self) -> dict[str, Any]:
        return self._memo("energy_v1", super().energy_v1)

    def capability_index(self) -> dict[str, dict[str, Any]]:
        return self._memo("capability_index", super().capability_index)
