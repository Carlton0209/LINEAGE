from __future__ import annotations

import re
from typing import Any

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from lineage_api.crypto import b64url_decode, b64url_encode, canonical_json_bytes, sha256_hex
from lineage_api.schemas import (
    EVENT_ID_PATTERN as EVENT_ID_PATTERN_TEXT,
    MANIFEST_ID_PATTERN as MANIFEST_ID_PATTERN_TEXT,
    MODEL_ID_PATTERN as MODEL_ID_PATTERN_TEXT,
    PROJECT_ID_PATTERN as PROJECT_ID_PATTERN_TEXT,
    SHA256_PATTERN as SHA256_PATTERN_TEXT,
    TIMESTAMP_PATTERN as TIMESTAMP_PATTERN_TEXT,
    TOOL_ID_PATTERN as TOOL_ID_PATTERN_TEXT,
)

MANIFEST_ID_PATTERN = re.compile(MANIFEST_ID_PATTERN_TEXT)
PROJECT_ID_PATTERN = re.compile(PROJECT_ID_PATTERN_TEXT)
EVENT_ID_PATTERN = re.compile(EVENT_ID_PATTERN_TEXT)
TIMESTAMP_PATTERN = re.compile(TIMESTAMP_PATTERN_TEXT)
SHA256_PATTERN = re.compile(SHA256_PATTERN_TEXT)
TOOL_ID_PATTERN = re.compile(TOOL_ID_PATTERN_TEXT)
MODEL_ID_PATTERN = re.compile(MODEL_ID_PATTERN_TEXT)
PUBLIC_KEY_PATTERN = re.compile(r"^[A-Za-z0-9_-]{43}$")
SIGNATURE_VALUE_PATTERN = re.compile(r"^[A-Za-z0-9_-]{86}$")
ASSET_TYPES = {"image", "video", "audio", "text"}
C2PA_ACTIONS = {"c2pa.created", "c2pa.edited", "c2pa.opened", "c2pa.published"}


def _field_path(parent: str, key: str) -> str:
    return f"{parent}.{key}" if parent else key


def _require_key(payload: dict[str, Any], key: str, parent: str = "") -> Any:
    if key not in payload:
        raise ValueError(f"manifest is missing {_field_path(parent, key)}")
    return payload[key]


def _require_object(payload: dict[str, Any], key: str, parent: str = "") -> dict[str, Any]:
    value = _require_key(payload, key, parent)
    if not isinstance(value, dict):
        raise ValueError(f"manifest {_field_path(parent, key)} must be an object")
    return value


def _require_list(
    payload: dict[str, Any],
    key: str,
    parent: str = "",
    *,
    min_items: int = 0,
) -> list[Any]:
    value = _require_key(payload, key, parent)
    if not isinstance(value, list) or len(value) < min_items:
        raise ValueError(f"manifest {_field_path(parent, key)} must be a non-empty array")
    return value


def _require_string(
    payload: dict[str, Any],
    key: str,
    parent: str = "",
    *,
    pattern: re.Pattern[str] | None = None,
) -> str:
    value = _require_key(payload, key, parent)
    path = _field_path(parent, key)
    if not isinstance(value, str) or not value:
        raise ValueError(f"manifest {path} must be a non-empty string")
    if pattern and not pattern.fullmatch(value):
        raise ValueError(f"manifest {path} has invalid format")
    return value


def _require_const(payload: dict[str, Any], key: str, expected: str, parent: str = "") -> None:
    value = _require_key(payload, key, parent)
    if value != expected:
        raise ValueError(f"manifest {_field_path(parent, key)} must be {expected}")


def _require_one_of(payload: dict[str, Any], key: str, expected: set[str], parent: str = "") -> str:
    value = _require_string(payload, key, parent)
    if value not in expected:
        allowed = ", ".join(sorted(expected))
        raise ValueError(f"manifest {_field_path(parent, key)} must be one of: {allowed}")
    return value


def _validate_signature_shape(signature: dict[str, Any]) -> None:
    _require_const(signature, "type", "LineageEd25519Signature2026", "signature")
    _require_string(signature, "createdAt", "signature", pattern=TIMESTAMP_PATTERN)
    _require_const(signature, "algorithm", "Ed25519", "signature")
    _require_const(signature, "encoding", "base64url", "signature")
    _require_const(signature, "signedPayload", "canonical-json-without-signature", "signature")
    _require_string(signature, "signatureValue", "signature", pattern=SIGNATURE_VALUE_PATTERN)

    public_key = _require_object(signature, "publicKey", "signature")
    _require_const(public_key, "kty", "OKP", "signature.publicKey")
    _require_const(public_key, "crv", "Ed25519", "signature.publicKey")
    _require_string(public_key, "x", "signature.publicKey", pattern=PUBLIC_KEY_PATTERN)

    digest = _require_object(signature, "digest", "signature")
    _require_const(digest, "algorithm", "SHA-256", "signature.digest")
    _require_string(digest, "value", "signature.digest", pattern=SHA256_PATTERN)

    c2pa = _require_object(signature, "c2pa", "signature")
    _require_const(c2pa, "claimSignatureLabel", "c2pa.signature", "signature.c2pa")
    _require_const(c2pa, "coseSignatureStructure", "COSE_Sign1_Tagged", "signature.c2pa")
    _require_const(c2pa, "coseAlgorithm", "EdDSA", "signature.c2pa")
    _require_const(c2pa, "payloadMode", "detached", "signature.c2pa")
    _require_const(c2pa, "externalAAD", "", "signature.c2pa")


def _validate_event_shape(event: dict[str, Any], project_id: str, index: int) -> None:
    event_path = f"events[{index}]"
    event_project_id = _require_string(event, "projectId", event_path, pattern=PROJECT_ID_PATTERN)
    if event_project_id != project_id:
        raise ValueError(f"manifest {event_path}.projectId must match project.id")

    _require_string(event, "eventId", event_path, pattern=EVENT_ID_PATTERN)
    _require_string(event, "timestamp", event_path, pattern=TIMESTAMP_PATTERN)

    tool = _require_object(event, "tool", event_path)
    _require_string(tool, "identifier", f"{event_path}.tool", pattern=TOOL_ID_PATTERN)

    model = _require_object(event, "model", event_path)
    _require_string(model, "identifier", f"{event_path}.model", pattern=MODEL_ID_PATTERN)

    input_payload = _require_object(event, "input", event_path)
    _require_string(input_payload, "promptText", f"{event_path}.input")
    _require_list(input_payload, "referenceAssets", f"{event_path}.input")

    output = _require_object(event, "output", event_path)
    _require_string(output, "assetUrl", f"{event_path}.output")
    output_hash = _require_object(output, "assetHash", f"{event_path}.output")
    _require_const(output_hash, "algorithm", "SHA-256", f"{event_path}.output.assetHash")
    _require_string(output_hash, "value", f"{event_path}.output.assetHash", pattern=SHA256_PATTERN)
    _require_one_of(output, "assetType", ASSET_TYPES, f"{event_path}.output")

    operator = _require_object(event, "operator", event_path)
    _require_string(operator, "userId", f"{event_path}.operator")
    provenance = _require_object(event, "provenance", event_path)
    parent_ids = _require_list(provenance, "parentEventIds", f"{event_path}.provenance")
    seen_parent_ids: set[str] = set()
    for parent_index, parent_event_id in enumerate(parent_ids):
        if not isinstance(parent_event_id, str) or not EVENT_ID_PATTERN.fullmatch(parent_event_id):
            raise ValueError(
                f"manifest {event_path}.provenance.parentEventIds[{parent_index}] has invalid format"
            )
        if parent_event_id in seen_parent_ids:
            raise ValueError(f"manifest {event_path}.provenance.parentEventIds must be unique")
        seen_parent_ids.add(parent_event_id)


def _validate_manifest_shape(manifest: dict[str, Any]) -> None:
    _require_list(manifest, "@context", min_items=1)
    _require_const(manifest, "type", "LineageAIBillOfMaterials")
    _require_const(manifest, "schemaVersion", "0.1.0")
    _require_string(manifest, "manifestId", pattern=MANIFEST_ID_PATTERN)
    _require_string(manifest, "generatedAt", pattern=TIMESTAMP_PATTERN)

    project = _require_object(manifest, "project")
    project_id = _require_string(project, "id", "project", pattern=PROJECT_ID_PATTERN)
    _require_string(project, "name", "project")

    issuer = _require_object(manifest, "issuer")
    _require_string(issuer, "id", "issuer")
    _require_string(issuer, "name", "issuer")

    events = _require_list(manifest, "events", min_items=1)
    for index, event in enumerate(events):
        if not isinstance(event, dict):
            raise ValueError(f"manifest events[{index}] must be an object")
        _validate_event_shape(event, project_id, index)

    c2pa = _require_object(manifest, "c2pa")
    _require_const(c2pa, "specVersion", "2.1", "c2pa")
    _require_one_of(c2pa, "manifestType", {"standard", "update"}, "c2pa")
    _require_const(c2pa, "assertionStoreLabel", "c2pa.assertions", "c2pa")
    _require_const(c2pa, "claimLabel", "c2pa.claim.v2", "c2pa")
    _require_const(c2pa, "claimSignatureLabel", "c2pa.signature", "c2pa")
    _require_string(c2pa, "claimGenerator", "c2pa")
    _require_const(c2pa, "signatureAlgorithm", "EdDSA", "c2pa")
    _require_const(c2pa, "signaturePayloadMode", "detached", "c2pa")
    actions = _require_list(c2pa, "actions", "c2pa", min_items=1)
    for index, action in enumerate(actions):
        action_path = f"c2pa.actions[{index}]"
        if not isinstance(action, dict):
            raise ValueError(f"manifest {action_path} must be an object")
        _require_one_of(action, "action", C2PA_ACTIONS, action_path)
        _require_string(action, "when", action_path, pattern=TIMESTAMP_PATTERN)
        _require_string(action, "softwareAgent", action_path)
        _require_string(action, "lineageEventId", action_path, pattern=EVENT_ID_PATTERN)

    signature = _require_object(manifest, "signature")
    _validate_signature_shape(signature)


def verify_signed_manifest(manifest: dict[str, Any]) -> None:
    signature_block = manifest.get("signature")
    if not isinstance(signature_block, dict):
        raise ValueError("manifest is missing signature block")

    unsigned_manifest = dict(manifest)
    unsigned_manifest.pop("signature", None)
    canonical_payload = canonical_json_bytes(unsigned_manifest)

    expected_digest = sha256_hex(canonical_payload)
    actual_digest = signature_block.get("digest", {}).get("value")
    if actual_digest != expected_digest:
        raise ValueError("manifest digest does not match canonical unsigned payload")

    public_key_jwk = signature_block.get("publicKey", {})
    if public_key_jwk.get("kty") != "OKP" or public_key_jwk.get("crv") != "Ed25519":
        raise ValueError("signature publicKey must be an Ed25519 OKP JWK")

    public_key_value = public_key_jwk.get("x")
    signature_value = signature_block.get("signatureValue")
    if not isinstance(public_key_value, str) or not isinstance(signature_value, str):
        raise ValueError("signature block is missing public key or signature value")

    public_key = Ed25519PublicKey.from_public_bytes(b64url_decode(public_key_value))
    public_key.verify(b64url_decode(signature_value), canonical_payload)
    _validate_manifest_shape(manifest)


def public_key_fingerprint(public_key_b64url: str, key_id: str | None = None) -> str:
    raw_public_key = b64url_decode(public_key_b64url)
    digest = b64url_encode(bytes.fromhex(sha256_hex(raw_public_key)))[:16]
    chunks = ":".join(digest[index : index + 4] for index in range(0, 16, 4))
    prefix = (key_id or "key").split("-", maxsplit=1)[0] or "key"
    return f"{prefix}:{chunks}"


def verification_result(manifest: dict[str, Any]) -> dict[str, Any]:
    try:
        verify_signed_manifest(manifest)
    except Exception as exc:
        return {"valid": False, "reason": str(exc)}

    signature = manifest["signature"]
    public_key = signature["publicKey"]
    project = manifest["project"]

    return {
        "valid": True,
        "manifestId": manifest["manifestId"],
        "projectId": project["id"],
        "generatedAt": manifest["generatedAt"],
        "eventCount": len(manifest["events"]),
        "publicKeyFingerprint": public_key_fingerprint(
            public_key["x"],
            public_key.get("kid"),
        ),
        "digestAlgorithm": signature["digest"]["algorithm"],
    }
