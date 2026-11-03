from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class DailyMetricResponse(BaseModel):
    id: int
    user_id: int
    date: date
    calories_consumed: int
    calories_burned: int
    water_intake_ml: int
    fasting_minutes: int
    fasting_state: str
    habits_completed: List[str]
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WaterUpdateRequest(BaseModel):
    user_id: int
    amount_ml: int = Field(250, description="Amount in ml to add (e.g. 250ml or -250ml)")

class FastingUpdateRequest(BaseModel):
    user_id: int
    fasting_state: str = Field(..., pattern="^(idle|fasting|eating_window)$")
    fasting_minutes: Optional[int] = None

class HabitToggleRequest(BaseModel):
    user_id: int
    habit_key: str = Field(..., description="e.g. morning_stretch, posture_check, water_goal")
