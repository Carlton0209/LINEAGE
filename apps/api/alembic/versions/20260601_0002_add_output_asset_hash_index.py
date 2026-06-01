"""add output asset hash index

Revision ID: 20260601_0002
Revises: 20260520_0001
Create Date: 2026-06-01 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260601_0002"
down_revision: str | None = "20260520_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_ai_events_output_asset_hash_value",
        "ai_events",
        ["output_asset_hash_value"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_ai_events_output_asset_hash_value", table_name="ai_events")
