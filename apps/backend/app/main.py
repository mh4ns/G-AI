from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

import app.models  # noqa: F401  (registers all models on Base.metadata)
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.AUTO_CREATE_SCHEMA:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_application() -> FastAPI:
    is_prod = settings.ENVIRONMENT == "production"
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        # Interactive docs are useful locally but needlessly expose the API surface in production.
        openapi_url=None if is_prod else f"{settings.API_V1_STR}/openapi.json",
        docs_url=None if is_prod else f"{settings.API_V1_STR}/docs",
        redoc_url=None if is_prod else f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @application.get("/healthz", tags=["Health"])
    async def health_check():
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            database = "connected"
        except Exception:
            database = "unavailable"
        healthy = database == "connected"
        return JSONResponse(
            status_code=200 if healthy else 503,
            content={"status": "healthy" if healthy else "degraded", "database": database},
        )

    application.include_router(api_router, prefix=settings.API_V1_STR)
    return application


app = create_application()
