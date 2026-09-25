from __future__ import annotations

from copy import deepcopy
from typing import Any

try:
    from .const import RELEASE
except ImportError:  # standalone contract tests
    from pathlib import Path as _Path
    import runpy as _runpy
    RELEASE = _runpy.run_path(str(_Path(__file__).with_name("const.py")))["RELEASE"]


class MobilityProductContractProvider:
    """One aggregate product boundary for Mobility UX.

    Specialized V2 contracts remain authoritative for domain-to-domain or focused
    consumers. This provider only composes those existing truths; it introduces no
    second semantic implementation.
    """

    CONTRACT_ID = "RHI_MOBILITY_PUBLIC_CONTRACT_V2"

    def __init__(
        self,
        public,
        experience,
        policy,
        command,
        activity,
        profile_catalog,
        supervision,
        energy,
    ) -> None:
        self.public = public
        self.experience = experience
        self.policy = policy
        self.command = command
        self.activity = activity
        self.profile_catalog = profile_catalog
        self.supervision = supervision
        self.energy = energy

    def snapshot(self) -> dict[str, Any]:
        runtime = deepcopy(self.public.snapshot() or {})
        experience = deepcopy(self.experience.snapshot() or {})
        policy = deepcopy(self.policy.snapshot() or {})
        commands = deepcopy(self.command.command_snapshot() or {})
        activity = deepcopy(self.activity.snapshot() or {})
        profiles = deepcopy(self.profile_catalog.snapshot() or {})
        supervision = deepcopy(self.supervision.snapshot() or {})
        energy = deepcopy(self.energy.snapshot() or {})
        objects = list(runtime.get("assets") or [])
        relationships = list(runtime.get("relationships") or [])
        return {
            "contract_id": self.CONTRACT_ID,
            "contract_version": "2.0.0",
            "domain_id": "mobility",
            "publisher": "rhi_mobility",
            "release": RELEASE,
            "canonical": True,
            "objects": objects,
            "assets": objects,
            "relationships": relationships,
            "fleet": deepcopy(runtime.get("fleet") or {}),
            "experience": experience,
            "configuration": {"policy": policy},
            "commands": list(commands.get("commands") or []),
            "activity": list(activity.get("activities") or []),
            "profiles": list(profiles.get("profiles") or []),
            "supervision": supervision,
            "energy_boundary": energy,
            "summary": {
                "object_count": len(objects),
                "relationship_count": len(relationships),
                "command_count": len(commands.get("commands") or []),
                "activity_count": len(activity.get("activities") or []),
            },
            "ux_inference_forbidden": True,
            "specialized_contracts": {
                "runtime": runtime.get("contract_id"),
                "experience": experience.get("contract_id"),
                "policy": policy.get("contract_id"),
                "commands": commands.get("contract_id"),
                "activity": activity.get("contract_id"),
                "profiles": profiles.get("contract_id"),
                "supervision": supervision.get("contract_id"),
                "energy": energy.get("contract_id"),
            },
        }
