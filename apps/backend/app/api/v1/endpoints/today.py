import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import DailyMetric, User, PersonalizedPlan
from app.schemas.daily_metric import (
    DailyMetricResponse,
    WaterUpdateRequest,
    FastingUpdateRequest,
    HabitToggleRequest
)

router = APIRouter(prefix="/today", tags=["Today Dashboard"])

@router.get("/{user_id}", response_model=DailyMetricResponse)
async def get_today_metric(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves or lazily initializes today's biometric and habit tracking metric for the specified user.
    """
    today = datetime.date.today()
    stmt = select(DailyMetric).where(DailyMetric.user_id == user_id, DailyMetric.date == today)
    result = await db.execute(stmt)
    metric = result.scalar_one_or_none()

    if not metric:
        # Check if user exists
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Initialize fresh metric for today
        metric = DailyMetric(
            user_id=user_id,
            date=today,
            calories_consumed=0,
            calories_burned=0,
            water_intake_ml=0,
            fasting_minutes=0,
            fasting_state="idle",
            habits_completed=[],
        )
        db.add(metric)
        await db.commit()
        await db.refresh(metric)

    return metric

@router.post("/water", response_model=DailyMetricResponse)
async def update_water(
    payload: WaterUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Increments or adjusts today's water intake in ml (+250ml per cup).
    """
    today = datetime.date.today()
    stmt = select(DailyMetric).where(DailyMetric.user_id == payload.user_id, DailyMetric.date == today)
    result = await db.execute(stmt)
    metric = result.scalar_one_or_none()

    if not metric:
        metric = DailyMetric(
            user_id=payload.user_id,
            date=today,
            water_intake_ml=max(0, payload.amount_ml),
        )
        db.add(metric)
    else:
        metric.water_intake_ml = max(0, metric.water_intake_ml + payload.amount_ml)

    await db.commit()
    await db.refresh(metric)
    return metric

@router.post("/fasting", response_model=DailyMetricResponse)
async def update_fasting(
    payload: FastingUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Updates 16:8 intermittent fasting state and duration in minutes.
    """
    today = datetime.date.today()
    stmt = select(DailyMetric).where(DailyMetric.user_id == payload.user_id, DailyMetric.date == today)
    result = await db.execute(stmt)
    metric = result.scalar_one_or_none()

    if not metric:
        metric = DailyMetric(
            user_id=payload.user_id,
            date=today,
            fasting_state=payload.fasting_state,
            fasting_minutes=payload.fasting_minutes or 0,
        )
        db.add(metric)
    else:
        metric.fasting_state = payload.fasting_state
        if payload.fasting_minutes is not None:
            metric.fasting_minutes = payload.fasting_minutes

    await db.commit()
    await db.refresh(metric)
    return metric

@router.post("/habits/toggle", response_model=DailyMetricResponse)
async def toggle_habit(
    payload: HabitToggleRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Toggles completion of a daily wellness habit.
    """
    today = datetime.date.today()
    stmt = select(DailyMetric).where(DailyMetric.user_id == payload.user_id, DailyMetric.date == today)
    result = await db.execute(stmt)
    metric = result.scalar_one_or_none()

    if not metric:
        metric = DailyMetric(
            user_id=payload.user_id,
            date=today,
            habits_completed=[payload.habit_key],
        )
        db.add(metric)
    else:
        current_habits = list(metric.habits_completed or [])
        if payload.habit_key in current_habits:
            current_habits.remove(payload.habit_key)
        else:
            current_habits.append(payload.habit_key)
        metric.habits_completed = current_habits

    await db.commit()
    await db.refresh(metric)
    return metric
