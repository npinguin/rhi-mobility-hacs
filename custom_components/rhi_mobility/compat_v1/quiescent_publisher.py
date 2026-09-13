"""Quiescent scheduling wrapper for the frozen Mobility V1 state facade.

M0.7.6 restores the existing ownership boundary instead of adding a new event layer:
runtime truth may refresh the compatibility facade, while control/activity notifications
may refresh only control-owned surfaces. The Mobility->Energy publication is therefore
never republished merely because a command/activity lifecycle changed.
"""
from __future__ import annotations

from .scheduling import coalesced_subscription
from .state_publisher import MobilityV1StatePublisher as _BasePublisher


class MobilityV1StatePublisher(_BasePublisher):
    """Publish the exact V1 facade with bounded, ownership-scoped fan-out."""

    _CONTROL_ENTITY_IDS = frozenset(
        {
            "sensor.mobility_command_index",
            "sensor.mobility_activity_index",
            "sensor.mobility_vehicle_command_slot_index",
            "sensor.mobility_charger_command_slot_index",
            "sensor.mobility_command_publication_health",
            "sensor.mobility_vehicle_command_slot_health",
            "sensor.mobility_charger_command_slot_health",
        }
    )

    def start(self) -> None:
        collisions = self.collision_ids()
        if collisions:
            raise RuntimeError(
                "legacy Mobility facade collision; disable R43.2.65 before V2 takeover: "
                + ",".join(collisions)
            )
        self._started = True
        self._unsubs = []
        if callable(self._subscribe_runtime):
            self._unsubs.append(
                coalesced_subscription(self._subscribe_runtime)(self.publish_runtime)
            )
        if callable(self._subscribe_control):
            self._unsubs.append(
                coalesced_subscription(self._subscribe_control)(self.publish_control)
            )
        self.publish_runtime()

    def _payload(self, entity_id: str):
        state, attributes = super()._payload(entity_id)
        if entity_id == "sensor.mobility_energy_asset_publication":
            # Keep the frozen V1 shape but remove command/activity history from the
            # semantic Mobility->Energy dependency. Execution history remains owned
            # by sensor.mobility_activity_index.
            attributes = dict(attributes)
            if "last_command_result" in attributes:
                attributes["last_command_result"] = None
        return state, attributes

    def _publish_ids(self, entity_ids) -> None:
        if not self._started:
            return
        for entity_id in entity_ids:
            state, attributes = self._payload(entity_id)
            current = self.hass.states.get(entity_id)
            if current is not None:
                current_state = str(getattr(current, "state", ""))
                current_attributes = dict(getattr(current, "attributes", {}) or {})
                if current_state == str(state) and current_attributes == attributes:
                    continue
            self.hass.states.async_set(
                entity_id, state, attributes, force_update=False
            )

    def publish_runtime(self) -> None:
        """Project canonical runtime truth change-only across the frozen V1 facade."""
        self._publish_ids(self.facade.required_entity_ids)

    def publish_control(self) -> None:
        """Project command/activity changes without waking telemetry/Energy surfaces."""
        required = set(self.facade.required_entity_ids)
        self._publish_ids(
            entity_id
            for entity_id in self._CONTROL_ENTITY_IDS
            if entity_id in required
        )

    def publish(self) -> None:
        """Compatibility alias used by direct callers/tests; runtime semantics apply."""
        self.publish_runtime()
