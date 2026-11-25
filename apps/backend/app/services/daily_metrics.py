import datetime
from typing import Any, Callable, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import DailyMetric
from app.schemas.daily_metric import DailyMetricResponse, TodaySummaryDay, TodaySummaryResponse

Clock = Callable[[], datetime.datetime]

MAX_DAILY_CALORIES = 20_000
MAX_DAILY_WATER_ML = 20_000
MAX_HABITS_PER_DAY = 30
MAX_STREAK_HISTORY_DAYS = 3650


def now_utc() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def _resolve_zone(tz_name: Optional[str] = None) -> ZoneInfo:
    tz = tz_name or settings.DEFAULT_TIMEZONE
    try:
        return ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo(settings.DEFAULT_TIMEZONE)


def local_date_for(dt: datetime.datetime, tz_name: Optional[str] = None) -> datetime.date:
    aware = dt if dt.tzinfo is not None else dt.replace(tzinfo=datetime.timezone.utc)
    return aware.astimezone(_resolve_zone(tz_name)).date()


def local_today(tz_name: Optional[str] = None, now_fn: Optional[Clock] = None) -> datetime.date:
    current = (now_fn or now_utc)()
    return local_date_for(current, tz_name)


def clamp_daily_value(current: Optional[int], delta: int, *, maximum: int = MAX_DAILY_CALORIES) -> int:
    return min(maximum, max(0, (current or 0) + delta))


def apply_calories_consumed(metric: DailyMetric, delta_kcal: int) -> DailyMetric:
    metric.calories_consumed = clamp_daily_value(
        metric.calories_consumed, delta_kcal, maximum=MAX_DAILY_CALORIES
    )
    return metric


def apply_calories_burned(metric: DailyMetric, delta_kcal: int) -> DailyMetric:
    metric.calories_burned = clamp_daily_value(
        metric.calories_burned, delta_kcal, maximum=MAX_DAILY_CALORIES
    )
    return metric


def apply_water_intake(metric: DailyMetric, delta_ml: int) -> DailyMetric:
    metric.water_intake_ml = clamp_daily_value(
        metric.water_intake_ml, delta_ml, maximum=MAX_DAILY_WATER_ML
    )
    return metric


async def get_or_create_metric_for_date(
    db: AsyncSession, user_id: int, target_date: datetime.date
) -> DailyMetric:
    stmt = select(DailyMetric).where(DailyMetric.user_id == user_id, DailyMetric.date == target_date)
    metric = await db.scalar(stmt)
    if metric is not None:
        return metric

    metric = DailyMetric(
        user_id=user_id,
        date=target_date,
        calories_consumed=0,
        calories_burned=0,
        water_intake_ml=0,
        fasting_minutes=0,
        fasting_state="idle",
        fasting_protocol="16:8",
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


async def get_or_create_today(
    db: AsyncSession,
    user_id: int,
    tz_name: Optional[str] = None,
    now_fn: Optional[Clock] = None,
) -> DailyMetric:
    return await get_or_create_metric_for_date(db, user_id, local_today(tz_name, now_fn=now_fn))


async def _save(db: AsyncSession, metric: DailyMetric) -> DailyMetric:
    await db.commit()
    await db.refresh(metric)
    return metric


async def add_water(
    db: AsyncSession,
    user_id: int,
    tz_name: Optional[str] = None,
    *,
    amount_ml: int,
    now_fn: Optional[Clock] = None,
) -> DailyMetric:
    metric = await get_or_create_today(db, user_id, tz_name, now_fn=now_fn)
    apply_water_intake(metric, amount_ml)
    return await _save(db, metric)


async def add_calories_consumed(
    db: AsyncSession,
    user_id: int,
    tz_name: Optional[str] = None,
    *,
    amount_kcal: int,
    now_fn: Optional[Clock] = None,
) -> DailyMetric:
    metric = await get_or_create_today(db, user_id, tz_name, now_fn=now_fn)
    apply_calories_consumed(metric, amount_kcal)
    return await _save(db, metric)


async def update_fasting(
    db: AsyncSession,
    user_id: int,
    tz_name: Optional[str] = None,
    *,
    fasting_state: str,
    fasting_minutes: Optional[int] = None,
    fasting_protocol: Optional[str] = None,
    fasting_started_at: Optional[datetime.datetime] = None,
    has_fasting_started_at: bool = False,
    now_fn: Optional[Clock] = None,
) -> DailyMetric:
    now = (now_fn or now_utc)()
    metric = await get_or_create_metric_for_date(db, user_id, local_date_for(now, tz_name))
    metric.fasting_state = fasting_state
    if fasting_minutes is not None:
        metric.fasting_minutes = fasting_minutes
    if fasting_protocol is not None:
        metric.fasting_protocol = fasting_protocol
    if has_fasting_started_at:
        metric.fasting_started_at = fasting_started_at
    elif fasting_state == "fasting" and metric.fasting_started_at is None:
        metric.fasting_started_at = now
    elif fasting_state == "idle":
        metric.fasting_started_at = None
    return await _save(db, metric)


async def toggle_habit(
    db: AsyncSession,
    user_id: int,
    tz_name: Optional[str] = None,
    *,
    habit_key: str,
    now_fn: Optional[Clock] = None,
) -> DailyMetric:
    metric = await get_or_create_today(db, user_id, tz_name, now_fn=now_fn)
    habits = list(metric.habits_completed or [])
    if habit_key in habits:
        habits.remove(habit_key)
    elif len(habits) < MAX_HABITS_PER_DAY:
        habits.append(habit_key)
    metric.habits_completed = habits
    return await _save(db, metric)


def is_day_active(metric: Any) -> bool:
    return (
        (metric.water_intake_ml or 0) > 0
        or (metric.calories_consumed or 0) > 0
        or (metric.calories_burned or 0) > 0
        or len(metric.habits_completed or []) > 0
        or metric.fasting_state == "fasting"
    )


def compute_streaks(
    active_dates: set[datetime.date], today_date: datetime.date
) -> tuple[int, int]:
    streak = 0
    cursor: Optional[datetime.date] = None
    if today_date in active_dates:
        cursor = today_date
    elif (today_date - datetime.timedelta(days=1)) in active_dates:
        cursor = today_date - datetime.timedelta(days=1)

    while cursor is not None and cursor in active_dates:
        streak += 1
        cursor -= datetime.timedelta(days=1)

    best = 0
    run = 0
    prev: Optional[datetime.date] = None
    for day in sorted(active_dates):
        if prev is not None and day == prev + datetime.timedelta(days=1):
            run += 1
        else:
            run = 1
        if run > best:
            best = run
        prev = day

    return streak, best


def default_daily_metric_response(
    target_date: datetime.date, now: datetime.datetime
) -> DailyMetricResponse:
    return DailyMetricResponse(
        id=0,
        date=target_date,
        calories_consumed=0,
        calories_burned=0,
        water_intake_ml=0,
        fasting_minutes=0,
        fasting_state="idle",
        fasting_started_at=None,
        fasting_protocol="16:8",
        habits_completed=[],
        notes=None,
        created_at=now,
        updated_at=now,
    )


async def get_today_view(
    db: AsyncSession,
    user_id: int,
    tz_name: Optional[str] = None,
    now_fn: Optional[Clock] = None,
) -> DailyMetricResponse:
    now = (now_fn or now_utc)()
    today_date = local_date_for(now, tz_name)
    metric = await db.scalar(
        select(DailyMetric).where(DailyMetric.user_id == user_id, DailyMetric.date == today_date)
    )
    if metric is not None:
        return DailyMetricResponse.model_validate(metric)
    return default_daily_metric_response(today_date, now)


async def get_today_summary(
    db: AsyncSession,
    user_id: int,
    tz_name: Optional[str] = None,
    now_fn: Optional[Clock] = None,
) -> TodaySummaryResponse:
    now = (now_fn or now_utc)()
    today_date = local_date_for(now, tz_name)
    window_start = today_date - datetime.timedelta(days=6)

    window_rows = list(
        (
            await db.scalars(
                select(DailyMetric)
                .where(
                    DailyMetric.user_id == user_id,
                    DailyMetric.date >= window_start,
                    DailyMetric.date <= today_date,
                )
                .order_by(DailyMetric.date.asc())
            )
        ).all()
    )
    by_date = {row.date: row for row in window_rows}

    history_rows = (
        await db.execute(
            select(
                DailyMetric.date,
                DailyMetric.calories_consumed,
                DailyMetric.calories_burned,
                DailyMetric.water_intake_ml,
                DailyMetric.fasting_state,
                DailyMetric.habits_completed,
            )
            .where(DailyMetric.user_id == user_id, DailyMetric.date < window_start)
            .order_by(DailyMetric.date.desc())
            .limit(MAX_STREAK_HISTORY_DAYS)
        )
    ).all()

    active_dates = {row.date for row in window_rows if is_day_active(row)} | {
        row.date for row in history_rows if is_day_active(row)
    }
    streak_days, best_streak_days = compute_streaks(active_dates, today_date)

    today_row = by_date.get(today_date)
    today_resp = (
        DailyMetricResponse.model_validate(today_row)
        if today_row is not None
        else default_daily_metric_response(today_date, now)
    )

    history_7d: list[TodaySummaryDay] = []
    for offset in range(6, -1, -1):
        day = today_date - datetime.timedelta(days=offset)
        metric = by_date.get(day)
        if metric is not None:
            history_7d.append(
                TodaySummaryDay(
                    date=day,
                    calories_consumed=metric.calories_consumed or 0,
                    calories_burned=metric.calories_burned or 0,
                    water_intake_ml=metric.water_intake_ml or 0,
                    habits_count=len(metric.habits_completed or []),
                    fasting_state=metric.fasting_state,
                    active=is_day_active(metric),
                )
            )
        else:
            history_7d.append(
                TodaySummaryDay(
                    date=day,
                    calories_consumed=0,
                    calories_burned=0,
                    water_intake_ml=0,
                    habits_count=0,
                    fasting_state="idle",
                    active=False,
                )
            )

    return TodaySummaryResponse(
        today=today_resp,
        streak_days=streak_days,
        best_streak_days=best_streak_days,
        history_7d=history_7d,
    )
