from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas._common import ensure_tz_aware

FastingProtocol = Literal["14:10", "16:8", "18:6", "20:4"]


class DailyMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    calories_consumed: int
    calories_burned: int
    water_intake_ml: int
    fasting_minutes: int
    fasting_state: str
    fasting_started_at: Optional[datetime] = None
    fasting_protocol: str
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
    fasting_started_at: Optional[datetime] = None
    fasting_protocol: Optional[FastingProtocol] = None

    @field_validator("fasting_started_at")
    @classmethod
    def _ensure_tz_aware(cls, value: Optional[datetime]) -> Optional[datetime]:
        return ensure_tz_aware(value)


class HabitToggleRequest(BaseModel):
    habit_key: str = Field(..., pattern=r"^[a-z][a-z0-9_]{1,49}$", description="e.g. morning_stretch, water, workout")


class TodaySummaryDay(BaseModel):
    date: date
    calories_consumed: int
    calories_burned: int
    water_intake_ml: int
    habits_count: int
    fasting_state: str
    active: bool


class TodaySummaryResponse(BaseModel):
    today: DailyMetricResponse
    streak_days: int
    best_streak_days: int
    history_7d: List[TodaySummaryDay]
