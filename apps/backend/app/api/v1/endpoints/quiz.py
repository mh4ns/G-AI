from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import QuizAssessment, PersonalizedPlan
from app.schemas.quiz import QuizSubmitRequest, QuizAssessmentResponse, PersonalizedPlanResponse

router = APIRouter(prefix="/quiz", tags=["Quiz & Assessment"])

def calculate_mifflin_st_jeor(
    gender: str, weight_kg: float, height_cm: float, age_group: str, goal: str, target_weight_kg: float
) -> Dict[str, Any]:
    """
    100% Software-only Biometric Calculation (Zero IoT hardware required).
    Calculates BMR via Mifflin-St Jeor equation:
    BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + s (s=+5 for male, -161 for female)
    """
    age_map = {"18-29": 24, "30-39": 34, "40-49": 44, "50+": 55}
    age = age_map.get(age_group, 30)

    # Height in meters for BMI
    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m * height_m), 1)

    s = 5 if gender.lower() == "male" else -161
    bmr = round(10.0 * weight_kg + 6.25 * height_cm - 5.0 * age + s, 1)

    # Activity multiplier for light-to-moderate Pilates routine (1.375)
    tdee = round(bmr * 1.375, 1)

    # Deficit / Surplus calculation based on goal
    if goal in ["weight_loss", "fat_burn"]:
        daily_calorie = int(max(1200, tdee - 400))
    elif goal in ["muscle_tone", "strength"]:
        daily_calorie = int(tdee)
    else:
        daily_calorie = int(tdee - 200)

    # 4-week milestones
    weight_diff = weight_kg - target_weight_kg
    milestones = []
    for week in range(5):
        projected_w = round(weight_kg - (weight_diff * (week / 4.0)), 1)
        notes = [
            "Khởi đầu lộ trình cá nhân hóa",
            "Kích hoạt chuyển hóa & giảm tích nước",
            "Siết cơ vùng lõi & ổn định tư thế",
            "Tăng cường sức bền Pilates",
            "Đạt vóc dáng mục tiêu 28 ngày"
        ]
        milestones.append({
            "week": week,
            "date": f"Tuần {week}",
            "weight": projected_w,
            "note": notes[week]
        })

    return {
        "bmi": bmi,
        "bmr": bmr,
        "tdee": tdee,
        "daily_calorie_target": daily_calorie,
        "daily_water_target_ml": 2500,
        "projected_milestones": milestones
    }

@router.post("/submit", response_model=QuizAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def submit_quiz(
    payload: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Submits user assessment quiz responses, calculates personalized Mifflin-St Jeor plan,
    and persists both records securely to the database.
    """
    # 1. Create Assessment Record
    assessment = QuizAssessment(
        user_id=payload.user_id,
        session_id=payload.session_id,
        age_group=payload.age_group,
        gender=payload.gender,
        height_cm=payload.height_cm,
        current_weight_kg=payload.current_weight_kg,
        target_weight_kg=payload.target_weight_kg,
        primary_goal=payload.primary_goal,
        focus_areas=payload.focus_areas,
        obstacles=payload.obstacles,
        fitness_level=payload.fitness_level,
    )
    db.add(assessment)
    await db.flush()

    # 2. Compute Biometric Plan
    metrics = calculate_mifflin_st_jeor(
        payload.gender,
        payload.current_weight_kg,
        payload.height_cm,
        payload.age_group,
        payload.primary_goal,
        payload.target_weight_kg
    )

    plan = PersonalizedPlan(
        assessment_id=assessment.id,
        user_id=payload.user_id,
        bmi=metrics["bmi"],
        bmr=metrics["bmr"],
        tdee=metrics["tdee"],
        daily_calorie_target=metrics["daily_calorie_target"],
        daily_water_target_ml=metrics["daily_water_target_ml"],
        estimated_duration_weeks=4,
        projected_weight_milestones=metrics["projected_milestones"],
        focus_routine="Pilates Thảm Săn Chắc Vùng Lõi & Cải Thiện Dáng Đứng",
        recommended_diet_type="Thực Đơn Cân Bằng Đủ Đạm & Giàu Chất Xơ Tự Nhiên",
        is_active=True,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(assessment)

    # Fetch with relationship loaded
    stmt = (
        select(QuizAssessment)
        .where(QuizAssessment.id == assessment.id)
        .options(selectinload(QuizAssessment.plan))
    )
    result = await db.execute(stmt)
    return result.scalar_one()
