from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Float, Integer, Boolean, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class QuizAssessment(Base):
    __tablename__ = "quiz_assessments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    
    # Demographic & Biometrics (Software calculated, zero hardware required)
    age_group: Mapped[str] = mapped_column(String(20), nullable=False)  # "18-29", "30-39", "40-49", "50+"
    gender: Mapped[str] = mapped_column(String(20), default="female")
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    current_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    target_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Goals & Focus
    primary_goal: Mapped[str] = mapped_column(String(50), nullable=False)
    focus_areas: Mapped[List[str]] = mapped_column(JSON, default=list)  # e.g. ["core", "glutes", "legs"]
    obstacles: Mapped[List[str]] = mapped_column(JSON, default=list)    # e.g. ["lack_time", "joint_pain"]
    fitness_level: Mapped[str] = mapped_column(String(30), default="beginner")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="quiz_assessments")
    plan: Mapped[Optional["PersonalizedPlan"]] = relationship("PersonalizedPlan", back_populates="assessment", uselist=False, cascade="all, delete-orphan")


class PersonalizedPlan(Base):
    __tablename__ = "personalized_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("quiz_assessments.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Biometric Projections & Nutritional Targets
    bmi: Mapped[float] = mapped_column(Float, nullable=False)
    bmr: Mapped[float] = mapped_column(Float, nullable=False)  # Mifflin-St Jeor formula
    tdee: Mapped[float] = mapped_column(Float, nullable=False)
    daily_calorie_target: Mapped[int] = mapped_column(Integer, nullable=False)
    daily_water_target_ml: Mapped[int] = mapped_column(Integer, default=2500)
    
    # 28-day timeline
    estimated_duration_weeks: Mapped[int] = mapped_column(Integer, default=4)
    projected_weight_milestones: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    focus_routine: Mapped[str] = mapped_column(String(100), default="Pilates Core & Pelvic Alignment")
    recommended_diet_type: Mapped[str] = mapped_column(String(100), default="Balanced Clean Whole Foods")
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    assessment: Mapped["QuizAssessment"] = relationship("QuizAssessment", back_populates="plan")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="plans")
