from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

import app.models  # noqa: F401  (registers all models on Base.metadata)
from app.api.v1.router import api_router
from app.core.config import Settings, settings
from app.core.database import Base, async_session_maker, engine, get_db
from app.services.nutrition import load_food_catalog, sync_food_catalog


def create_application(
    app_settings: Optional[Settings] = None,
    db_engine: Optional[AsyncEngine] = None,
    session_factory: Optional[async_sessionmaker[AsyncSession]] = None,
) -> FastAPI:
    cfg = app_settings or settings
    active_engine = db_engine or engine
    active_session_factory = session_factory or (
        async_sessionmaker(
            bind=active_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        if db_engine is not None
        else async_session_maker
    )

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if cfg.AUTO_CREATE_SCHEMA:
            async with active_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        if cfg.ENVIRONMENT != "test":
            try:
                async with active_session_factory() as session:
                    await sync_food_catalog(session, load_food_catalog())
                    await session.commit()
            except IntegrityError:
                # Another concurrent worker seeded the curated catalog first.
                pass
        yield
        await active_engine.dispose()

    is_prod = cfg.ENVIRONMENT == "production"
    application = FastAPI(
        title=cfg.PROJECT_NAME,
        version="1.0.0",
        # Interactive docs are useful locally but needlessly expose the API surface in production.
        openapi_url=None if is_prod else f"{cfg.API_V1_STR}/openapi.json",
        docs_url=None if is_prod else f"{cfg.API_V1_STR}/docs",
        redoc_url=None if is_prod else f"{cfg.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    if session_factory is not None or db_engine is not None:
        async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
            async with active_session_factory() as session:
                try:
                    yield session
                except Exception:
                    await session.rollback()
                    raise

        application.dependency_overrides[get_db] = _override_get_db

    @application.get("/healthz", tags=["Health"])
    async def health_check():
        try:
            async with active_engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            database = "connected"
        except Exception:
            database = "unavailable"
        healthy = database == "connected"
        return JSONResponse(
            status_code=200 if healthy else 503,
            content={"status": "healthy" if healthy else "degraded", "database": database},
        )

    application.include_router(api_router, prefix=cfg.API_V1_STR)
    return application


app = create_application()
