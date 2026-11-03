from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models import Exercise, WorkoutRoutine, WorkoutLog
from app.schemas.workout import (
    ExerciseResponse,
    WorkoutRoutineResponse,
    WorkoutLogCreate,
    WorkoutLogResponse,
)

router = APIRouter(prefix="/workouts", tags=["Workouts & AI Live PT"])

@router.get("/exercises", response_model=List[ExerciseResponse])
async def list_exercises(db: AsyncSession = Depends(get_db)):
    """
    Returns exercises equipped with MediaPipe pose landmarks and joint angles for real-time AI form correction.
    """
    stmt = select(Exercise)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/routines", response_model=List[WorkoutRoutineResponse])
async def list_routines(db: AsyncSession = Depends(get_db)):
    stmt = select(WorkoutRoutine)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/logs", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
async def log_workout(
    user_id: int,
    payload: WorkoutLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Records a completed workout session with AI form accuracy percentage and calories burned.
    """
    log = WorkoutLog(
        user_id=user_id,
        routine_id=payload.routine_id,
        duration_sec=payload.duration_sec,
        calories_burned=payload.calories_burned,
        reps_completed=payload.reps_completed,
        form_accuracy_pct=payload.form_accuracy_pct,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
