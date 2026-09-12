"""Frozen Mobility V1 compatibility facade.

This package is the complete removable compatibility boundary after UX consumers
migrate to MOBILITY_PUBLIC_RUNTIME_V2. No canonical Mobility semantics are owned here.
"""

from .facade import MobilityV1Facade

__all__ = ["MobilityV1Facade"]
