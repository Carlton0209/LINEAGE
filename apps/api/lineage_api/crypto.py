from __future__ import annotations

import base64
import hashlib
import json
from typing import Any

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, NoEncryption, PrivateFormat, PublicFormat


def canonical_json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_private_key(private_key_b64url: str) -> Ed25519PrivateKey:
    key_bytes = b64url_decode(private_key_b64url)
    if len(key_bytes) != 32:
        raise ValueError("LINEAGE_ED25519_PRIVATE_KEY_B64URL must decode to 32 bytes")
    return Ed25519PrivateKey.from_private_bytes(key_bytes)


def raw_private_key_b64url(private_key: Ed25519PrivateKey) -> str:
    return b64url_encode(
        private_key.private_bytes(
            encoding=Encoding.Raw,
            format=PrivateFormat.Raw,
            encryption_algorithm=NoEncryption(),
        )
    )


def raw_public_key_b64url(public_key: Ed25519PublicKey) -> str:
    return b64url_encode(
        public_key.public_bytes(
            encoding=Encoding.Raw,
            format=PublicFormat.Raw,
        )
    )
