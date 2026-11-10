from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="Pilates")  # "Pilates", "Mobility", "Strength", "Core"
    primary_muscle: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), default="beginner")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    instructions: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    # AI PT Pose Detection & MediaPipe landmark configurations
    landmark_joints: Mapped[List[int]] = mapped_column(JSON, default=list)  # e.g., [11, 23, 25] hip-knee-ankle
    target_angle_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # e.g., 75.0
    target_angle_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # e.g., 95.0
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WorkoutRoutine(Base):
    __tablename__ = "workout_routines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, default=15)
    calorie_burn_est: Mapped[int] = mapped_column(Integer, default=120)
    intensity: Mapped[str] = mapped_column(String(30), default="Low-Impact")  # "Low-Impact", "Moderate", "Dynamic"
    
    # Array of {exercise_code: str, reps: int, duration_sec: int, rest_sec: int}
    exercises_sequence: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    logs: Mapped[List["WorkoutLog"]] = relationship("WorkoutLog", back_populates="routine")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    routine_id: Mapped[Optional[int]] = mapped_column(ForeignKey("workout_routines.id", ondelete="SET NULL"), nullable=True)
    
    duration_sec: Mapped[int] = mapped_column(Integer, default=0)
    calories_burned: Mapped[int] = mapped_column(Integer, default=0)
    reps_completed: Mapped[int] = mapped_column(Integer, default=0)
    # 0-100 pose score measured in the browser; NULL when the session ran without the camera.
    form_accuracy_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="workout_logs")
    routine: Mapped[Optional["WorkoutRoutine"]] = relationship("WorkoutRoutine", back_populates="logs")
