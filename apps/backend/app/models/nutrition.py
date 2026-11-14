from datetime import date, datetime
from typing import List, Optional

import sqlalchemy as sa
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FoodItem(Base):
    __tablename__ = "food_items"
    __table_args__ = (
        CheckConstraint(
            "source IN ('curated', 'user', 'usda', 'openfoodfacts')",
            name="ck_food_items_source",
        ),
        CheckConstraint("calories_per_100g >= 0", name="ck_food_items_calories_nonneg"),
        CheckConstraint("protein_g_100g >= 0", name="ck_food_items_protein_nonneg"),
        CheckConstraint("carbs_g_100g >= 0", name="ck_food_items_carbs_nonneg"),
        CheckConstraint("fat_g_100g >= 0", name="ck_food_items_fat_nonneg"),
        Index(
            "uq_food_items_global_canonical",
            "canonical_name",
            unique=True,
            postgresql_where=sa.text("owner_user_id IS NULL AND is_active = true"),
            sqlite_where=sa.text("owner_user_id IS NULL AND is_active = 1"),
        ),
        Index(
            "uq_food_items_user_canonical",
            "owner_user_id",
            "canonical_name",
            unique=True,
            postgresql_where=sa.text("owner_user_id IS NOT NULL AND is_active = true"),
            sqlite_where=sa.text("owner_user_id IS NOT NULL AND is_active = 1"),
        ),
        Index(
            "uq_food_items_global_barcode",
            "barcode",
            unique=True,
            postgresql_where=sa.text("barcode IS NOT NULL AND owner_user_id IS NULL"),
            sqlite_where=sa.text("barcode IS NOT NULL AND owner_user_id IS NULL"),
        ),
        Index("ix_food_items_owner_active", "owner_user_id", "is_active"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    owner_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    canonical_name: Mapped[str] = mapped_column(String(200), nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    barcode: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="curated", server_default="curated"
    )
    default_serving_g: Mapped[float] = mapped_column(
        Float, nullable=False, default=100.0, server_default="100.0"
    )
    calories_per_100g: Mapped[int] = mapped_column(Integer, nullable=False)
    protein_g_100g: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0.0"
    )
    carbs_g_100g: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0.0"
    )
    fat_g_100g: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0.0"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=sa.true()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    owner: Mapped[Optional["User"]] = relationship("User", back_populates="custom_food_items")
    meal_logs: Mapped[List["MealLog"]] = relationship("MealLog", back_populates="food_item")


class MealLog(Base):
    __tablename__ = "meal_logs"
    __table_args__ = (
        CheckConstraint(
            "meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')",
            name="ck_meal_logs_meal_type",
        ),
        CheckConstraint("serving_grams > 0", name="ck_meal_logs_serving_pos"),
        CheckConstraint("calories >= 0", name="ck_meal_logs_calories_nonneg"),
        CheckConstraint("protein_g >= 0", name="ck_meal_logs_protein_nonneg"),
        CheckConstraint("carbs_g >= 0", name="ck_meal_logs_carbs_nonneg"),
        CheckConstraint("fat_g >= 0", name="ck_meal_logs_fat_nonneg"),
        Index("ix_meal_logs_user_logged_at", "user_id", "logged_at"),
        Index("ix_meal_logs_user_local_date", "user_id", "local_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    food_item_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True
    )
    meal_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="lunch", server_default="lunch"
    )
    food_name_snapshot: Mapped[str] = mapped_column(String(150), nullable=False)
    serving_grams: Mapped[float] = mapped_column(Float, nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False)
    protein_g: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0.0"
    )
    carbs_g: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0.0"
    )
    fat_g: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0.0"
    )
    local_date: Mapped[date] = mapped_column(Date, nullable=False)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="meal_logs")
    food_item: Mapped[Optional["FoodItem"]] = relationship(
        "FoodItem", back_populates="meal_logs"
    )
