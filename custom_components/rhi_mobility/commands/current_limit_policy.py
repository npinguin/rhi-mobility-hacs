"""Reconcile an accepted physical EVSE number range with local operator bounds.

Source observations stay authoritative for physical limits; per-asset
MobilityDomainConfiguration is authoritative for a stricter operator ceiling.
No hardware writing is performed and an EVSE reboot never relaxes the cap.
"""
from __future__ import annotations

from math import ceil, floor, isfinite
from typing import Any


def _finite_current(raw: Any) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, bool):
        return None
    try:
        number = float(raw)
    except (TypeError, ValueError, OverflowError):
        return None
    return number if isfinite(number) else None


def current_envelope(
    source_min: Any, source_max: Any, source_step: Any,
    *, configured_min: Any = None, configured_max: Any = None,
) -> tuple[float, float, float] | None:
    """Return *reachable* physical amperes in the operator's allowed range.

    The source Number step is based on its physical source minimum. An operator
    may narrow the interval but cannot create new non-existent Number steps.
    Invalid explicit policy blocks admission instead of falling back to 32A.
    """
    mn, mx, step = (_finite_current(raw) for raw in (source_min, source_max, source_step))
    if mn is None or mx is None or step is None or mn < 0 or mx < mn or step <= 0:
        return None
    lo = _finite_current(configured_min)
    hi = _finite_current(configured_max)
    if (configured_min is not None and (lo is None or lo < 0)
        or configured_max is not None and (hi is None or hi < 0)):
        return None
    if lo is not None and hi is not None and lo > hi:
        return None
    minimum = max(mn, lo) if lo is not None else mn
    maximum = min(mx, hi) if hi is not None else mx
    if maximum < minimum:
        return None
    first_step = max(0, ceil((minimum - mn) / step - 1e-9))
    last_step = floor((maximum - mn) / step + 1e-9)
    if last_step < first_step:
        return None
    return round(mn + first_step * step, 6), round(mn + last_step * step, 6), step
