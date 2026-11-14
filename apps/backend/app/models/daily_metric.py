from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class DailyMetric(Base):
    __tablename__ = "daily_metrics"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_daily_metric_date"),
        CheckConstraint("fasting_protocol IN ('14:10', '16:8', '18:6', '20:4')", name="ck_daily_metrics_fasting_protocol"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Nutrition & Energy Balance
    calories_consumed: Mapped[int] = mapped_column(Integer, default=0)
    calories_burned: Mapped[int] = mapped_column(Integer, default=0)
    
    # Hydration
    water_intake_ml: Mapped[int] = mapped_column(Integer, default=0)

    # Intermittent Fasting
    fasting_minutes: Mapped[int] = mapped_column(Integer, default=0)
    fasting_state: Mapped[str] = mapped_column(String(30), default="idle")  # "idle", "fasting", "eating_window"
    fasting_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fasting_protocol: Mapped[str] = mapped_column(String(16), nullable=False, default="16:8", server_default="16:8")

    # Habit Tracking Checklist (e.g. ["morning_stretch", "vitamins", "no_sugar_after_8pm"])
    habits_completed: Mapped[List[str]] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), default=list)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="daily_metrics")
