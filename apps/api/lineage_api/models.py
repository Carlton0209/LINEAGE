from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AIEvent(SQLModel, table=True):
    __tablename__ = "ai_events"

    event_id: str = Field(primary_key=True, max_length=160)
    project_id: str = Field(index=True, max_length=160)
    occurred_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), index=True, nullable=False),
    )
    tool_identifier: str = Field(index=True, max_length=80)
    tool_version: str | None = Field(default=None, max_length=80)
    tool_url: str | None = Field(default=None, max_length=500)
    model_identifier: str = Field(index=True, max_length=128)
    model_version: str | None = Field(default=None, max_length=80)
    prompt_text: str
    negative_prompt_text: str | None = None
    output_asset_url: str = Field(index=True, max_length=1000)
    output_asset_hash_algorithm: str | None = Field(default=None, max_length=32)
    output_asset_hash_value: str | None = Field(default=None, index=True, max_length=128)
    output_asset_type: str = Field(index=True, max_length=32)
    output_mime_type: str | None = Field(default=None, max_length=120)
    output_duration_seconds: float | None = None
    operator_user_id: str = Field(index=True, max_length=160)
    operator_human_name: str | None = Field(default=None, max_length=200)
    parameters: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="{}"),
    )
    reference_assets: list[dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSONB, nullable=False, server_default="[]"),
    )
    parent_event_ids: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSONB, nullable=False, server_default="[]"),
    )
    raw_event: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="{}"),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), index=True, nullable=False),
    )
