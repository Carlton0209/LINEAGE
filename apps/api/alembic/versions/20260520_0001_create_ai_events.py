"""create ai events table

Revision ID: 20260520_0001
Revises:
Create Date: 2026-05-20 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260520_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_events",
        sa.Column("event_id", sa.String(length=160), nullable=False),
        sa.Column("project_id", sa.String(length=160), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tool_identifier", sa.String(length=80), nullable=False),
        sa.Column("tool_version", sa.String(length=80), nullable=True),
        sa.Column("tool_url", sa.String(length=500), nullable=True),
        sa.Column("model_identifier", sa.String(length=128), nullable=False),
        sa.Column("model_version", sa.String(length=80), nullable=True),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("negative_prompt_text", sa.Text(), nullable=True),
        sa.Column("output_asset_url", sa.String(length=1000), nullable=False),
        sa.Column("output_asset_hash_algorithm", sa.String(length=32), nullable=True),
        sa.Column("output_asset_hash_value", sa.String(length=128), nullable=True),
        sa.Column("output_asset_type", sa.String(length=32), nullable=False),
        sa.Column("output_mime_type", sa.String(length=120), nullable=True),
        sa.Column("output_duration_seconds", sa.Float(), nullable=True),
        sa.Column("operator_user_id", sa.String(length=160), nullable=False),
        sa.Column("operator_human_name", sa.String(length=200), nullable=True),
        sa.Column(
            "parameters",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "reference_assets",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column(
            "parent_event_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column(
            "raw_event",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("event_id"),
    )
    op.create_index("ix_ai_events_created_at", "ai_events", ["created_at"], unique=False)
    op.create_index("ix_ai_events_model_identifier", "ai_events", ["model_identifier"], unique=False)
    op.create_index("ix_ai_events_occurred_at", "ai_events", ["occurred_at"], unique=False)
    op.create_index("ix_ai_events_operator_user_id", "ai_events", ["operator_user_id"], unique=False)
    op.create_index("ix_ai_events_output_asset_type", "ai_events", ["output_asset_type"], unique=False)
    op.create_index("ix_ai_events_output_asset_url", "ai_events", ["output_asset_url"], unique=False)
    op.create_index("ix_ai_events_project_id", "ai_events", ["project_id"], unique=False)
    op.create_index("ix_ai_events_tool_identifier", "ai_events", ["tool_identifier"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_ai_events_tool_identifier", table_name="ai_events")
    op.drop_index("ix_ai_events_project_id", table_name="ai_events")
    op.drop_index("ix_ai_events_output_asset_url", table_name="ai_events")
    op.drop_index("ix_ai_events_output_asset_type", table_name="ai_events")
    op.drop_index("ix_ai_events_operator_user_id", table_name="ai_events")
    op.drop_index("ix_ai_events_occurred_at", table_name="ai_events")
    op.drop_index("ix_ai_events_model_identifier", table_name="ai_events")
    op.drop_index("ix_ai_events_created_at", table_name="ai_events")
    op.drop_table("ai_events")
