from __future__ import annotations

from typing import Any

BROAD_TECHNICAL_INTEGRATIONS = frozenset({"mqtt", "zwave_js", "shelly"})


def broad_all_matching_selection(payload: dict[str, Any]) -> bool:
    """Return true when a broad integration would auto-create Mobility objects.

    Broad infrastructure integrations can contain arbitrary switches/sensors. Mobility
    therefore requires concrete device selection rather than `all_matching` for logical
    vehicle/charger creation.
    """
    selection = payload.get("selection") if isinstance(payload, dict) else None
    if not isinstance(selection, dict):
        return False
    integration = str(selection.get("integration_domain") or "")
    if integration not in BROAD_TECHNICAL_INTEGRATIONS:
        return False
    mode = str(selection.get("device_filter_mode") or "").lower()
    selected = {str(x) for x in selection.get("selected_device_ids") or []}
    return mode == "all_matching" or "__all_matching__" in selected
