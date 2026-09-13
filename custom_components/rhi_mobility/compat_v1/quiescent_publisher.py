"""Quiescent scheduling wrapper for the frozen Mobility V1 state facade."""
from __future__ import annotations

from .scheduling import coalesced_subscription
from .state_publisher import MobilityV1StatePublisher as _BasePublisher


class MobilityV1StatePublisher(_BasePublisher):
    """Publish the exact V1 facade with bounded runtime/control fan-out."""

    def start(self) -> None:
        collisions = self.collision_ids()
        if collisions:
            raise RuntimeError(
                "legacy Mobility facade collision; disable R43.2.65 before V2 takeover: "
                + ",".join(collisions)
            )
        self._started = True
        self._unsubs = []
        sources = tuple(
            source
            for source in (self._subscribe_runtime, self._subscribe_control)
            if callable(source)
        )
        if sources:
            self._unsubs.append(coalesced_subscription(*sources)(self.publish))
        self.publish()

    def publish(self) -> None:
        """Write only facade states whose rendered V1 payload actually changed."""
        if not self._started:
            return
        for entity_id in self.facade.required_entity_ids:
            state, attributes = self._payload(entity_id)
            current = self.hass.states.get(entity_id)
            if current is not None:
                current_state = str(getattr(current, "state", ""))
                current_attributes = dict(getattr(current, "attributes", {}) or {})
                if current_state == str(state) and current_attributes == attributes:
                    continue
            self.hass.states.async_set(entity_id, state, attributes, force_update=False)
