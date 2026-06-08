import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from lineage_api.schemas import (
    EVENT_ID_PATTERN,
    MODEL_ID_PATTERN,
    PROJECT_ID_PATTERN,
    SHA256_PATTERN,
    TOOL_ID_PATTERN,
    EventCreate,
)


VALID_SHA256 = "b1c25a5e0b182f6c0ad84c35e8b5273f470e529bf7f1d3a3c2f9a6b7c8d9e0f1"


def valid_event_payload() -> dict:
    return {
        "timestamp": "2026-05-20T14:20:30Z",
        "projectId": "prj_week_zero",
        "tool": {"identifier": "runway-ml"},
        "model": {"identifier": "gen-3-alpha"},
        "input": {
            "promptText": "A test prompt",
            "parameters": {"durationSeconds": 10},
            "referenceAssets": [],
        },
        "output": {
            "assetUrl": "https://assets.example.com/output.mp4",
            "assetHash": {
                "algorithm": "SHA-256",
                "value": VALID_SHA256,
            },
            "assetType": "video",
        },
        "operator": {"userId": "user_local_001"},
    }


def test_event_payload_maps_to_database_model() -> None:
    payload = EventCreate.model_validate(valid_event_payload())

    event = payload.to_model()

    assert event.event_id.startswith("evt_")
    assert event.project_id == "prj_week_zero"
    assert event.tool_identifier == "runway-ml"
    assert event.model_identifier == "gen-3-alpha"
    assert event.prompt_text == "A test prompt"
    assert event.output_asset_type == "video"
    assert event.operator_user_id == "user_local_001"


def test_event_payload_rejects_invalid_project_id() -> None:
    payload = valid_event_payload()
    payload["projectId"] = "prj_week_zero/../../manifest"

    with pytest.raises(ValidationError, match="projectId"):
        EventCreate.model_validate(payload)


def test_event_payload_rejects_invalid_event_id() -> None:
    payload = valid_event_payload()
    payload["eventId"] = "evt_bad/../../manifest"

    with pytest.raises(ValidationError, match="eventId"):
        EventCreate.model_validate(payload)


def test_event_payload_rejects_invalid_parent_event_ids() -> None:
    payload = valid_event_payload()
    payload["provenance"] = {"parentEventIds": ["evt_bad/../../parent"]}

    with pytest.raises(ValidationError, match="parentEventIds"):
        EventCreate.model_validate(payload)


def test_event_payload_rejects_duplicate_parent_event_ids() -> None:
    payload = valid_event_payload()
    parent_id = "evt_parent_00000001"
    payload["provenance"] = {"parentEventIds": [parent_id, parent_id]}

    with pytest.raises(ValidationError, match="parentEventIds"):
        EventCreate.model_validate(payload)


def test_event_payload_rejects_non_uri_output_asset_url() -> None:
    payload = valid_event_payload()
    payload["output"]["assetUrl"] = "not a uri"

    with pytest.raises(ValidationError, match="assetUrl"):
        EventCreate.model_validate(payload)


def test_event_payload_rejects_unsafe_asset_uri_scheme() -> None:
    payload = valid_event_payload()
    payload["output"]["assetUrl"] = "javascript:alert(1)"

    with pytest.raises(ValidationError, match="supported scheme"):
        EventCreate.model_validate(payload)


def test_event_payload_rejects_nested_parameters() -> None:
    payload = valid_event_payload()
    payload["input"]["parameters"] = {"style": {"preset": "cinematic"}}

    with pytest.raises(ValidationError, match="parameters"):
        EventCreate.model_validate(payload)


def test_event_payload_rejects_extra_output_fields() -> None:
    payload = valid_event_payload()
    payload["output"]["unexpected"] = "stored in raw_event"

    with pytest.raises(ValidationError, match="unexpected"):
        EventCreate.model_validate(payload)


def test_event_payload_rejects_invalid_reference_relationship() -> None:
    payload = valid_event_payload()
    payload["input"]["referenceAssets"] = [
        {
            "assetUrl": "https://assets.example.com/reference.png",
            "assetHash": {"algorithm": "SHA-256", "value": VALID_SHA256},
            "assetType": "image",
            "relationship": "prompt-injection",
        }
    ]

    with pytest.raises(ValidationError, match="relationship"):
        EventCreate.model_validate(payload)


def test_event_payload_patterns_match_manifest_schema() -> None:
    schema_path = Path(__file__).resolve().parents[3] / "packages/manifest-schema/schema.json"
    schema = json.loads(schema_path.read_text())
    definitions = schema["$defs"]

    assert PROJECT_ID_PATTERN == definitions["projectId"]["pattern"]
    assert EVENT_ID_PATTERN == definitions["eventId"]["pattern"]
    assert TOOL_ID_PATTERN == definitions["tool"]["properties"]["identifier"]["pattern"]
    assert MODEL_ID_PATTERN == definitions["model"]["properties"]["identifier"]["pattern"]
    assert SHA256_PATTERN == definitions["sha256"]["properties"]["value"]["pattern"]
