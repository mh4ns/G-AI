from datetime import date, datetime, timezone

from sqlalchemy import delete, select

from app.core.database import async_session_maker
from app.models import PersonalizedPlan, QuizAssessment, User
from tests.conftest import bearer, register


async def test_today_requires_auth(client):
    for method, path in [
        ("get", "/api/v1/today"),
        ("post", "/api/v1/today/water"),
        ("post", "/api/v1/workouts/logs"),
    ]:
        res = await getattr(client, method)(path, **({"json": {}} if method == "post" else {}))
        assert res.status_code == 401, path


async def test_users_cannot_see_or_change_each_others_metrics(client):
    alice = await register(client, "alice@example.com")
    client.cookies.clear()
    bob = await register(client, "bob@example.com")
    client.cookies.clear()

    res = await client.post("/api/v1/today/water", json={"amount_ml": 500}, headers=bearer(alice))
    assert res.json()["water_intake_ml"] == 500

    # A user_id smuggled into the body is ignored; Bob only ever touches his own row.
    res = await client.post(
        "/api/v1/today/water", json={"amount_ml": 250, "user_id": alice["user"]["id"]}, headers=bearer(bob)
    )
    assert res.json()["water_intake_ml"] == 250

    alice_today = (await client.get("/api/v1/today", headers=bearer(alice))).json()
    assert alice_today["water_intake_ml"] == 500
    assert "user_id" not in alice_today


async def test_water_is_bounded_and_never_negative(client):
    me = await register(client)
    assert (await client.post("/api/v1/today/water", json={"amount_ml": 99999}, headers=bearer(me))).status_code == 422
    res = await client.post("/api/v1/today/water", json={"amount_ml": -500}, headers=bearer(me))
    assert res.json()["water_intake_ml"] == 0


async def test_habit_toggle_and_validation(client):
    me = await register(client)
    on = await client.post("/api/v1/today/habits/toggle", json={"habit_key": "workout"}, headers=bearer(me))
    assert on.json()["habits_completed"] == ["workout"]
    off = await client.post("/api/v1/today/habits/toggle", json={"habit_key": "workout"}, headers=bearer(me))
    assert off.json()["habits_completed"] == []
    bad = await client.post("/api/v1/today/habits/toggle", json={"habit_key": "<script>"}, headers=bearer(me))
    assert bad.status_code == 422


async def test_workout_log_updates_today_calories(client):
    me = await register(client)
    res = await client.post(
        "/api/v1/workouts/logs",
        json={"duration_sec": 900, "calories_burned": 120, "reps_completed": 30, "form_accuracy_pct": 91.5},
        headers=bearer(me),
    )
    assert res.status_code == 201
    today = (await client.get("/api/v1/today", headers=bearer(me))).json()
    assert today["calories_burned"] == 120
    logs = (await client.get("/api/v1/workouts/logs/me", headers=bearer(me))).json()
    assert len(logs) == 1 and logs[0]["form_accuracy_pct"] == 91.5


async def test_workout_log_without_camera_has_no_form_score(client):
    session = await register(client)
    res = await client.post(
        "/api/v1/workouts/logs",
        json={"duration_sec": 600, "calories_burned": 80, "reps_completed": 20},
        headers=bearer(session),
    )
    assert res.status_code == 201, res.text
    assert res.json()["form_accuracy_pct"] is None


async def test_workout_log_rejects_out_of_range_values(client):
    me = await register(client)
    res = await client.post(
        "/api/v1/workouts/logs",
        json={"duration_sec": 900, "calories_burned": 120, "form_accuracy_pct": 140},
        headers=bearer(me),
    )
    assert res.status_code == 422


async def test_today_uses_user_timezone(client, monkeypatch):
    from app.services import daily_metrics

    # 2026-11-12 20:00 UTC is 2026-11-12 12:00 in Los Angeles, 2026-11-13 03:00 in Ho Chi Minh.
    monkeypatch.setattr(daily_metrics, "now_utc", lambda: datetime(2026, 11, 12, 20, 0, tzinfo=timezone.utc))

    assert daily_metrics.local_today("America/Los_Angeles") == date(2026, 11, 12)
    assert daily_metrics.local_today("Asia/Ho_Chi_Minh") == date(2026, 11, 13)

    bad_tz = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "badtz@example.com",
            "full_name": "Bad TZ",
            "password": "correct-horse-1",
            "timezone": "Mars/Olympus_Mons",
        },
    )
    assert bad_tz.status_code == 422

    la_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "la@example.com",
            "full_name": "LA User",
            "password": "correct-horse-1",
            "timezone": "America/Los_Angeles",
        },
    )
    assert la_reg.status_code == 201, la_reg.text
    la_body = la_reg.json()
    assert la_body["user"]["timezone"] == "America/Los_Angeles"
    client.cookies.clear()

    hcmc_reg = await register(client, "hcmc@example.com")
    assert hcmc_reg["user"]["timezone"] == "Asia/Ho_Chi_Minh"
    client.cookies.clear()

    la_today = await client.get("/api/v1/today", headers=bearer(la_body))
    hcmc_today = await client.get("/api/v1/today", headers=bearer(hcmc_reg))
    assert la_today.status_code == 200 and hcmc_today.status_code == 200
    assert la_today.json()["date"] == "2026-11-12"
    assert hcmc_today.json()["date"] == "2026-11-13"


async def test_fasting_update_persists_protocol_and_started_at(client):
    me = await register(client, "fasting@example.com")
    initial = await client.get("/api/v1/today", headers=bearer(me))
    assert initial.status_code == 200
    assert initial.json()["fasting_protocol"] == "16:8"
    assert initial.json()["fasting_started_at"] is None

    bad = await client.post(
        "/api/v1/today/fasting",
        json={"fasting_state": "fasting", "fasting_protocol": "12:12"},
        headers=bearer(me),
    )
    assert bad.status_code == 422

    started_at = "2026-11-12T10:00:00Z"
    updated = await client.post(
        "/api/v1/today/fasting",
        json={
            "fasting_state": "fasting",
            "fasting_minutes": 90,
            "fasting_protocol": "18:6",
            "fasting_started_at": started_at,
        },
        headers=bearer(me),
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["fasting_state"] == "fasting"
    assert body["fasting_minutes"] == 90
    assert body["fasting_protocol"] == "18:6"
    assert body["fasting_started_at"] is not None
    assert body["fasting_started_at"].startswith("2026-11-12T10:00:00")

    fetched = (await client.get("/api/v1/today", headers=bearer(me))).json()
    assert fetched["fasting_protocol"] == "18:6"
    assert fetched["fasting_started_at"].startswith("2026-11-12T10:00:00")


async def test_deleting_user_cascades_quiz_and_plan(client):
    me = await register(client, "cascade@example.com")
    user_id = me["user"]["id"]

    quiz_res = await client.post(
        "/api/v1/quiz/submit",
        json={
            "session_id": "sess-cascade-1234",
            "archetype": "female_pilates",
            "gender": "female",
            "age": 30,
            "height_cm": 162,
            "current_weight_kg": 62.5,
            "target_weight_kg": 54,
            "activity_level": "lightly_active",
            "primary_goal": "lose_weight",
            "focus_areas": ["core"],
            "obstacles": ["lack_time"],
        },
        headers=bearer(me),
    )
    assert quiz_res.status_code == 201, quiz_res.text
    assessment_id = quiz_res.json()["id"]
    plan_id = quiz_res.json()["plan"]["id"]

    async with async_session_maker() as session:
        await session.execute(delete(User).where(User.id == user_id))
        await session.commit()

    async with async_session_maker() as session:
        assert await session.scalar(select(QuizAssessment).where(QuizAssessment.id == assessment_id)) is None
        assert await session.scalar(select(PersonalizedPlan).where(PersonalizedPlan.id == plan_id)) is None


async def test_fasting_defaults_started_at_and_resets_on_idle(client, monkeypatch):
    from app.services import daily_metrics

    fixed_now = datetime(2026, 11, 24, 12, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(daily_metrics, "now_utc", lambda: fixed_now)

    me = await register(client, "fasting-default@example.com")
    started = await client.post(
        "/api/v1/today/fasting",
        json={"fasting_state": "fasting", "fasting_protocol": "16:8"},
        headers=bearer(me),
    )
    assert started.status_code == 200, started.text
    assert started.json()["fasting_started_at"].startswith("2026-11-24T12:00:00")

    reset = await client.post(
        "/api/v1/today/fasting",
        json={"fasting_state": "idle"},
        headers=bearer(me),
    )
    assert reset.status_code == 200, reset.text
    assert reset.json()["fasting_started_at"] is None


async def test_today_summary_computes_streak_and_7d_history(client, monkeypatch):
    from app.models import DailyMetric
    from app.services import daily_metrics

    fixed_now = datetime(2026, 11, 24, 8, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(daily_metrics, "now_utc", lambda: fixed_now)

    me = await register(client, "streak@example.com")
    user_id = me["user"]["id"]

    # Seed past activity:
    # - 2026-11-18..2026-11-20: 3-day best run (gap on 2026-11-21)
    # - 2026-11-22..2026-11-23: 2-day run ending yesterday; today (2026-11-24) still inactive
    async with async_session_maker() as session:
        session.add_all(
            [
                DailyMetric(user_id=user_id, date=date(2026, 11, 18), water_intake_ml=500),
                DailyMetric(user_id=user_id, date=date(2026, 11, 19), calories_consumed=1200),
                DailyMetric(user_id=user_id, date=date(2026, 11, 20), calories_burned=200),
                DailyMetric(user_id=user_id, date=date(2026, 11, 22), habits_completed=["water"]),
                DailyMetric(user_id=user_id, date=date(2026, 11, 23), fasting_state="fasting"),
            ]
        )
        await session.commit()

    summary_before = await client.get("/api/v1/today/summary", headers=bearer(me))
    assert summary_before.status_code == 200, summary_before.text
    data = summary_before.json()
    assert data["streak_days"] == 2
    assert data["best_streak_days"] == 3
    assert len(data["history_7d"]) == 7
    assert data["history_7d"][0]["date"] == "2026-11-18"
    assert data["history_7d"][-1]["date"] == "2026-11-24"
    assert data["history_7d"][-1]["active"] is False

    # Logging activity today extends current streak to 3.
    await client.post("/api/v1/today/water", json={"amount_ml": 250}, headers=bearer(me))
    summary_after = (await client.get("/api/v1/today/summary", headers=bearer(me))).json()
    assert summary_after["streak_days"] == 3
    assert summary_after["best_streak_days"] == 3
    assert summary_after["history_7d"][-1]["active"] is True


async def test_workout_calories_burned_clamped_and_get_today_is_read_only(client):
    from sqlalchemy import func, select
    from app.models import DailyMetric

    me = await register(client, "clamp@example.com")
    user_id = me["user"]["id"]

    # GET /today and GET /today/summary before any write must not create DB rows.
    today_res = await client.get("/api/v1/today", headers=bearer(me))
    assert today_res.status_code == 200
    assert today_res.json()["id"] == 0
    summary_res = await client.get("/api/v1/today/summary", headers=bearer(me))
    assert summary_res.status_code == 200

    async with async_session_maker() as session:
        count_before = await session.scalar(
            select(func.count(DailyMetric.id)).where(DailyMetric.user_id == user_id)
        )
    assert count_before == 0

    # Workout logs accumulate calories_burned up to the shared 20_000 ceiling (5 * 5000 = 25000 -> 20000).
    for _ in range(5):
        res = await client.post(
            "/api/v1/workouts/logs",
            json={"duration_sec": 3600, "calories_burned": 5000, "reps_completed": 50},
            headers=bearer(me),
        )
        assert res.status_code == 201, res.text

    today_after = (await client.get("/api/v1/today", headers=bearer(me))).json()
    assert today_after["calories_burned"] == 20_000
