import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models import DailyMetric, User
from app.schemas.daily_metric import (
    CaloriesUpdateRequest,
    DailyMetricResponse,
    FastingUpdateRequest,
    HabitToggleRequest,
    WaterUpdateRequest,
)

router = APIRouter(prefix="/today", tags=["Today Dashboard"])

MAX_HABITS_PER_DAY = 30


def local_today() -> datetime.date:
    return datetime.datetime.now(ZoneInfo(settings.DEFAULT_TIMEZONE)).date()


async def get_or_create_today(db: AsyncSession, user_id: int) -> DailyMetric:
    today = local_today()
    stmt = select(DailyMetric).where(DailyMetric.user_id == user_id, DailyMetric.date == today)
    metric = await db.scalar(stmt)
    if metric is not None:
        return metric

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
    try:
        # Savepoint: losing the race for the unique (user_id, date) row must not
        # discard other pending changes in the caller's transaction.
        async with db.begin_nested():
            db.add(metric)
    except IntegrityError:
        metric = await db.scalar(stmt)
    return metric


async def _save(db: AsyncSession, metric: DailyMetric) -> DailyMetric:
    await db.commit()
    await db.refresh(metric)
    return metric


@router.get("", response_model=DailyMetricResponse)
async def get_today(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Today's metrics for the signed-in user, created on first access."""
    return await _save(db, await get_or_create_today(db, user.id))


@router.post("/water", response_model=DailyMetricResponse)
async def update_water(
    payload: WaterUpdateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    metric = await get_or_create_today(db, user.id)
    metric.water_intake_ml = min(20_000, max(0, (metric.water_intake_ml or 0) + payload.amount_ml))
    return await _save(db, metric)


@router.post("/calories", response_model=DailyMetricResponse)
async def update_calories(
    payload: CaloriesUpdateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    metric = await get_or_create_today(db, user.id)
    metric.calories_consumed = min(20_000, max(0, (metric.calories_consumed or 0) + payload.amount_kcal))
    return await _save(db, metric)


@router.post("/fasting", response_model=DailyMetricResponse)
async def update_fasting(
    payload: FastingUpdateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    metric = await get_or_create_today(db, user.id)
    metric.fasting_state = payload.fasting_state
    if payload.fasting_minutes is not None:
        metric.fasting_minutes = payload.fasting_minutes
    return await _save(db, metric)


@router.post("/habits/toggle", response_model=DailyMetricResponse)
async def toggle_habit(
    payload: HabitToggleRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    metric = await get_or_create_today(db, user.id)
    habits = list(metric.habits_completed or [])
    if payload.habit_key in habits:
        habits.remove(payload.habit_key)
    elif len(habits) < MAX_HABITS_PER_DAY:
        habits.append(payload.habit_key)
    metric.habits_completed = habits
    return await _save(db, metric)
