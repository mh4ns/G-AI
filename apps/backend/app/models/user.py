from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    timezone: Mapped[str] = mapped_column(
        String(64), nullable=False, default="Asia/Ho_Chi_Minh", server_default="Asia/Ho_Chi_Minh"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    # Embedded in every JWT ("tv"). Bumping it revokes all tokens issued before (logout, password change).
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    quiz_assessments: Mapped[List["QuizAssessment"]] = relationship("QuizAssessment", back_populates="user", cascade="all, delete-orphan")
    plans: Mapped[List["PersonalizedPlan"]] = relationship("PersonalizedPlan", back_populates="user", cascade="all, delete-orphan")
    daily_metrics: Mapped[List["DailyMetric"]] = relationship("DailyMetric", back_populates="user", cascade="all, delete-orphan")
    workout_logs: Mapped[List["WorkoutLog"]] = relationship("WorkoutLog", back_populates="user", cascade="all, delete-orphan")
    custom_food_items: Mapped[List["FoodItem"]] = relationship("FoodItem", back_populates="owner", cascade="all, delete-orphan")
    meal_logs: Mapped[List["MealLog"]] = relationship("MealLog", back_populates="user", cascade="all, delete-orphan")
    body_measurements: Mapped[List["BodyMeasurement"]] = relationship("BodyMeasurement", back_populates="user", cascade="all, delete-orphan")
    progress_photos: Mapped[List["ProgressPhoto"]] = relationship("ProgressPhoto", back_populates="user", cascade="all, delete-orphan")
    cbt_sessions: Mapped[List["CbtSession"]] = relationship("CbtSession", back_populates="user", cascade="all, delete-orphan")
    cbt_messages: Mapped[List["CbtMessage"]] = relationship("CbtMessage", back_populates="user", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user")
