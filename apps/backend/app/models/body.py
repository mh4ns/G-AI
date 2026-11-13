from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BodyMeasurement(Base):
    __tablename__ = "body_measurements"
    __table_args__ = (
        CheckConstraint(
            "weight_kg > 20 AND weight_kg < 400",
            name="ck_body_measurements_weight_range",
        ),
        CheckConstraint(
            "neck_cm IS NULL OR neck_cm > 0",
            name="ck_body_measurements_neck_pos",
        ),
        CheckConstraint(
            "waist_cm IS NULL OR waist_cm > 0",
            name="ck_body_measurements_waist_pos",
        ),
        CheckConstraint(
            "hip_cm IS NULL OR hip_cm > 0",
            name="ck_body_measurements_hip_pos",
        ),
        CheckConstraint(
            "body_fat_pct IS NULL OR (body_fat_pct >= 2 AND body_fat_pct <= 75)",
            name="ck_body_measurements_body_fat_range",
        ),
        CheckConstraint(
            "body_fat_category IS NULL OR body_fat_category IN ('essential', 'athlete', 'fitness', 'average', 'obese')",
            name="ck_body_measurements_body_fat_category",
        ),
        Index("ix_body_measurements_user_measured_at", "user_id", "measured_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    neck_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    waist_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hip_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    body_fat_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    body_fat_category: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    local_date: Mapped[date] = mapped_column(Date, nullable=False)
    measured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="body_measurements")


class ProgressPhoto(Base):
    __tablename__ = "progress_photos"
    __table_args__ = (
        CheckConstraint(
            "angle IN ('front', 'side', 'back')",
            name="ck_progress_photos_angle",
        ),
        CheckConstraint(
            "mime_type IN ('image/webp', 'image/jpeg', 'image/png')",
            name="ck_progress_photos_mime_type",
        ),
        CheckConstraint(
            "byte_size > 0",
            name="ck_progress_photos_byte_size_pos",
        ),
        UniqueConstraint("storage_path", name="uq_progress_photos_storage_path"),
        Index("ix_progress_photos_user_taken_at", "user_id", "taken_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    angle: Mapped[str] = mapped_column(String(20), nullable=False)
    storage_bucket: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="progress-photos",
        server_default="progress-photos",
    )
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    local_date: Mapped[date] = mapped_column(Date, nullable=False)
    taken_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="progress_photos")
