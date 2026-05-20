from __future__ import annotations

from typing import Any

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from lineage_api.crypto import b64url_decode, canonical_json_bytes, sha256_hex


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
