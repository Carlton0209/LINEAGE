from datetime import datetime, timezone

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi.testclient import TestClient

from lineage_api.config import Settings
from lineage_api.main import app
from lineage_api.crypto import raw_private_key_b64url
from lineage_api.manifest import build_unsigned_manifest, sign_manifest
from lineage_api.manifest_verifier import verification_result, verify_signed_manifest
from lineage_api.models import AIEvent
from lineage_api.pdf import generate_manifest_pdf


def make_settings() -> Settings:
    private_key = Ed25519PrivateKey.generate()
    return Settings(
        LINEAGE_ED25519_PRIVATE_KEY_B64URL=raw_private_key_b64url(private_key),
        LINEAGE_KEY_ID="test-key-001",
    )


def make_event() -> AIEvent:
    return AIEvent(
        event_id="evt_test0001",
        project_id="prj_week_zero",
        occurred_at=datetime(2026, 5, 20, 14, 20, 30, tzinfo=timezone.utc),
        tool_identifier="runway-ml",
        model_identifier="gen-3-alpha",
        prompt_text="A test prompt",
        output_asset_url="https://assets.example.com/output.mp4",
        output_asset_hash_algorithm="SHA-256",
        output_asset_hash_value="b1c25a5e0b182f6c0ad84c35e8b5273f470e529bf7f1d3a3c2f9a6b7c8d9e0f1",
        output_asset_type="video",
        operator_user_id="user_local_001",
        reference_assets=[],
        parent_event_ids=[],
        parameters={"durationSeconds": 10},
        raw_event={},
    )


def test_signed_manifest_verifies() -> None:
    settings = make_settings()
    unsigned_manifest = build_unsigned_manifest(
        "prj_week_zero",
        [make_event()],
        settings,
        generated_at=datetime(2026, 5, 20, 15, 0, 0, tzinfo=timezone.utc),
    )

    signed_manifest = sign_manifest(unsigned_manifest, settings)

    verify_signed_manifest(signed_manifest)
    assert signed_manifest["signature"]["publicKey"]["crv"] == "Ed25519"
    assert signed_manifest["signature"]["digest"]["algorithm"] == "SHA-256"


def test_verification_result_returns_manifest_summary() -> None:
    settings = make_settings()
    unsigned_manifest = build_unsigned_manifest(
        "prj_week_zero",
        [make_event()],
        settings,
        generated_at=datetime(2026, 5, 20, 15, 0, 0, tzinfo=timezone.utc),
    )
    signed_manifest = sign_manifest(unsigned_manifest, settings)

    result = verification_result(signed_manifest)

    assert result == {
        "valid": True,
        "manifestId": signed_manifest["manifestId"],
        "projectId": "prj_week_zero",
        "generatedAt": "2026-05-20T15:00:00Z",
        "eventCount": 1,
        "publicKeyFingerprint": result["publicKeyFingerprint"],
        "digestAlgorithm": "SHA-256",
    }
    assert result["publicKeyFingerprint"].startswith("test:")


def test_tampered_manifest_fails_verification() -> None:
    settings = make_settings()
    unsigned_manifest = build_unsigned_manifest(
        "prj_week_zero",
        [make_event()],
        settings,
        generated_at=datetime(2026, 5, 20, 15, 0, 0, tzinfo=timezone.utc),
    )
    signed_manifest = sign_manifest(unsigned_manifest, settings)
    signed_manifest["events"][0]["input"]["promptText"] = "A tampered prompt"

    with pytest.raises(ValueError, match="digest"):
        verify_signed_manifest(signed_manifest)


def test_verify_manifest_endpoint_roundtrip_and_failure() -> None:
    settings = make_settings()
    unsigned_manifest = build_unsigned_manifest(
        "prj_week_zero",
        [make_event()],
        settings,
        generated_at=datetime(2026, 5, 20, 15, 0, 0, tzinfo=timezone.utc),
    )
    signed_manifest = sign_manifest(unsigned_manifest, settings)
    client = TestClient(app)

    valid_response = client.post("/manifest/verify", json=signed_manifest)

    assert valid_response.status_code == 200
    valid_body = valid_response.json()
    assert valid_body["valid"] is True
    assert valid_body["manifestId"] == signed_manifest["manifestId"]
    assert valid_body["projectId"] == "prj_week_zero"
    assert valid_body["generatedAt"] == "2026-05-20T15:00:00Z"
    assert valid_body["eventCount"] == 1
    assert valid_body["digestAlgorithm"] == "SHA-256"
    assert valid_body["publicKeyFingerprint"].startswith("test:")

    signed_manifest["events"][0]["input"]["promptText"] = "A tampered prompt"
    invalid_response = client.post("/manifest/verify", json=signed_manifest)

    assert invalid_response.status_code == 200
    assert invalid_response.json() == {
        "valid": False,
        "reason": "manifest digest does not match canonical unsigned payload",
    }


def test_manifest_pdf_generation_returns_pdf_bytes() -> None:
    settings = make_settings()
    unsigned_manifest = build_unsigned_manifest(
        "prj_week_zero",
        [make_event()],
        settings,
        generated_at=datetime(2026, 5, 20, 15, 0, 0, tzinfo=timezone.utc),
    )
    signed_manifest = sign_manifest(unsigned_manifest, settings)

    pdf_bytes = generate_manifest_pdf(signed_manifest)

    assert pdf_bytes.startswith(b"%PDF")
    assert b"LINEAGE AI Bill of Materials" in pdf_bytes
