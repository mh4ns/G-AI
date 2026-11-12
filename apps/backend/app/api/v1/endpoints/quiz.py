from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_optional_user
from app.core.database import get_db
from app.models import PersonalizedPlan, QuizAssessment, User
from app.schemas.quiz import PersonalizedPlanResponse, QuizAssessmentResponse, QuizSubmitRequest
from app.services.plan_calculator import AGE_GROUP_MIDPOINTS, PlanInputs, calculate_plan

router = APIRouter(prefix="/quiz", tags=["Quiz & Assessment"])


def _age_group_for(age: int) -> str:
    if age < 30:
        return "18-29"
    if age < 40:
        return "30-39"
    if age < 50:
        return "40-49"
    return "50+"


@router.post("/submit", response_model=QuizAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def submit_quiz(
    payload: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Persists a quiz assessment and its computed plan. Guests may submit; when a
    session is present the records are attached to that user (never to a client-supplied id).
    """
    age = payload.age if payload.age is not None else AGE_GROUP_MIDPOINTS[payload.age_group]
    age_group = payload.age_group or _age_group_for(age)
    is_male = payload.archetype == "male_strength" or payload.gender == "male"
    user_id = user.id if user else None

    metrics = calculate_plan(
        PlanInputs(
            is_male=is_male,
            age=age,
            height_cm=payload.height_cm,
            current_weight_kg=payload.current_weight_kg,
            target_weight_kg=payload.target_weight_kg,
            activity_level=payload.activity_level,
        )
    )

    if user_id is not None:
        # Only the newest plan is active for a user.
        previous = await db.scalars(
            select(PersonalizedPlan).where(PersonalizedPlan.user_id == user_id, PersonalizedPlan.is_active.is_(True))
        )
        for plan in previous:
            plan.is_active = False

    assessment = QuizAssessment(
        user_id=user_id,
        session_id=payload.session_id,
        age=age,
        age_group=age_group,
        gender=payload.gender,
        height_cm=payload.height_cm,
        current_weight_kg=payload.current_weight_kg,
        target_weight_kg=payload.target_weight_kg,
        activity_level=payload.activity_level,
        primary_goal=payload.primary_goal,
        focus_areas=payload.focus_areas,
        obstacles=payload.obstacles,
        fitness_level=payload.fitness_level,
    )
    db.add(assessment)
    await db.flush()

    db.add(
        PersonalizedPlan(
            assessment_id=assessment.id,
            user_id=user_id,
            bmi=metrics.bmi,
            bmr=metrics.bmr,
            tdee=metrics.tdee,
            daily_calorie_target=metrics.daily_calorie_target,
            daily_water_target_ml=metrics.daily_water_target_ml,
            estimated_duration_weeks=metrics.estimated_weeks,
            projected_weight_milestones=metrics.projected_milestones,
            focus_routine="Calisthenics & Strength" if is_male else "Pilates Core & Posture",
            recommended_diet_type="Balanced, protein-forward whole foods",
            is_active=True,
        )
    )
    await db.commit()

    result = await db.execute(
        select(QuizAssessment).where(QuizAssessment.id == assessment.id).options(selectinload(QuizAssessment.plan))
    )
    return result.scalar_one()


@router.get("/plans/me", response_model=PersonalizedPlanResponse)
async def my_active_plan(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    plan = await db.scalar(
        select(PersonalizedPlan)
        .where(PersonalizedPlan.user_id == user.id, PersonalizedPlan.is_active.is_(True))
        .order_by(PersonalizedPlan.created_at.desc(), PersonalizedPlan.id.desc())
        .limit(1)
    )
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active plan")
    return plan
