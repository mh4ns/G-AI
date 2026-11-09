from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class DailyMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
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


class WaterUpdateRequest(BaseModel):
    amount_ml: int = Field(250, ge=-2000, le=2000, description="Amount in ml to add (negative to undo)")


class CaloriesUpdateRequest(BaseModel):
    amount_kcal: int = Field(..., ge=-5000, le=5000, description="Calories eaten to add (negative to undo)")


class FastingUpdateRequest(BaseModel):
    fasting_state: Literal["idle", "fasting", "eating_window"]
    fasting_minutes: Optional[int] = Field(None, ge=0, le=24 * 60)


class HabitToggleRequest(BaseModel):
    habit_key: str = Field(..., pattern=r"^[a-z][a-z0-9_]{1,49}$", description="e.g. morning_stretch, water, workout")
