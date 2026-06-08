from functools import lru_cache

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_DATABASE_URL = "postgresql+psycopg://lineage:lineage@localhost:5432/lineage"
LOCAL_CORS_ORIGINS = "http://localhost:3000"
PRODUCTION_ENVIRONMENTS = {"prod", "production"}


def normalize_database_url(value: str) -> str:
    if value.startswith("postgres://"):
        return f"postgresql+psycopg://{value.removeprefix('postgres://')}"
    if value.startswith("postgresql://"):
        return f"postgresql+psycopg://{value.removeprefix('postgresql://')}"
    return value


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "LINEAGE API"
    environment: str = Field(default="local", alias="LINEAGE_ENV")
    database_url: str = Field(default=LOCAL_DATABASE_URL, alias="DATABASE_URL")
    cors_origins: str = Field(default=LOCAL_CORS_ORIGINS, alias="LINEAGE_CORS_ORIGINS")
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

    @field_validator("database_url")
    @classmethod
    def normalize_database_url_scheme(cls, value: str) -> str:
        return normalize_database_url(value)

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]
        return origins or [LOCAL_CORS_ORIGINS]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in PRODUCTION_ENVIRONMENTS

    def require_production_signing_key(self) -> None:
        if self.is_production and not self.ed25519_private_key_b64url:
            raise RuntimeError(
                "LINEAGE_ED25519_PRIVATE_KEY_B64URL is required when LINEAGE_ENV=production"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
