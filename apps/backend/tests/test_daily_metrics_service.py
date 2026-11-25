from datetime import date, datetime, timezone

from sqlalchemy import func, select

from app.core.database import async_session_maker
from app.models import DailyMetric, User
from app.services import daily_metrics


async def _create_user(email: str = "dm-service@example.com", tz: str = "Asia/Ho_Chi_Minh") -> User:
    async with async_session_maker() as session:
        user = User(
            email=email,
            hashed_password="not-a-real-hash",
            full_name="Service Test User",
            timezone=tz,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


def test_local_date_and_timezone_rollover_with_injected_clock():
    # 2026-11-12 20:00 UTC == 2026-11-12 12:00 LA == 2026-11-13 03:00 HCMC
    clock = lambda: datetime(2026, 11, 12, 20, 0, tzinfo=timezone.utc)
    assert daily_metrics.local_today("America/Los_Angeles", now_fn=clock) == date(2026, 11, 12)
    assert daily_metrics.local_today("Asia/Ho_Chi_Minh", now_fn=clock) == date(2026, 11, 13)
    # Invalid timezone falls back to settings.DEFAULT_TIMEZONE (Asia/Ho_Chi_Minh)
    assert daily_metrics.local_today("Mars/Olympus_Mons", now_fn=clock) == date(2026, 11, 13)


def test_calories_and_water_clamp_bounds():
    metric = DailyMetric(
        user_id=1,
        date=date(2026, 11, 24),
        calories_consumed=19_900,
        calories_burned=19_950,
        water_intake_ml=100,
        habits_completed=[],
    )
    daily_metrics.apply_calories_consumed(metric, 500)
    assert metric.calories_consumed == 20_000
    daily_metrics.apply_calories_consumed(metric, -25_000)
    assert metric.calories_consumed == 0

    daily_metrics.apply_calories_burned(metric, 500)
    assert metric.calories_burned == 20_000
    daily_metrics.apply_calories_burned(metric, -30_000)
    assert metric.calories_burned == 0

    daily_metrics.apply_water_intake(metric, 25_000)
    assert metric.water_intake_ml == 20_000
    daily_metrics.apply_water_intake(metric, -25_000)
    assert metric.water_intake_ml == 0


async def test_get_today_view_and_summary_perform_zero_db_writes():
    user = await _create_user("readonly@example.com")
    clock = lambda: datetime(2026, 11, 24, 9, 0, tzinfo=timezone.utc)

    async with async_session_maker() as session:
        view = await daily_metrics.get_today_view(session, user.id, user.timezone, now_fn=clock)
        assert view.id == 0
        assert view.date == date(2026, 11, 24)
        assert view.fasting_protocol == "16:8"
        assert view.habits_completed == []

        summary = await daily_metrics.get_today_summary(session, user.id, user.timezone, now_fn=clock)
        assert summary.today.id == 0
        assert summary.streak_days == 0
        assert summary.best_streak_days == 0
        assert len(summary.history_7d) == 7

        row_count = await session.scalar(
            select(func.count(DailyMetric.id)).where(DailyMetric.user_id == user.id)
        )
        assert row_count == 0


async def test_fasting_transitions_and_habit_cap():
    user = await _create_user("habits@example.com")
    clock = lambda: datetime(2026, 11, 24, 10, 0, tzinfo=timezone.utc)

    async with async_session_maker() as session:
        started = await daily_metrics.update_fasting(
            session,
            user.id,
            user.timezone,
            fasting_state="fasting",
            fasting_protocol="18:6",
            now_fn=clock,
        )
        assert started.fasting_started_at is not None
        assert started.fasting_started_at.replace(tzinfo=timezone.utc) == clock()

        idle = await daily_metrics.update_fasting(
            session,
            user.id,
            user.timezone,
            fasting_state="idle",
            now_fn=clock,
        )
        assert idle.fasting_started_at is None

        for i in range(daily_metrics.MAX_HABITS_PER_DAY + 5):
            metric = await daily_metrics.toggle_habit(
                session, user.id, user.timezone, habit_key=f"habit_{i}", now_fn=clock
            )
        assert len(metric.habits_completed) == daily_metrics.MAX_HABITS_PER_DAY

        metric = await daily_metrics.toggle_habit(
            session, user.id, user.timezone, habit_key="habit_0", now_fn=clock
        )
        assert "habit_0" not in metric.habits_completed
        assert len(metric.habits_completed) == daily_metrics.MAX_HABITS_PER_DAY - 1


async def test_summary_computes_streaks_beyond_7d_window():
    user = await _create_user("longstreak@example.com")
    clock = lambda: datetime(2026, 11, 24, 10, 0, tzinfo=timezone.utc)

    async with async_session_maker() as session:
        # 5-day streak earlier in the month (outside the 7-day window) + 2 days ending yesterday
        for day in (
            date(2026, 11, 10),
            date(2026, 11, 11),
            date(2026, 11, 12),
            date(2026, 11, 13),
            date(2026, 11, 14),
            date(2026, 11, 22),
            date(2026, 11, 23),
        ):
            session.add(DailyMetric(user_id=user.id, date=day, water_intake_ml=300))
        await session.commit()

        summary = await daily_metrics.get_today_summary(session, user.id, user.timezone, now_fn=clock)
        assert summary.streak_days == 2
        assert summary.best_streak_days == 5
        assert summary.today.id == 0
