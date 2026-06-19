from datetime import datetime, timezone
from typing import Any

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi.testclient import TestClient

from lineage_api.config import Settings
from lineage_api.crypto import raw_private_key_b64url
from lineage_api.main import MAX_VERIFY_MANIFEST_BYTES, app
from lineage_api.manifest import build_unsigned_manifest, sign_manifest
from lineage_api.manifest_verifier import verification_result, verify_signed_manifest
from lineage_api.models import AIEvent
from lineage_api.pdf import generate_manifest_pdf


VALID_HASH = "b1c25a5e0b182f6c0ad84c35e8b5273f470e529bf7f1d3a3c2f9a6b7c8d9e0f1"


def make_settings() -> Settings:
    private_key = Ed25519PrivateKey.generate()
    return Settings(
        LINEAGE_ED25519_PRIVATE_KEY_B64URL=raw_private_key_b64url(private_key),
        LINEAGE_KEY_ID="test-key-001",
    )


def make_event(
    *,
    event_id: str = "evt_test0001",
    occurred_at: datetime | None = None,
    parent_event_ids: list[str] | None = None,
    asset_type: str = "video",
    asset_hash: str = VALID_HASH,
    tool_identifier: str = "runway-ml",
    model_identifier: str = "gen-3-alpha",
    prompt_text: str = "A test prompt",
    raw_event: dict[str, Any] | None = None,
) -> AIEvent:
    return AIEvent(
        event_id=event_id,
        project_id="prj_week_zero",
        occurred_at=occurred_at or datetime(2026, 5, 20, 14, 20, 30, tzinfo=timezone.utc),
        tool_identifier=tool_identifier,
        model_identifier=model_identifier,
        prompt_text=prompt_text,
        output_asset_url=f"https://assets.example.com/{event_id}.{asset_type}",
        output_asset_hash_algorithm="SHA-256",
        output_asset_hash_value=asset_hash,
        output_asset_type=asset_type,
        operator_user_id="user_local_001",
        reference_assets=[],
        parent_event_ids=parent_event_ids or [],
        parameters={"durationSeconds": 10},
        raw_event=raw_event or {},
    )


def project_fields() -> dict[str, str]:
    return {
        "title": "Week Zero",
        "productionCompany": "Northlight Pictures",
        "deliveryTarget": "streamer_orig_v3",
        "periodStart": "2026-05-01",
        "periodEnd": "2026-05-31",
    }


def rights(
    *,
    commercial_use: str = "permitted",
    output_license: str = "runway-enterprise",
    training_data_basis: str = "licensed",
) -> dict[str, str]:
    return {
        "commercialUse": commercial_use,
        "outputLicense": output_license,
        "trainingDataBasis": training_data_basis,
    }


def disclosure(category: str = "ai visual effects") -> dict[str, str]:
    return {"category": category, "buyerProfile": "streamer_orig_v3"}


def consent() -> dict[str, str]:
    return {
        "consentId": "cons_sag_001",
        "subject": "Jordan Lee",
        "scope": "Synthetic voice for Week Zero Episode 104",
        "guildReference": "SAG-AFTRA-AI-2026-001",
    }


def add_event_clearance(
    manifest: dict[str, Any],
    *,
    category: str = "ai visual effects",
) -> None:
    manifest["project"].update(project_fields())
    manifest["project"]["name"] = manifest["project"]["title"]
    for event in manifest["events"]:
        event["rights"] = rights()
        event["disclosure"] = disclosure(category)


def signed_manifest(
    *,
    events: list[AIEvent] | None = None,
    schema_version: str = "0.2.0",
    add_clearance: bool = True,
) -> dict[str, Any]:
    settings = make_settings()
    unsigned_manifest = build_unsigned_manifest(
        "prj_week_zero",
        events or [make_event()],
        settings,
        generated_at=datetime(2026, 5, 20, 15, 0, 0, tzinfo=timezone.utc),
    )

    if schema_version == "0.1.0":
        unsigned_manifest["@context"][0] = "https://lineage.dev/contexts/ai-bom/v0.1"
        unsigned_manifest["schemaVersion"] = "0.1.0"
        unsigned_manifest["c2pa"]["claimGenerator"] = "LINEAGE/0.1.0"
        unsigned_manifest["project"] = {"id": "prj_week_zero", "name": "prj_week_zero"}
    elif add_clearance:
        add_event_clearance(unsigned_manifest)

    return sign_manifest(unsigned_manifest, settings)


def stage(report: dict[str, Any], stage_id: str) -> dict[str, Any]:
    return next(item for item in report["stages"] if item["id"] == stage_id)


def finding_messages(stage_report: dict[str, Any]) -> set[str]:
    return {finding["message"] for finding in stage_report["findings"]}


def test_signed_manifest_verifies() -> None:
    manifest = signed_manifest()

    verify_signed_manifest(manifest)
    assert manifest["schemaVersion"] == "0.2.0"
    assert manifest["signature"]["publicKey"]["crv"] == "Ed25519"
    assert manifest["signature"]["digest"]["algorithm"] == "SHA-256"


def test_fully_clean_0_2_manifest_reports_verified() -> None:
    manifest = signed_manifest()

    report = verification_result(manifest)

    assert report["overall"]["status"] == "verified"
    assert report["project"] == {
        "id": "prj_week_zero",
        "title": "Week Zero",
        "productionCompany": "Northlight Pictures",
        "deliveryTarget": "streamer_orig_v3",
    }
    assert report["issuerFingerprint"].startswith("lng:")
    assert stage(report, "structure")["status"] == "verified"
    assert stage(report, "integrity")["status"] == "verified"
    assert stage(report, "provenance")["status"] == "verified"
    assert stage(report, "completeness")["status"] == "verified"
    assert stage(report, "asset_match")["status"] == "informational"
    assert report["disclosure"] == [{"category": "ai visual effects", "status": "verified"}]


def test_manifest_with_completeness_findings_reports_verified_with_attention() -> None:
    manifest = signed_manifest(
        events=[
            make_event(event_id="evt_comfy0001"),
            make_event(
                event_id="evt_voice0002",
                occurred_at=datetime(2026, 5, 20, 14, 25, 30, tzinfo=timezone.utc),
                asset_type="audio",
                asset_hash="cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
                tool_identifier="elevenlabs",
                model_identifier="eleven-v3",
                prompt_text="Synthetic dialogue read for the episode teaser.",
            ),
        ]
    )
    manifest["events"][0]["rights"] = rights(output_license="flux-dev-noncommercial")
    manifest["events"][0]["disclosure"] = disclosure("ai inpaint cleanup")
    manifest["events"][1]["rights"] = rights()
    manifest["events"][1]["disclosure"] = disclosure("synthetic voice")
    manifest = sign_manifest({k: v for k, v in manifest.items() if k != "signature"}, make_settings())

    report = verification_result(manifest)
    completeness = stage(report, "completeness")

    assert report["overall"]["status"] == "verified_with_attention"
    assert completeness["status"] == "attention"
    assert {
        "license is non-commercial or temporary",
        "synthetic likeness or voice without a consent reference",
    }.issubset(finding_messages(completeness))
    assert {"category": "ai inpaint cleanup", "status": "attention"} in report["disclosure"]
    assert {"category": "synthetic voice", "status": "attention"} in report["disclosure"]


def test_tampered_manifest_reports_integrity_failed() -> None:
    manifest = signed_manifest()
    manifest["events"][0]["input"]["promptText"] = "A tampered prompt"

    report = verification_result(manifest)

    assert report["overall"]["status"] == "failed"
    assert stage(report, "structure")["status"] == "verified"
    assert stage(report, "integrity")["status"] == "failed"
    assert "content changed since signing" in stage(report, "integrity")["detail"]
    assert "evaluated on presented content" in stage(report, "completeness")["detail"]
    with pytest.raises(ValueError, match="digest"):
        verify_signed_manifest(manifest)


def test_dangling_parent_event_id_reports_provenance_failed() -> None:
    manifest = signed_manifest(
        events=[
            make_event(),
            make_event(
                event_id="evt_child0002",
                occurred_at=datetime(2026, 5, 20, 14, 25, 30, tzinfo=timezone.utc),
                parent_event_ids=["evt_missing01"],
                asset_hash="dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
            ),
        ]
    )

    report = verification_result(manifest)
    provenance = stage(report, "provenance")

    assert stage(report, "structure")["status"] == "verified"
    assert stage(report, "integrity")["status"] == "verified"
    assert provenance["status"] == "failed"
    assert provenance["findings"] == [
        {
            "eventId": "evt_child0002",
            "level": "attention",
            "message": "dangling parent reference: evt_missing01",
        }
    ]


def test_legacy_0_1_manifest_without_new_blocks_still_verifies_with_attention() -> None:
    manifest = signed_manifest(schema_version="0.1.0", add_clearance=False)

    report = verification_result(manifest)

    assert report["overall"]["status"] == "verified_with_attention"
    assert stage(report, "structure")["status"] == "verified"
    assert stage(report, "integrity")["status"] == "verified"
    assert stage(report, "completeness")["status"] == "attention"
    assert finding_messages(stage(report, "completeness")) == {
        "no disclosure category",
        "no rights information",
    }


def test_structure_reports_mutated_signature_metadata() -> None:
    manifest = signed_manifest()
    manifest["signature"]["digest"]["algorithm"] = "MD5"

    report = verification_result(manifest)

    assert report["overall"]["status"] == "failed"
    assert stage(report, "structure")["status"] == "failed"
    assert "manifest signature.digest.algorithm must be SHA-256" in stage(
        report,
        "structure",
    )["detail"]


def test_structure_reports_signed_manifest_missing_project() -> None:
    settings = make_settings()
    unsigned_manifest = build_unsigned_manifest(
        "prj_week_zero",
        [make_event()],
        settings,
        generated_at=datetime(2026, 5, 20, 15, 0, 0, tzinfo=timezone.utc),
    )
    unsigned_manifest.pop("project")
    manifest = sign_manifest(unsigned_manifest, settings)

    report = verification_result(manifest)

    assert report["overall"]["status"] == "failed"
    assert stage(report, "structure")["detail"] == "malformed: manifest is missing project"


def test_structure_reports_signed_manifest_with_empty_events() -> None:
    manifest = signed_manifest()
    unsigned_manifest = {k: v for k, v in manifest.items() if k != "signature"}
    unsigned_manifest["events"] = []
    manifest = sign_manifest(unsigned_manifest, make_settings())

    report = verification_result(manifest)

    assert report["overall"]["status"] == "failed"
    assert stage(report, "structure")["detail"] == (
        "malformed: manifest events must be a non-empty array"
    )


@pytest.mark.parametrize(
    "invalid_event",
    [
        {
            "input": {
                "promptText": "A test prompt",
                "parameters": {"style": {"preset": "cinematic"}},
                "referenceAssets": [],
            }
        },
        {
            "input": {
                "promptText": "A test prompt",
                "referenceAssets": [
                    {
                        "assetHash": {"algorithm": "MD5", "value": "not-a-sha256"},
                        "assetType": "archive",
                    }
                ],
            }
        },
        {"trusted": True},
    ],
    ids=["nested-parameters", "invalid-reference-asset", "unknown-event-field"],
)
def test_structure_reports_signed_manifest_with_invalid_event_schema(
    invalid_event: dict[str, Any],
) -> None:
    manifest = signed_manifest()
    unsigned_manifest = {k: v for k, v in manifest.items() if k != "signature"}
    unsigned_manifest["events"][0].update(invalid_event)
    manifest = sign_manifest(unsigned_manifest, make_settings())

    report = verification_result(manifest)

    assert report["overall"]["status"] == "failed"
    assert stage(report, "structure")["detail"] == (
        "malformed: manifest events[0] does not match event schema"
    )


@pytest.mark.parametrize(
    ("mutation", "expected_reason"),
    [
        ("duplicate-event-id", "manifest events eventId values must be unique"),
        (
            "unknown-c2pa-event",
            "manifest c2pa.actions[0].lineageEventId must reference an event in this manifest",
        ),
        ("duplicate-c2pa-event", "manifest c2pa.actions lineageEventId values must be unique"),
        ("missing-c2pa-action", "manifest c2pa.actions must cover every event"),
    ],
)
def test_structure_reports_signed_manifest_with_broken_manifest_references(
    mutation: str,
    expected_reason: str,
) -> None:
    manifest = signed_manifest(
        events=[
            make_event(),
            make_event(
                event_id="evt_test0002",
                occurred_at=datetime(2026, 5, 20, 14, 25, 30, tzinfo=timezone.utc),
                parent_event_ids=["evt_test0001"],
                asset_hash="eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            ),
        ]
    )
    unsigned_manifest = {k: v for k, v in manifest.items() if k != "signature"}

    if mutation == "duplicate-event-id":
        unsigned_manifest["events"][1]["eventId"] = "evt_test0001"
    elif mutation == "unknown-c2pa-event":
        unsigned_manifest["c2pa"]["actions"][0]["lineageEventId"] = "evt_missing01"
    elif mutation == "duplicate-c2pa-event":
        unsigned_manifest["c2pa"]["actions"][1]["lineageEventId"] = "evt_test0001"
    elif mutation == "missing-c2pa-action":
        unsigned_manifest["c2pa"]["actions"].pop()
    manifest = sign_manifest(unsigned_manifest, make_settings())

    report = verification_result(manifest)

    assert report["overall"]["status"] == "failed"
    assert stage(report, "structure")["detail"] == f"malformed: {expected_reason}"


def test_provenance_reports_cycles() -> None:
    manifest = signed_manifest(
        events=[
            make_event(event_id="evt_cycle001", parent_event_ids=["evt_cycle002"]),
            make_event(
                event_id="evt_cycle002",
                occurred_at=datetime(2026, 5, 20, 14, 25, 30, tzinfo=timezone.utc),
                parent_event_ids=["evt_cycle001"],
                asset_hash="ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            ),
        ]
    )

    report = verification_result(manifest)

    assert stage(report, "structure")["status"] == "verified"
    assert stage(report, "provenance")["status"] == "failed"
    assert "cycle detected" in stage(report, "provenance")["findings"][0]["message"]


def test_asset_match_reports_matched_and_unmatched_hashes() -> None:
    manifest = signed_manifest()

    report = verification_result(
        manifest,
        asset_hashes=[VALID_HASH, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
    )

    asset_match = stage(report, "asset_match")
    assert report["overall"]["status"] == "verified_with_attention"
    assert asset_match["status"] == "attention"
    assert asset_match["detail"] == "matched 1 of 2 provided asset hashes"
    assert asset_match["findings"] == [
        {
            "eventId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "level": "attention",
            "message": "provided hash not found in manifest outputs",
        }
    ]


def test_verify_manifest_endpoint_roundtrip_and_failure() -> None:
    manifest = signed_manifest()
    client = TestClient(app)

    valid_response = client.post("/manifest/verify", json=manifest)

    assert valid_response.status_code == 200
    valid_body = valid_response.json()
    assert valid_body["overall"]["status"] == "verified"
    assert valid_body["project"]["id"] == "prj_week_zero"
    assert valid_body["issuerFingerprint"].startswith("lng:")
    assert stage(valid_body, "integrity")["status"] == "verified"

    manifest["events"][0]["input"]["promptText"] = "A tampered prompt"
    invalid_response = client.post("/manifest/verify", json=manifest)

    assert invalid_response.status_code == 200
    invalid_body = invalid_response.json()
    assert invalid_body["overall"]["status"] == "failed"
    assert stage(invalid_body, "integrity")["status"] == "failed"


def test_verify_manifest_endpoint_accepts_asset_hash_wrapper() -> None:
    manifest = signed_manifest()
    client = TestClient(app)

    response = client.post(
        "/manifest/verify",
        json={
            "manifest": manifest,
            "assetHashes": [
                VALID_HASH,
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert stage(body, "asset_match")["status"] == "attention"


def test_verify_manifest_endpoint_rejects_oversized_payload_before_verifier(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    verifier_called = False

    def fake_verification_result(
        _manifest: dict[str, Any],
        asset_hashes: list[str] | None = None,
    ) -> dict[str, Any]:
        del asset_hashes
        nonlocal verifier_called
        verifier_called = True
        return {"overall": {"status": "verified"}}

    monkeypatch.setattr("lineage_api.main.verification_result", fake_verification_result)
    client = TestClient(app)
    oversized_manifest = b'{"padding":"' + (b"a" * MAX_VERIFY_MANIFEST_BYTES) + b'"}'

    response = client.post(
        "/manifest/verify",
        content=oversized_manifest,
        headers={"Content-Type": "application/json"},
    )

    assert response.status_code == 413
    assert response.json() == {"detail": "manifest verification payload exceeds 1 MB"}
    assert verifier_called is False


def test_verify_manifest_endpoint_rejects_non_object_payload_before_verifier(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    verifier_called = False

    def fake_verification_result(
        _manifest: dict[str, Any],
        asset_hashes: list[str] | None = None,
    ) -> dict[str, Any]:
        del asset_hashes
        nonlocal verifier_called
        verifier_called = True
        return {"overall": {"status": "verified"}}

    monkeypatch.setattr("lineage_api.main.verification_result", fake_verification_result)
    client = TestClient(app)

    response = client.post("/manifest/verify", json=[])

    assert response.status_code == 400
    assert response.json() == {"detail": "manifest verification payload must be a JSON object"}
    assert verifier_called is False


def test_manifest_routes_reject_invalid_project_id_before_signing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    signing_called = False

    def fake_signed_manifest_for_project(project_id: str, _session: object) -> dict[str, Any]:
        nonlocal signing_called
        signing_called = True
        return {"project": {"id": project_id}}

    monkeypatch.setattr("lineage_api.main._signed_manifest_for_project", fake_signed_manifest_for_project)
    client = TestClient(app)

    manifest_response = client.post("/manifest/not-a-project")
    pdf_response = client.post("/manifest/not-a-project/pdf")

    assert manifest_response.status_code == 422
    assert pdf_response.status_code == 422
    assert signing_called is False


def test_manifest_pdf_generation_returns_pdf_bytes() -> None:
    manifest = signed_manifest()

    pdf_bytes = generate_manifest_pdf(manifest)

    assert pdf_bytes.startswith(b"%PDF")
    assert b"LINEAGE AI Bill of Materials" in pdf_bytes
