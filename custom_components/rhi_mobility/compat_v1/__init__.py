"""Frozen Mobility V1 compatibility facade.

This package is the complete removable compatibility boundary after UX consumers
migrate to MOBILITY_PUBLIC_RUNTIME_V2. No canonical Mobility semantics are owned here.
"""

from .parity_facade import MobilityV1Facade as _ParityFacade


class MobilityV1Facade(_ParityFacade):
    @property
    def required_entity_ids(self):
        return list(self.contract.get("required_entity_ids") or [])

    def profile_rows(self, profile_type: str):
        self.profiles = tuple(dict(row) for row in (self.registry.profiles or ()))
        return super().profile_rows(profile_type)


__all__ = ["MobilityV1Facade"]
