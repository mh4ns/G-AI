"""
Personalized plan maths (BMI, Mifflin-St Jeor BMR, TDEE, calorie target, timeline).

This mirrors `apps/web/src/lib/quiz-calculations.ts` so the number a user sees
instantly in the browser is the same number persisted here. The shared fixture
`packages/shared-types/fixtures/plan-vectors.json` is asserted against both implementations;
change both together.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

ACTIVITY_MULTIPLIERS: Dict[str, float] = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
}
DEFAULT_ACTIVITY_MULTIPLIER = 1.35

AGE_GROUP_MIDPOINTS: Dict[str, int] = {"18-29": 24, "30-39": 34, "40-49": 44, "50+": 55}

KCAL_PER_KG_FAT = 7700
KCAL_PER_KG_GAIN = 5500
SURPLUS_KCAL = 350
MAX_PLAN_WEEKS = 52


def js_round(value: float) -> int:
    """JavaScript Math.round semantics (half rounds toward +inf), unlike Python's banker's rounding."""
    return math.floor(value + 0.5)


@dataclass
class PlanInputs:
    is_male: bool
    age: int
    height_cm: float
    current_weight_kg: float
    target_weight_kg: float
    activity_level: Optional[str] = None


@dataclass
class PlanMetrics:
    bmi: float
    bmr: int
    tdee: int
    daily_calorie_target: int
    calorie_deficit_daily: int
    estimated_weeks: int
    daily_water_target_ml: int
    projected_milestones: List[Dict[str, Any]] = field(default_factory=list)


def calculate_plan(inp: PlanInputs) -> PlanMetrics:
    height_m = inp.height_cm / 100.0
    bmi = round(inp.current_weight_kg / (height_m * height_m), 1)

    bmr_raw = 10 * inp.current_weight_kg + 6.25 * inp.height_cm - 5 * inp.age
    bmr_raw += 5 if inp.is_male else -161
    bmr = js_round(bmr_raw)

    multiplier = ACTIVITY_MULTIPLIERS.get(inp.activity_level or "", DEFAULT_ACTIVITY_MULTIPLIER)
    tdee = js_round(bmr * multiplier)

    weight_diff = inp.current_weight_kg - inp.target_weight_kg
    min_calorie_floor = 1500 if inp.is_male else 1200

    if weight_diff > 0:
        deficit = 500 if inp.is_male else 400
        target = max(min_calorie_floor, tdee - deficit)
        weeks = max(3, js_round((weight_diff * KCAL_PER_KG_FAT) / (deficit * 7)))
    elif weight_diff < 0:
        deficit = -SURPLUS_KCAL
        target = tdee + SURPLUS_KCAL
        weeks = max(4, js_round((abs(weight_diff) * KCAL_PER_KG_GAIN) / (SURPLUS_KCAL * 7)))
    else:
        deficit = 0
        target = tdee
        weeks = 4

    water_ml = js_round((inp.current_weight_kg * 35) / 100) * 100

    horizon = min(weeks, MAX_PLAN_WEEKS)
    milestones = [
        {
            "week": week,
            "weight": round(inp.current_weight_kg - weight_diff * (week / horizon), 1),
        }
        for week in range(horizon + 1)
    ]

    return PlanMetrics(
        bmi=bmi,
        bmr=bmr,
        tdee=tdee,
        daily_calorie_target=target,
        calorie_deficit_daily=deficit,
        estimated_weeks=weeks,
        daily_water_target_ml=water_ml,
        projected_milestones=milestones,
    )
