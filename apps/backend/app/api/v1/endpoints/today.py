from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.daily_metric import (
    CaloriesUpdateRequest,
    DailyMetricResponse,
    FastingUpdateRequest,
    HabitToggleRequest,
    TodaySummaryResponse,
    WaterUpdateRequest,
)
from app.services import daily_metrics

router = APIRouter(prefix="/today", tags=["Today Dashboard"])


@router.get("", response_model=DailyMetricResponse)
async def get_today(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Today's metrics for the signed-in user, created on first access."""
    return await daily_metrics.get_today_view(db, user.id, user.timezone)


@router.post("/water", response_model=DailyMetricResponse)
async def update_water(
    payload: WaterUpdateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    return await daily_metrics.add_water(db, user.id, user.timezone, amount_ml=payload.amount_ml)


@router.post("/calories", response_model=DailyMetricResponse)
async def update_calories(
    payload: CaloriesUpdateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    return await daily_metrics.add_calories_consumed(
        db, user.id, user.timezone, amount_kcal=payload.amount_kcal
    )


@router.post("/fasting", response_model=DailyMetricResponse)
async def update_fasting(
    payload: FastingUpdateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    return await daily_metrics.update_fasting(
        db,
        user.id,
        user.timezone,
        fasting_state=payload.fasting_state,
        fasting_minutes=payload.fasting_minutes,
        fasting_protocol=payload.fasting_protocol,
        fasting_started_at=payload.fasting_started_at,
        has_fasting_started_at="fasting_started_at" in payload.model_fields_set,
    )


@router.get("/summary", response_model=TodaySummaryResponse)
async def get_today_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return today's metrics, streak counters, and 7-day activity history."""
    return await daily_metrics.get_today_summary(db, user.id, user.timezone)


@router.post("/habits/toggle", response_model=DailyMetricResponse)
async def toggle_habit(
    payload: HabitToggleRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    return await daily_metrics.toggle_habit(db, user.id, user.timezone, habit_key=payload.habit_key)
