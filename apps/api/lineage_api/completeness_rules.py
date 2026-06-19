from __future__ import annotations

import re
from typing import Any

LICENSE_NEEDS_FOLLOW_UP = re.compile(r"noncommercial|non-commercial|temp", re.IGNORECASE)
SYNTHETIC_LIKENESS_OR_VOICE = re.compile(r"voice|likeness|replica|face", re.IGNORECASE)


def _event_id(event: dict[str, Any], index: int) -> str:
    value = event.get("eventId")
    return value if isinstance(value, str) and value else f"events[{index}]"


def _finding(event_id: str, level: str, message: str) -> dict[str, str]:
    return {"eventId": event_id, "level": level, "message": message}


def evaluate_completeness(manifest: dict[str, Any]) -> list[dict[str, str]]:
    """Evaluate production-delivery completeness.

    These rules are intentionally hard-coded and local to this module. They describe
    the current buyer review checks and can be edited directly as delivery expectations
    change, without adding a configuration system.
    """

    events = manifest.get("events")
    if not isinstance(events, list):
        return []

    findings: list[dict[str, str]] = []
    for index, event in enumerate(events):
        if not isinstance(event, dict):
            continue

        event_id = _event_id(event, index)
        rights = event.get("rights")
        disclosure = event.get("disclosure")

        if not isinstance(disclosure, dict):
            findings.append(_finding(event_id, "attention", "no disclosure category"))
        if not isinstance(rights, dict):
            findings.append(_finding(event_id, "attention", "no rights information"))
            rights = None

        if rights:
            if rights.get("commercialUse") == "restricted":
                findings.append(
                    _finding(
                        event_id,
                        "attention",
                        "commercial use restricted; confirm clearance",
                    )
                )

            output_license = rights.get("outputLicense")
            if isinstance(output_license, str) and LICENSE_NEEDS_FOLLOW_UP.search(
                output_license
            ):
                findings.append(
                    _finding(event_id, "attention", "license is non-commercial or temporary")
                )

            if rights.get("trainingDataBasis") == "unknown":
                findings.append(_finding(event_id, "informational", "training-data basis unknown"))

        category = disclosure.get("category") if isinstance(disclosure, dict) else None
        if isinstance(category, str) and SYNTHETIC_LIKENESS_OR_VOICE.search(category):
            if not isinstance(event.get("consent"), dict):
                findings.append(
                    _finding(
                        event_id,
                        "attention",
                        "synthetic likeness or voice without a consent reference",
                    )
                )

    return findings
