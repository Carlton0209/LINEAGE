from lineage_api.schemas import EventCreate


def test_event_payload_maps_to_database_model() -> None:
    payload = EventCreate.model_validate(
        {
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
                    "value": "b1c25a5e0b182f6c0ad84c35e8b5273f470e529bf7f1d3a3c2f9a6b7c8d9e0f1",
                },
                "assetType": "video",
            },
            "operator": {"userId": "user_local_001"},
        }
    )

    event = payload.to_model()

    assert event.event_id.startswith("evt_")
    assert event.project_id == "prj_week_zero"
    assert event.tool_identifier == "runway-ml"
    assert event.model_identifier == "gen-3-alpha"
    assert event.prompt_text == "A test prompt"
    assert event.output_asset_type == "video"
    assert event.operator_user_id == "user_local_001"
