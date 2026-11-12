from typing import Any, AsyncGenerator, Dict, Optional, Tuple
from uuid import uuid4

from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Supabase's transaction pooler (Supavisor/PgBouncer in transaction mode) listens on 6543.
_TRANSACTION_POOLER_PORT = 6543
_SSL_MODES = {"require", "verify-ca", "verify-full", "prefer", "allow", "disable"}


def normalize_database_url(raw_url: str) -> Tuple[URL, Dict[str, Any]]:
    """
    Turns whatever the hosting provider hands out into an async SQLAlchemy URL.

    - `postgres://` / `postgresql://` (Supabase, Render) become `postgresql+asyncpg://`.
    - libpq's `sslmode=` is not understood by asyncpg; it is translated to asyncpg's `ssl=` argument.

    Returns the URL and the extra DBAPI connect arguments it implies.
    """
    url = make_url(raw_url)
    connect_args: Dict[str, Any] = {}
    if url.drivername in ("postgres", "postgresql", "postgresql+psycopg2", "postgresql+psycopg"):
        url = url.set(drivername="postgresql+asyncpg")
    if url.drivername.startswith("postgresql"):
        query = dict(url.query)
        sslmode = query.pop("sslmode", None)
        if isinstance(sslmode, str) and sslmode in _SSL_MODES:
            connect_args["ssl"] = sslmode
        url = url.set(query=query)
    return url, connect_args


def uses_transaction_pooler(url: URL, override: Optional[bool]) -> bool:
    if override is not None:
        return override
    return url.drivername.startswith("postgresql") and url.port == _TRANSACTION_POOLER_PORT


def engine_options(raw_url: str) -> Tuple[URL, Dict[str, Any]]:
    """URL and `create_async_engine` keyword arguments for the configured database."""
    url, connect_args = normalize_database_url(raw_url)
    options: Dict[str, Any] = {"echo": False}

    if url.drivername.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    else:
        # Free tiers allow few connections and drop idle ones: keep the pool small and test
        # connections before use so a recycled connection never surfaces as a 500.
        options.update(
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE_SECONDS,
            pool_pre_ping=True,
            pool_timeout=30,
        )
        if uses_transaction_pooler(url, settings.DB_TRANSACTION_POOLER):
            # A transaction pooler hands each transaction to any server connection, so
            # server-side prepared statements from one transaction are missing in the next.
            connect_args.update(
                statement_cache_size=0,
                prepared_statement_cache_size=0,
                prepared_statement_name_func=lambda: f"__asyncpg_{uuid4()}__",
            )

    options["connect_args"] = connect_args
    return url, options


_url, _options = engine_options(settings.DATABASE_URL)
engine = create_async_engine(_url, **_options)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yields a session. Endpoints commit explicitly; anything left uncommitted is rolled back."""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
