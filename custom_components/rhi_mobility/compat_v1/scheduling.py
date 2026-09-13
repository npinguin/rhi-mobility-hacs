"""Bounded scheduling for the frozen Mobility V1 compatibility facade.

The V1 facade is a downstream projection only. Runtime and control notifications may
request a refresh, but a burst within one event-loop turn is collapsed to one
publication. This prevents compatibility projection work from amplifying normal
Mobility telemetry while preserving exact V1 payload semantics.
"""
from __future__ import annotations

import asyncio
from collections.abc import Callable
from typing import Any

Subscribe = Callable[[Callable[..., None]], Callable[[], None]]


def coalesced_subscription(*sources: Subscribe) -> Subscribe:
    """Combine notification sources behind one call-soon publication gate."""
    active_sources = tuple(source for source in sources if callable(source))

    def subscribe(callback: Callable[[], None]) -> Callable[[], None]:
        scheduled = False
        active = True

        def flush() -> None:
            nonlocal scheduled
            scheduled = False
            if active:
                callback()

        def request(*_args: Any, **_kwargs: Any) -> None:
            nonlocal scheduled
            if not active or scheduled:
                return
            scheduled = True
            asyncio.get_running_loop().call_soon(flush)

        unsubs = [source(request) for source in active_sources]

        def unsubscribe() -> None:
            nonlocal active
            active = False
            for unsub in tuple(unsubs):
                unsub()
            unsubs.clear()

        return unsubscribe

    return subscribe
