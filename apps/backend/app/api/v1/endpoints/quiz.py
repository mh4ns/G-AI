from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_optional_user
from app.core.database import get_db
from app.models import User
from app.schemas.quiz import PersonalizedPlanResponse, QuizAssessmentResponse, QuizSubmitRequest
from app.services import quiz as quiz_service

router = APIRouter(prefix="/quiz", tags=["Quiz & Assessment"])


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
    return await quiz_service.submit_quiz(db, payload, user_id=user.id if user else None)


@router.get("/plans/me", response_model=PersonalizedPlanResponse)
async def my_active_plan(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    plan = await quiz_service.get_active_plan(db, user.id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active plan")
    return plan
