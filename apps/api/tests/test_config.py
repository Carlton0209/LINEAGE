import pytest
from fastapi.testclient import TestClient

from lineage_api.config import Settings
from lineage_api.main import app


def test_database_url_normalizes_platform_postgres_scheme() -> None:
    settings = Settings(DATABASE_URL="postgres://user:pass@db.example.com:5432/lineage")

    assert settings.database_url == "postgresql+psycopg://user:pass@db.example.com:5432/lineage"


def test_database_url_adds_psycopg_driver_to_bare_postgresql_scheme() -> None:
    settings = Settings(DATABASE_URL="postgresql://user:pass@db.example.com:5432/lineage")

    assert settings.database_url == "postgresql+psycopg://user:pass@db.example.com:5432/lineage"


def test_cors_origin_list_uses_comma_separated_env_values() -> None:
    settings = Settings(
        LINEAGE_CORS_ORIGINS="https://lineage.example.com/, http://localhost:3000"
    )

    assert settings.cors_origin_list == ["https://lineage.example.com", "http://localhost:3000"]


def test_production_requires_persistent_signing_key() -> None:
    settings = Settings(LINEAGE_ENV="production", LINEAGE_ED25519_PRIVATE_KEY_B64URL=None)

    with pytest.raises(RuntimeError, match="LINEAGE_ED25519_PRIVATE_KEY_B64URL"):
        settings.require_production_signing_key()


def test_cors_preflight_allows_local_dev_origin() -> None:
    client = TestClient(app)

    response = client.options(
        "/events",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in response.headers["access-control-allow-methods"]
