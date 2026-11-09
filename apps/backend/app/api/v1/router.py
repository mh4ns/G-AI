from fastapi import APIRouter

from app.api.v1.endpoints import auth, quiz, store, today, workout

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(quiz.router)
api_router.include_router(today.router)
api_router.include_router(store.router)
api_router.include_router(workout.router)
