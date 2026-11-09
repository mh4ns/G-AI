from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.v1.endpoints.today import get_or_create_today
from app.core.database import get_db
from app.models import Exercise, User, WorkoutLog, WorkoutRoutine
from app.schemas.workout import ExerciseResponse, WorkoutLogCreate, WorkoutLogResponse, WorkoutRoutineResponse

router = APIRouter(prefix="/workouts", tags=["Workouts & AI Live PT"])


@router.get("/exercises", response_model=List[ExerciseResponse])
async def list_exercises(db: AsyncSession = Depends(get_db)):
    """Exercises with the MediaPipe landmark joints and target angles used for form scoring."""
    return (await db.scalars(select(Exercise).order_by(Exercise.id))).all()


@router.get("/routines", response_model=List[WorkoutRoutineResponse])
async def list_routines(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(WorkoutRoutine).order_by(WorkoutRoutine.id))).all()


@router.post("/logs", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
async def log_workout(
    payload: WorkoutLogCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    """Records a finished session for the signed-in user and adds its calories to today's metrics."""
    if payload.routine_id is not None and await db.get(WorkoutRoutine, payload.routine_id) is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown routine_id")

    metric = await get_or_create_today(db, user.id)
    log = WorkoutLog(user_id=user.id, **payload.model_dump())
    db.add(log)
    metric.calories_burned = (metric.calories_burned or 0) + payload.calories_burned

    await db.commit()
    await db.refresh(log)
    return log


@router.get("/logs/me", response_model=List[WorkoutLogResponse])
async def my_workout_logs(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = (
        select(WorkoutLog)
        .where(WorkoutLog.user_id == user.id)
        .order_by(WorkoutLog.completed_at.desc(), WorkoutLog.id.desc())
        .limit(limit)
    )
    return (await db.scalars(stmt)).all()
