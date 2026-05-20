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


@lru_cache
def get_settings() -> Settings:
    return Settings()
