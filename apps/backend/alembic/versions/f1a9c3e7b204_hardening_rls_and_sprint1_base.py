"""hardening rls and sprint1 base

Revision ID: f1a9c3e7b204
Revises: 8d4b2f6e1a73
Create Date: 2026-11-12 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from app.services.rls import disable_rls_sql, harden_public_tables_sql

# revision identifiers, used by Alembic.
revision: str = "f1a9c3e7b204"
down_revision: Union[str, Sequence[str], None] = "8d4b2f6e1a73"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

HARDENED_PUBLIC_TABLES: tuple[str, ...] = (
    "users",
    "quiz_assessments",
    "personalized_plans",
    "exercises",
    "workout_routines",
    "workout_logs",
    "daily_metrics",
    "products",
    "orders",
    "auth_throttles",
    "alembic_version",
)

_FK_NAMING_CONVENTION = {
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
}


def _replace_user_fk(table_name: str, ondelete: str, extra_ops=None) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    fk_names = [
        fk["name"] or f"fk_{table_name}_user_id_users"
        for fk in inspector.get_foreign_keys(table_name)
        if fk.get("referred_table") == "users" and fk.get("constrained_columns") == ["user_id"]
    ]
    with op.batch_alter_table(table_name, schema=None, naming_convention=_FK_NAMING_CONVENTION) as batch_op:
        for fk_name in fk_names:
            batch_op.drop_constraint(fk_name, type_="foreignkey")
        batch_op.create_foreign_key(
            f"fk_{table_name}_user_id_users",
            "users",
            ["user_id"],
            ["id"],
            ondelete=ondelete,
        )
        if extra_ops is not None:
            extra_ops(batch_op)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("timezone", sa.String(length=64), server_default="Asia/Ho_Chi_Minh", nullable=False)
        )

    with op.batch_alter_table("daily_metrics", schema=None) as batch_op:
        batch_op.add_column(sa.Column("fasting_started_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(
            sa.Column("fasting_protocol", sa.String(length=16), server_default="16:8", nullable=False)
        )
        batch_op.create_check_constraint(
            "ck_daily_metrics_fasting_protocol",
            "fasting_protocol IN ('14:10', '16:8', '18:6', '20:4')",
        )
        if bind.dialect.name == "postgresql":
            batch_op.alter_column(
                "habits_completed",
                existing_type=sa.JSON(),
                type_=postgresql.JSONB(astext_type=sa.Text()),
                existing_nullable=False,
                postgresql_using="habits_completed::jsonb",
            )

    _replace_user_fk("quiz_assessments", "CASCADE")
    _replace_user_fk(
        "personalized_plans",
        "CASCADE",
        extra_ops=lambda batch_op: batch_op.create_index(
            "ix_personalized_plans_user_active_created",
            ["user_id", "is_active", "created_at"],
            unique=False,
        ),
    )

    with op.batch_alter_table("workout_logs", schema=None) as batch_op:
        batch_op.create_index("ix_workout_logs_user_completed", ["user_id", "completed_at"], unique=False)

    if bind.dialect.name == "postgresql":
        for stmt in harden_public_tables_sql(HARDENED_PUBLIC_TABLES):
            op.execute(stmt)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        for stmt in disable_rls_sql(HARDENED_PUBLIC_TABLES):
            op.execute(stmt)

    with op.batch_alter_table("workout_logs", schema=None) as batch_op:
        batch_op.drop_index("ix_workout_logs_user_completed")

    _replace_user_fk(
        "personalized_plans",
        "SET NULL",
        extra_ops=lambda batch_op: batch_op.drop_index("ix_personalized_plans_user_active_created"),
    )
    _replace_user_fk("quiz_assessments", "SET NULL")

    with op.batch_alter_table("daily_metrics", schema=None) as batch_op:
        if bind.dialect.name == "postgresql":
            batch_op.alter_column(
                "habits_completed",
                existing_type=postgresql.JSONB(astext_type=sa.Text()),
                type_=sa.JSON(),
                existing_nullable=False,
                postgresql_using="habits_completed::json",
            )
        batch_op.drop_constraint("ck_daily_metrics_fasting_protocol", type_="check")
        batch_op.drop_column("fasting_protocol")
        batch_op.drop_column("fasting_started_at")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("timezone")
