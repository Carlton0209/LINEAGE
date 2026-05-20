from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from lineage_api.crypto import raw_private_key_b64url, raw_public_key_b64url


def main() -> None:
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    print(f"LINEAGE_ED25519_PRIVATE_KEY_B64URL={raw_private_key_b64url(private_key)}")
    print(f"LINEAGE_ED25519_PUBLIC_KEY_B64URL={raw_public_key_b64url(public_key)}")


if __name__ == "__main__":
    main()
