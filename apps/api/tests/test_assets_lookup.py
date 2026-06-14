from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from lineage_api.database import get_session
from lineage_api.main import app
from lineage_api.models import AIEvent


KNOWN_HASH = "a1c25a5e0b182f6c0ad84c35e8b5273f470e529bf7f1d3a3c2f9a6b7c8d9e0f1"
UNKNOWN_HASH = "b1c25a5e0b182f6c0ad84c35e8b5273f470e529bf7f1d3a3c2f9a6b7c8d9e0f1"


class FakeResult:
    def __init__(self, events: list[AIEvent]) -> None:
        self.events = events

    def all(self) -> list[AIEvent]:
        return self.events


class FakeSession:
    def __init__(self, events: list[AIEvent]) -> None:
        self.events = events
        self.exec_count = 0

    def exec(self, _statement: object) -> FakeResult:
        self.exec_count += 1
        return FakeResult(self.events)


@contextmanager
def lookup_client(events: list[AIEvent]) -> Iterator[tuple[TestClient, FakeSession]]:
    session = FakeSession(events)
    app.dependency_overrides[get_session] = lambda: session
    try:
        with TestClient(app) as client:
            yield client, session
    finally:
        app.dependency_overrides.clear()


def make_event(
    *,
    event_id: str = "evt_lookup_001",
    project_id: str = "prj_lookup",
    output_hash: str = KNOWN_HASH,
) -> AIEvent:
    return AIEvent(
        event_id=event_id,
        project_id=project_id,
        occurred_at=datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc),
        tool_identifier="runway-ml",
        model_identifier="gen-3-alpha",
        prompt_text="A lookup test prompt",
        output_asset_url=f"https://assets.example.com/{event_id}.mp4",
        output_asset_hash_algorithm="SHA-256",
        output_asset_hash_value=output_hash,
        output_asset_type="video",
        operator_user_id="op_lookup",
        reference_assets=[],
        parent_event_ids=[],
        parameters={},
        raw_event={},
    )


def test_asset_lookup_hit_returns_matching_event() -> None:
    event = make_event(event_id="evt_lookup_hit")

    with lookup_client([event]) as (client, session):
        response = client.post("/assets/lookup", json={"hashes": [KNOWN_HASH]})

    assert response.status_code == 200
    body = response.json()
    assert body["results"][0]["hash"] == KNOWN_HASH
    assert body["results"][0]["matched"] is True
    assert body["results"][0]["events"][0]["event_id"] == "evt_lookup_hit"
    assert session.exec_count == 1


def test_asset_lookup_miss_returns_empty_result_with_200() -> None:
    event = make_event(event_id="evt_lookup_other", output_hash=KNOWN_HASH)

    with lookup_client([event]) as (client, session):
        response = client.post("/assets/lookup", json={"hashes": [UNKNOWN_HASH]})

    assert response.status_code == 200
    assert response.json()["results"] == [
        {"hash": UNKNOWN_HASH, "matched": False, "events": []}
    ]
    assert session.exec_count == 1


def test_asset_lookup_mixed_batch_preserves_request_order() -> None:
    event = make_event(event_id="evt_lookup_known", output_hash=KNOWN_HASH)

    with lookup_client([event]) as (client, session):
        response = client.post(
            "/assets/lookup",
            json={"hashes": [KNOWN_HASH, UNKNOWN_HASH]},
        )

    assert response.status_code == 200
    results = response.json()["results"]
    assert [result["hash"] for result in results] == [KNOWN_HASH, UNKNOWN_HASH]
    assert [result["matched"] for result in results] == [True, False]
    assert results[0]["events"][0]["event_id"] == "evt_lookup_known"
    assert results[1]["events"] == []
    assert session.exec_count == 1


def test_asset_lookup_is_case_insensitive() -> None:
    event = make_event(event_id="evt_lookup_case", output_hash=KNOWN_HASH)

    with lookup_client([event]) as (client, session):
        response = client.post("/assets/lookup", json={"hashes": [KNOWN_HASH.upper()]})

    assert response.status_code == 200
    result = response.json()["results"][0]
    assert result["hash"] == KNOWN_HASH
    assert result["matched"] is True
    assert result["events"][0]["event_id"] == "evt_lookup_case"
    assert session.exec_count == 1


def test_asset_lookup_returns_multiple_matches_for_same_hash() -> None:
    first_event = make_event(
        event_id="evt_lookup_multi_1",
        project_id="prj_lookup_one",
        output_hash=KNOWN_HASH,
    )
    second_event = make_event(
        event_id="evt_lookup_multi_2",
        project_id="prj_lookup_two",
        output_hash=KNOWN_HASH,
    )

    with lookup_client([first_event, second_event]) as (client, session):
        response = client.post("/assets/lookup", json={"hashes": [KNOWN_HASH]})

    assert response.status_code == 200
    result = response.json()["results"][0]
    assert result["matched"] is True
    assert {event["event_id"] for event in result["events"]} == {
        "evt_lookup_multi_1",
        "evt_lookup_multi_2",
    }
    assert session.exec_count == 1


def test_asset_lookup_rejects_empty_hashes() -> None:
    with lookup_client([]) as (client, session):
        response = client.post("/assets/lookup", json={"hashes": []})

    assert response.status_code == 422
    assert session.exec_count == 0


def test_asset_lookup_rejects_non_hex_hash() -> None:
    with lookup_client([]) as (client, session):
        response = client.post("/assets/lookup", json={"hashes": ["not-a-hex-hash"]})

    assert response.status_code == 422
    assert session.exec_count == 0


def test_asset_lookup_rejects_short_hex_hash() -> None:
    with lookup_client([]) as (client, session):
        response = client.post("/assets/lookup", json={"hashes": ["a" * 16]})

    assert response.status_code == 422
    assert session.exec_count == 0


def test_asset_lookup_rejects_unknown_hash_algorithm() -> None:
    with lookup_client([]) as (client, session):
        response = client.post(
            "/assets/lookup",
            json={"hashes": [KNOWN_HASH], "algorithm": "SHA-1"},
        )

    assert response.status_code == 422
    assert session.exec_count == 0
