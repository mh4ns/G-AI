from app.core import database
from app.core.config import settings


def test_postgres_urls_are_normalised_for_asyncpg():
    url, args = database.normalize_database_url("postgres://u:p%40ss@db.example.supabase.co:5432/postgres?sslmode=require")
    assert url.drivername == "postgresql+asyncpg"
    assert url.password == "p@ss"
    assert "sslmode" not in url.query
    assert args == {"ssl": "require"}


def test_transaction_pooler_disables_prepared_statements(monkeypatch):
    monkeypatch.setattr(settings, "DB_TRANSACTION_POOLER", None)
    url, opts = database.engine_options("postgresql://u:p@aws-0-x.pooler.supabase.com:6543/postgres")
    args = opts["connect_args"]
    assert args["statement_cache_size"] == 0 and args["prepared_statement_cache_size"] == 0
    assert args["prepared_statement_name_func"]() != args["prepared_statement_name_func"]()
    assert opts["pool_pre_ping"] is True and opts["pool_size"] == settings.DB_POOL_SIZE

    # Session pooler / direct connection keeps prepared statements, unless forced.
    _, opts = database.engine_options("postgresql+asyncpg://u:p@db.x.supabase.co:5432/postgres")
    assert "statement_cache_size" not in opts["connect_args"]
    monkeypatch.setattr(settings, "DB_TRANSACTION_POOLER", True)
    _, opts = database.engine_options("postgresql+asyncpg://u:p@pgbouncer.internal:5432/postgres")
    assert opts["connect_args"]["statement_cache_size"] == 0


def test_sqlite_options_unchanged():
    url, opts = database.engine_options("sqlite+aiosqlite:///./x.db")
    assert opts["connect_args"] == {"check_same_thread": False}
    assert "pool_size" not in opts


async def test_healthz(client):
    res = await client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy", "database": "connected"}


async def test_create_engine_and_application_seam(tmp_path):
    from httpx import ASGITransport, AsyncClient
    from sqlalchemy import text

    from app.core.config import Settings
    from app.main import create_application

    db_path = tmp_path / "isolated_seam.db"
    custom_settings = Settings(
        _env_file=None,
        ENVIRONMENT="test",
        AUTO_CREATE_SCHEMA=False,
        DATABASE_URL=f"sqlite+aiosqlite:///{db_path}",
    )
    custom_engine, custom_session_maker = database.create_engine_and_sessionmaker(config=custom_settings)
    try:
        async with custom_session_maker() as session:
            assert (await session.execute(text("SELECT 1"))).scalar_one() == 1

        custom_app = create_application(
            app_settings=custom_settings,
            db_engine=custom_engine,
            session_factory=custom_session_maker,
        )
        async with AsyncClient(transport=ASGITransport(app=custom_app), base_url="http://test") as c:
            res = await c.get("/healthz")
            assert res.status_code == 200
            assert res.json() == {"status": "healthy", "database": "connected"}
    finally:
        await custom_engine.dispose()
