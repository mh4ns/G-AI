from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    category: str
    primary_muscle: str
    difficulty: str
    description: str
    instructions: List[str]
    landmark_joints: List[int]
    target_angle_min: Optional[float]
    target_angle_max: Optional[float]
    thumbnail_url: Optional[str]


class WorkoutRoutineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    duration_min: int
    calorie_burn_est: int
    intensity: str
    exercises_sequence: List[Dict[str, Any]]
    is_featured: bool


class WorkoutLogCreate(BaseModel):
    routine_id: Optional[int] = None
    duration_sec: int = Field(..., ge=1, le=6 * 60 * 60)
    calories_burned: int = Field(..., ge=0, le=5000)
    reps_completed: int = Field(0, ge=0, le=10000)
    # Measured in the browser with MediaPipe Pose; null when the session ran without the camera.
    form_accuracy_pct: Optional[float] = Field(None, ge=0.0, le=100.0)


class WorkoutLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    routine_id: Optional[int]
    duration_sec: int
    calories_burned: int
    reps_completed: int
    form_accuracy_pct: Optional[float]
    completed_at: datetime
