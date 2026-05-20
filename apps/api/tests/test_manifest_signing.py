from datetime import datetime, timezone

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from lineage_api.config import Settings
from lineage_api.crypto import raw_private_key_b64url
from lineage_api.manifest import build_unsigned_manifest, sign_manifest
from lineage_api.manifest_verifier import verify_signed_manifest
from lineage_api.models import AIEvent


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
