"""body_measurements, progress_photos, cbt_sessions, and cbt_messages

Revision ID: c9e4a7f21d58
Revises: b4d8e2a19c37
Create Date: 2026-11-12 22:52:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from app.services.rls import disable_rls_sql, harden_public_tables_sql

# revision identifiers, used by Alembic.
revision: str = "c9e4a7f21d58"
down_revision: Union[str, Sequence[str], None] = "b4d8e2a19c37"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

HARDENED_PUBLIC_TABLES: tuple[str, ...] = (
    "body_measurements",
    "progress_photos",
    "cbt_sessions",
    "cbt_messages",
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    op.create_table(
        "body_measurements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("neck_cm", sa.Float(), nullable=True),
        sa.Column("waist_cm", sa.Float(), nullable=True),
        sa.Column("hip_cm", sa.Float(), nullable=True),
        sa.Column("body_fat_pct", sa.Float(), nullable=True),
        sa.Column("body_fat_category", sa.String(length=30), nullable=True),
        sa.Column("local_date", sa.Date(), nullable=False),
        sa.Column("measured_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "weight_kg > 20 AND weight_kg < 400",
            name="ck_body_measurements_weight_range",
        ),
        sa.CheckConstraint(
            "neck_cm IS NULL OR neck_cm > 0",
            name="ck_body_measurements_neck_pos",
        ),
        sa.CheckConstraint(
            "waist_cm IS NULL OR waist_cm > 0",
            name="ck_body_measurements_waist_pos",
        ),
        sa.CheckConstraint(
            "hip_cm IS NULL OR hip_cm > 0",
            name="ck_body_measurements_hip_pos",
        ),
        sa.CheckConstraint(
            "body_fat_pct IS NULL OR (body_fat_pct >= 2 AND body_fat_pct <= 75)",
            name="ck_body_measurements_body_fat_range",
        ),
        sa.CheckConstraint(
            "body_fat_category IS NULL OR body_fat_category IN ('essential', 'athlete', 'fitness', 'average', 'obese')",
            name="ck_body_measurements_body_fat_category",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_body_measurements_user_measured_at",
        "body_measurements",
        ["user_id", "measured_at"],
        unique=False,
    )

    op.create_table(
        "progress_photos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("angle", sa.String(length=20), nullable=False),
        sa.Column("storage_bucket", sa.String(length=64), server_default="progress-photos", nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=50), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("local_date", sa.Date(), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "angle IN ('front', 'side', 'back')",
            name="ck_progress_photos_angle",
        ),
        sa.CheckConstraint(
            "mime_type IN ('image/webp', 'image/jpeg', 'image/png')",
            name="ck_progress_photos_mime_type",
        ),
        sa.CheckConstraint(
            "byte_size > 0",
            name="ck_progress_photos_byte_size_pos",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_path", name="uq_progress_photos_storage_path"),
    )
    op.create_index(
        "ix_progress_photos_user_taken_at",
        "progress_photos",
        ["user_id", "taken_at"],
        unique=False,
    )

    op.create_table(
        "cbt_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=120), server_default="Phiên chia sẻ mới", nullable=False),
        sa.Column("trigger_mood", sa.String(length=40), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_message_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "trigger_mood IS NULL OR trigger_mood IN ('stress', 'craving', 'fatigue', 'anxiety', 'neutral')",
            name="ck_cbt_sessions_trigger_mood",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_cbt_sessions_user_last_msg",
        "cbt_sessions",
        ["user_id", "last_message_at"],
        unique=False,
    )

    op.create_table(
        "cbt_messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content_ciphertext", sa.LargeBinary(), nullable=False),
        sa.Column("key_version", sa.SmallInteger(), server_default="1", nullable=False),
        sa.Column(
            "suggested_actions",
            JSONB().with_variant(sa.JSON(), "sqlite"),
            server_default=sa.text("'[]'"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="ck_cbt_messages_role",
        ),
        sa.CheckConstraint(
            "key_version >= 1",
            name="ck_cbt_messages_key_version_pos",
        ),
        sa.ForeignKeyConstraint(["session_id"], ["cbt_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_cbt_messages_user_created_at",
        "cbt_messages",
        ["user_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_cbt_messages_session_created_at",
        "cbt_messages",
        ["session_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_cbt_messages_created_at",
        "cbt_messages",
        ["created_at"],
        unique=False,
    )

    if bind.dialect.name == "postgresql":
        for stmt in harden_public_tables_sql(HARDENED_PUBLIC_TABLES):
            op.execute(stmt)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        for stmt in disable_rls_sql(HARDENED_PUBLIC_TABLES):
            op.execute(stmt)

    op.drop_index("ix_cbt_messages_created_at", table_name="cbt_messages")
    op.drop_index("ix_cbt_messages_session_created_at", table_name="cbt_messages")
    op.drop_index("ix_cbt_messages_user_created_at", table_name="cbt_messages")
    op.drop_table("cbt_messages")

    op.drop_index("ix_cbt_sessions_user_last_msg", table_name="cbt_sessions")
    op.drop_table("cbt_sessions")

    op.drop_index("ix_progress_photos_user_taken_at", table_name="progress_photos")
    op.drop_table("progress_photos")

    op.drop_index("ix_body_measurements_user_measured_at", table_name="body_measurements")
    op.drop_table("body_measurements")
