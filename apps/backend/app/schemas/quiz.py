from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator



class QuizSubmitRequest(BaseModel):
    session_id: str = Field(..., min_length=8, max_length=100, description="Client generated UUID session")
    archetype: Optional[Literal["female_pilates", "male_strength"]] = None
    gender: Literal["female", "male"] = "female"
    age: Optional[int] = Field(None, ge=13, le=100)
    age_group: Optional[Literal["18-29", "30-39", "40-49", "50+"]] = None
    height_cm: float = Field(..., ge=100.0, le=250.0)
    current_weight_kg: float = Field(..., ge=30.0, le=250.0)
    target_weight_kg: float = Field(..., ge=30.0, le=250.0)
    activity_level: Optional[Literal["sedentary", "lightly_active", "moderately_active", "very_active"]] = None
    primary_goal: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-z_]+$")
    focus_areas: List[str] = Field(default_factory=list, max_length=10)
    obstacles: List[str] = Field(default_factory=list, max_length=15)
    fitness_level: str = Field("beginner", max_length=30)

    @model_validator(mode="after")
    def _age_required(self) -> "QuizSubmitRequest":
        if self.age is None and self.age_group is None:
            raise ValueError("Either age or age_group is required")
        for tag in [*self.focus_areas, *self.obstacles]:
            if not (1 <= len(tag) <= 50) or not tag.replace("_", "").isalnum():
                raise ValueError(f"Invalid tag: {tag!r}")
        return self


class PersonalizedPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assessment_id: int
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


class QuizAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    age: Optional[int]
    age_group: str
    gender: str
    height_cm: float
    current_weight_kg: float
    target_weight_kg: float
    activity_level: Optional[str]
    primary_goal: str
    focus_areas: List[str]
    obstacles: List[str]
    fitness_level: str
    created_at: datetime
    plan: Optional[PersonalizedPlanResponse] = None
