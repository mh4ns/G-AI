from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class QuizSubmitRequest(BaseModel):
    session_id: str = Field(..., description="Client generated UUID session")
    user_id: Optional[int] = None
    age_group: str = Field(..., pattern="^(18-29|30-39|40-49|50\\+)$")
    gender: str = Field("female")
    height_cm: float = Field(..., ge=100.0, le=250.0)
    current_weight_kg: float = Field(..., ge=30.0, le=250.0)
    target_weight_kg: float = Field(..., ge=30.0, le=250.0)
    primary_goal: str = Field(..., description="weight_loss, muscle_tone, posture_correction, etc.")
    focus_areas: List[str] = Field(default_factory=list)
    obstacles: List[str] = Field(default_factory=list)
    fitness_level: str = Field("beginner")

class PersonalizedPlanResponse(BaseModel):
    id: int
    assessment_id: int
    user_id: Optional[int]
    bmi: float
    bmr: float
    tdee: float
    daily_calorie_target: int
    daily_water_target_ml: int
    estimated_duration_weeks: int
    projected_weight_milestones: List[Dict[str, Any]]
    focus_routine: str
    recommended_diet_type: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class QuizAssessmentResponse(BaseModel):
    id: int
    session_id: str
    user_id: Optional[int]
    age_group: str
    gender: str
    height_cm: float
    current_weight_kg: float
    target_weight_kg: float
    primary_goal: str
    focus_areas: List[str]
    obstacles: List[str]
    fitness_level: str
    created_at: datetime
    plan: Optional[PersonalizedPlanResponse] = None

    class Config:
        from_attributes = True
