from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "LINEAGE API"
    environment: str = Field(default="local", alias="LINEAGE_ENV")
    database_url: str = Field(
        default="postgresql+psycopg://lineage:lineage@localhost:5432/lineage",
        alias="DATABASE_URL",
    )
    issuer_id: str = Field(default="lineage-local-dev", alias="LINEAGE_ISSUER_ID")
    issuer_name: str = Field(
        default="LINEAGE Local Development Issuer",
        alias="LINEAGE_ISSUER_NAME",
    )
    issuer_url: str | None = Field(default="https://lineage.dev", alias="LINEAGE_ISSUER_URL")
    signing_key_id: str = Field(default="lineage-local-dev-key-001", alias="LINEAGE_KEY_ID")
    ed25519_private_key_b64url: str | None = Field(
        default=None,
        alias="LINEAGE_ED25519_PRIVATE_KEY_B64URL",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
