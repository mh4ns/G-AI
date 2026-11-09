import json
from pathlib import Path

import pytest

from app.services.plan_calculator import PlanInputs, calculate_plan
from tests.conftest import bearer, register

VECTORS = json.loads(
    (Path(__file__).resolve().parents[3] / "packages/shared-types/fixtures/plan-vectors.json").read_text()
)["vectors"]


@pytest.mark.parametrize("vector", VECTORS, ids=lambda v: f"{v['input']['gender']}-{v['input']['age']}")
def test_plan_matches_web_implementation(vector):
    i, e = vector["input"], vector["expected"]
    m = calculate_plan(
        PlanInputs(
            is_male=i["archetype"] == "male_strength" or i["gender"] == "male",
            age=i["age"],
            height_cm=i["heightCm"],
            current_weight_kg=i["currentWeightKg"],
            target_weight_kg=i["targetWeightKg"],
            activity_level=i["activityLevel"],
        )
    )
    assert (m.bmi, m.bmr, m.tdee) == (e["bmi"], e["bmr"], e["tdee"])
    assert m.daily_calorie_target == e["dailyCalorieTarget"]
    assert m.calorie_deficit_daily == e["calorieDeficitDaily"]
    assert m.estimated_weeks == e["estimatedWeeks"]
    assert m.daily_water_target_ml == e["recommendedWaterMl"]


QUIZ = {
    "session_id": "sess-12345678",
    "archetype": "female_pilates",
    "gender": "female",
    "age": 32,
    "height_cm": 162,
    "current_weight_kg": 62.5,
    "target_weight_kg": 54,
    "activity_level": "lightly_active",
    "primary_goal": "lose_weight",
    "focus_areas": ["belly", "glutes"],
    "obstacles": ["lack_of_time"],
}


async def test_guest_submission_is_not_attached_to_any_user(client):
    res = await client.post("/api/v1/quiz/submit", json={**QUIZ, "user_id": 1})
    assert res.status_code == 201, res.text
    body = res.json()
    assert "user_id" not in body
    assert body["plan"]["daily_calorie_target"] == VECTORS[0]["expected"]["dailyCalorieTarget"]


async def test_signed_in_submission_becomes_the_active_plan(client):
    me = await register(client)
    assert (await client.get("/api/v1/quiz/plans/me", headers=bearer(me))).status_code == 404
    await client.post("/api/v1/quiz/submit", json=QUIZ, headers=bearer(me))
    second = await client.post("/api/v1/quiz/submit", json={**QUIZ, "target_weight_kg": 60}, headers=bearer(me))
    plan = (await client.get("/api/v1/quiz/plans/me", headers=bearer(me))).json()
    assert plan["id"] == second.json()["plan"]["id"]


async def test_quiz_validation(client):
    bad_age = {k: v for k, v in QUIZ.items() if k != "age"}
    assert (await client.post("/api/v1/quiz/submit", json=bad_age)).status_code == 422
    assert (await client.post("/api/v1/quiz/submit", json={**QUIZ, "height_cm": 20})).status_code == 422
    assert (await client.post("/api/v1/quiz/submit", json={**QUIZ, "focus_areas": ["<img>"]})).status_code == 422
