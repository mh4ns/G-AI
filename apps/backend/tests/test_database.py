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
