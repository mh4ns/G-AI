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


async def test_workout_log_rejects_out_of_range_values(client):
    me = await register(client)
    res = await client.post(
        "/api/v1/workouts/logs",
        json={"duration_sec": 900, "calories_burned": 120, "form_accuracy_pct": 140},
        headers=bearer(me),
    )
    assert res.status_code == 422
