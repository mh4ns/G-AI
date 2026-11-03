from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ExerciseResponse(BaseModel):
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

    class Config:
        from_attributes = True

class WorkoutRoutineResponse(BaseModel):
    id: int
    slug: str
    title: str
    duration_min: int
    calorie_burn_est: int
    intensity: str
    exercises_sequence: List[Dict[str, Any]]
    is_featured: bool

    class Config:
        from_attributes = True

class WorkoutLogCreate(BaseModel):
    routine_id: Optional[int] = None
    duration_sec: int
    calories_burned: int
    reps_completed: int
    form_accuracy_pct: float

class WorkoutLogResponse(BaseModel):
    id: int
    user_id: int
    routine_id: Optional[int]
    duration_sec: int
    calories_burned: int
    reps_completed: int
    form_accuracy_pct: float
    completed_at: datetime

    class Config:
        from_attributes = True
