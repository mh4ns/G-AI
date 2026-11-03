from fastapi import APIRouter
from app.api.v1.endpoints import quiz, today, store, workout

api_router = APIRouter()

api_router.include_router(quiz.router)
api_router.include_router(today.router)
api_router.include_router(store.router)
api_router.include_router(workout.router)
