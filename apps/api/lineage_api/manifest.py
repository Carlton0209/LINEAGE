from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from lineage_api.config import Settings
from lineage_api.crypto import (
    b64url_encode,
    canonical_json_bytes,
    load_private_key,
    raw_public_key_b64url,
    sha256_hex,
)
from lineage_api.models import AIEvent

SCHEMA_VERSION = "0.1.0"


def isoformat_z(value: datetime) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        value = value.replace(tzinfo=timezone.utc)
    value = value.astimezone(timezone.utc)
    return value.isoformat(timespec="seconds").replace("+00:00", "Z")


def event_to_manifest_event(event: AIEvent) -> dict[str, Any]:
    if not event.output_asset_hash_algorithm or not event.output_asset_hash_value:
        raise ValueError(f"event {event.event_id} is missing output asset hash")

    output_hash = {
        "algorithm": event.output_asset_hash_algorithm,
        "value": event.output_asset_hash_value,
    }

    output: dict[str, Any] = {
        "assetUrl": event.output_asset_url,
        "assetHash": output_hash,
        "assetType": event.output_asset_type,
    }
    if event.output_mime_type:
        output["mimeType"] = event.output_mime_type
    if event.output_duration_seconds:
        output["durationSeconds"] = event.output_duration_seconds

    tool: dict[str, Any] = {"identifier": event.tool_identifier}
    if event.tool_version:
        tool["version"] = event.tool_version
    if event.tool_url:
        tool["url"] = event.tool_url

    model: dict[str, Any] = {"identifier": event.model_identifier}
    if event.model_version:
        model["version"] = event.model_version

    input_payload: dict[str, Any] = {
        "promptText": event.prompt_text,
        "referenceAssets": event.reference_assets,
    }
    if event.negative_prompt_text:
        input_payload["negativePromptText"] = event.negative_prompt_text
    if event.parameters:
        input_payload["parameters"] = event.parameters

    operator: dict[str, Any] = {"userId": event.operator_user_id}
    if event.operator_human_name:
        operator["humanName"] = event.operator_human_name

    return {
        "eventId": event.event_id,
        "timestamp": isoformat_z(event.occurred_at),
        "projectId": event.project_id,
        "tool": tool,
        "model": model,
        "input": input_payload,
        "output": output,
        "operator": operator,
        "provenance": {
            "parentEventIds": event.parent_event_ids,
        },
    }


def build_unsigned_manifest(
    project_id: str,
    events: list[AIEvent],
    settings: Settings,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    generated_at = generated_at or datetime.now(timezone.utc)
    sorted_events = sorted(events, key=lambda event: (event.occurred_at, event.event_id))
    manifest_events = [event_to_manifest_event(event) for event in sorted_events]

    issuer: dict[str, Any] = {
        "id": settings.issuer_id,
        "name": settings.issuer_name,
    }
    if settings.issuer_url:
        issuer["url"] = settings.issuer_url

    return {
        "@context": [
            "https://lineage.dev/contexts/ai-bom/v0.1",
            {
                "c2pa": (
                    "https://c2pa.org/specifications/specifications/2.1/"
                    "specs/C2PA_Specification.html#"
                )
            },
        ],
        "type": "LineageAIBillOfMaterials",
        "schemaVersion": SCHEMA_VERSION,
        "manifestId": f"urn:lineage:manifest:{project_id}:{generated_at.strftime('%Y%m%dT%H%M%SZ')}",
        "project": {
            "id": project_id,
            "name": project_id,
        },
        "generatedAt": isoformat_z(generated_at),
        "issuer": issuer,
        "events": manifest_events,
        "c2pa": {
            "specVersion": "2.1",
            "manifestType": "standard",
            "assertionStoreLabel": "c2pa.assertions",
            "claimLabel": "c2pa.claim.v2",
            "claimSignatureLabel": "c2pa.signature",
            "claimGenerator": f"LINEAGE/{SCHEMA_VERSION}",
            "signatureAlgorithm": "EdDSA",
            "signaturePayloadMode": "detached",
            "actions": [
                {
                    "action": "c2pa.created" if not event.parent_event_ids else "c2pa.edited",
                    "when": isoformat_z(event.occurred_at),
                    "softwareAgent": f"{event.tool_identifier} {event.model_identifier}",
                    "lineageEventId": event.event_id,
                }
                for event in sorted_events
            ],
        },
    }


def sign_manifest(unsigned_manifest: dict[str, Any], settings: Settings) -> dict[str, Any]:
    if not settings.ed25519_private_key_b64url:
        raise ValueError("LINEAGE_ED25519_PRIVATE_KEY_B64URL is required to sign manifests")

    private_key = load_private_key(settings.ed25519_private_key_b64url)
    canonical_payload = canonical_json_bytes(unsigned_manifest)
    signature = private_key.sign(canonical_payload)
    public_key = private_key.public_key()

    signed_manifest = dict(unsigned_manifest)
    signed_manifest["signature"] = {
        "type": "LineageEd25519Signature2026",
        "createdAt": unsigned_manifest["generatedAt"],
        "algorithm": "Ed25519",
        "encoding": "base64url",
        "publicKey": {
            "kid": settings.signing_key_id,
            "kty": "OKP",
            "crv": "Ed25519",
            "x": raw_public_key_b64url(public_key),
        },
        "signedPayload": "canonical-json-without-signature",
        "digest": {
            "algorithm": "SHA-256",
            "value": sha256_hex(canonical_payload),
        },
        "signatureValue": b64url_encode(signature),
        "c2pa": {
            "claimSignatureLabel": "c2pa.signature",
            "coseSignatureStructure": "COSE_Sign1_Tagged",
            "coseAlgorithm": "EdDSA",
            "payloadMode": "detached",
            "externalAAD": "",
        },
    }
    return signed_manifest
