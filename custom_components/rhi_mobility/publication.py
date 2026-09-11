from __future__ import annotations
from typing import Any


class MobilityBuildSpecificationProvider:
    """Bounded Shared Baseline 1.7.0 DomainBuildSpecification provider.

    Foundation owns ingestion and validation. Mobility only exposes immutable
    build specifications through the canonical synchronous provider surface.
    """

    publisher_domain = "rhi_mobility"
    publication_revision = 10

    def __init__(self, registry) -> None:
        self.registry = registry

    def get_build_specifications(self) -> tuple[dict[str, Any], ...]:
        """Return the bounded authoritative Mobility build specifications.

        Manual/guest vehicles are deliberately not published. They are Mobility-owned
        semantic products and never participate in Foundation integration/device discovery.
        """
        return tuple(
            self.registry.specs[key]
            for key in sorted(self.registry.specs)
            if key != "mobility.vehicle.manual_profile.v1"
        )

    def specifications(self) -> tuple[dict[str, Any], ...]:
        """Internal compatibility alias; Foundation uses get_build_specifications()."""
        return self.get_build_specifications()
