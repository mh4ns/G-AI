"""nutrition food_items and meal_logs

Revision ID: b4d8e2a19c37
Revises: f1a9c3e7b204
Create Date: 2026-11-12 22:48:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.services.rls import disable_rls_sql, harden_public_tables_sql

# revision identifiers, used by Alembic.
revision: str = "b4d8e2a19c37"
down_revision: Union[str, Sequence[str], None] = "f1a9c3e7b204"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

HARDENED_PUBLIC_TABLES: tuple[str, ...] = (
    "food_items",
    "meal_logs",
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    op.create_table(
        "food_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("owner_user_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("canonical_name", sa.String(length=200), nullable=False),
        sa.Column("brand", sa.String(length=100), nullable=True),
        sa.Column("barcode", sa.String(length=64), nullable=True),
        sa.Column("source", sa.String(length=30), server_default="curated", nullable=False),
        sa.Column("default_serving_g", sa.Float(), server_default="100.0", nullable=False),
        sa.Column("calories_per_100g", sa.Integer(), nullable=False),
        sa.Column("protein_g_100g", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("carbs_g_100g", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("fat_g_100g", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "source IN ('curated', 'user', 'usda', 'openfoodfacts')",
            name="ck_food_items_source",
        ),
        sa.CheckConstraint("calories_per_100g >= 0", name="ck_food_items_calories_nonneg"),
        sa.CheckConstraint("protein_g_100g >= 0", name="ck_food_items_protein_nonneg"),
        sa.CheckConstraint("carbs_g_100g >= 0", name="ck_food_items_carbs_nonneg"),
        sa.CheckConstraint("fat_g_100g >= 0", name="ck_food_items_fat_nonneg"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_food_items_global_canonical",
        "food_items",
        ["canonical_name"],
        unique=True,
        postgresql_where=sa.text("owner_user_id IS NULL AND is_active = true"),
        sqlite_where=sa.text("owner_user_id IS NULL AND is_active = 1"),
    )
    op.create_index(
        "uq_food_items_user_canonical",
        "food_items",
        ["owner_user_id", "canonical_name"],
        unique=True,
        postgresql_where=sa.text("owner_user_id IS NOT NULL AND is_active = true"),
        sqlite_where=sa.text("owner_user_id IS NOT NULL AND is_active = 1"),
    )
    op.create_index(
        "uq_food_items_global_barcode",
        "food_items",
        ["barcode"],
        unique=True,
        postgresql_where=sa.text("barcode IS NOT NULL AND owner_user_id IS NULL"),
        sqlite_where=sa.text("barcode IS NOT NULL AND owner_user_id IS NULL"),
    )
    op.create_index("ix_food_items_owner_active", "food_items", ["owner_user_id", "is_active"], unique=False)

    op.create_table(
        "meal_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("food_item_id", sa.Integer(), nullable=True),
        sa.Column("meal_type", sa.String(length=20), server_default="lunch", nullable=False),
        sa.Column("food_name_snapshot", sa.String(length=150), nullable=False),
        sa.Column("serving_grams", sa.Float(), nullable=False),
        sa.Column("calories", sa.Integer(), nullable=False),
        sa.Column("protein_g", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("carbs_g", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("fat_g", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("local_date", sa.Date(), nullable=False),
        sa.Column("logged_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')",
            name="ck_meal_logs_meal_type",
        ),
        sa.CheckConstraint("serving_grams > 0", name="ck_meal_logs_serving_pos"),
        sa.CheckConstraint("calories >= 0", name="ck_meal_logs_calories_nonneg"),
        sa.CheckConstraint("protein_g >= 0", name="ck_meal_logs_protein_nonneg"),
        sa.CheckConstraint("carbs_g >= 0", name="ck_meal_logs_carbs_nonneg"),
        sa.CheckConstraint("fat_g >= 0", name="ck_meal_logs_fat_nonneg"),
        sa.ForeignKeyConstraint(["food_item_id"], ["food_items.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meal_logs_user_logged_at", "meal_logs", ["user_id", "logged_at"], unique=False)
    op.create_index("ix_meal_logs_user_local_date", "meal_logs", ["user_id", "local_date"], unique=False)

    if bind.dialect.name == "postgresql":
        for stmt in harden_public_tables_sql(HARDENED_PUBLIC_TABLES):
            op.execute(stmt)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        for stmt in disable_rls_sql(HARDENED_PUBLIC_TABLES):
            op.execute(stmt)

    op.drop_index("ix_meal_logs_user_local_date", table_name="meal_logs")
    op.drop_index("ix_meal_logs_user_logged_at", table_name="meal_logs")
    op.drop_table("meal_logs")

    op.drop_index("ix_food_items_owner_active", table_name="food_items")
    op.drop_index("uq_food_items_global_barcode", table_name="food_items")
    op.drop_index("uq_food_items_user_canonical", table_name="food_items")
    op.drop_index("uq_food_items_global_canonical", table_name="food_items")
    op.drop_table("food_items")
