import pytest
from pydantic import ValidationError

from app.core.config import INSECURE_DEV_SECRET, Settings


def test_production_rejects_default_secret():
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(ENVIRONMENT="production", SECRET_KEY=INSECURE_DEV_SECRET, AUTO_CREATE_SCHEMA=False, AUTH_COOKIE_SECURE=True)


def test_production_requires_migrations_and_secure_cookie():
    strong = "x" * 48
    with pytest.raises(ValidationError, match="AUTO_CREATE_SCHEMA"):
        Settings(ENVIRONMENT="production", SECRET_KEY=strong, AUTO_CREATE_SCHEMA=True, AUTH_COOKIE_SECURE=True)
    with pytest.raises(ValidationError, match="AUTH_COOKIE_SECURE"):
        Settings(ENVIRONMENT="production", SECRET_KEY=strong, AUTO_CREATE_SCHEMA=False, AUTH_COOKIE_SECURE=False)
    Settings(ENVIRONMENT="production", SECRET_KEY=strong, AUTO_CREATE_SCHEMA=False, AUTH_COOKIE_SECURE=True)


def test_cors_origins_accept_comma_separated_env(monkeypatch):
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://a.example, https://b.example")
    assert Settings().BACKEND_CORS_ORIGINS == ["https://a.example", "https://b.example"]


def test_effective_migration_database_url_precedence(monkeypatch):
    monkeypatch.delenv("MIGRATION_DATABASE_URL", raising=False)
    s_fallback = Settings(DATABASE_URL="postgresql://runtime@localhost/db", MIGRATION_DATABASE_URL=None)
    assert s_fallback.effective_migration_database_url == "postgresql://runtime@localhost/db"

    s_empty = Settings(DATABASE_URL="postgresql://runtime@localhost/db", MIGRATION_DATABASE_URL="")
    assert s_empty.effective_migration_database_url == "postgresql://runtime@localhost/db"

    s_override = Settings(
        DATABASE_URL="postgresql://runtime@localhost/db",
        MIGRATION_DATABASE_URL="postgresql://migrator@localhost/db",
    )
    assert s_override.effective_migration_database_url == "postgresql://migrator@localhost/db"


def test_supabase_and_cbt_settings_defaults(monkeypatch):
    for key in ("SUPABASE_URL", "SUPABASE_SECRET_KEY", "CBT_ENCRYPTION_KEY", "CBT_ENCRYPTION_KEY_VERSION"):
        monkeypatch.delenv(key, raising=False)
    s = Settings(_env_file=None)
    assert s.SUPABASE_URL is None
    assert s.SUPABASE_SECRET_KEY is None
    assert s.CBT_ENCRYPTION_KEY is None
    assert s.CBT_ENCRYPTION_KEY_VERSION == 1


def test_harden_public_tables_sql_emits_rls_and_guarded_revokes():
    from app.services.rls import harden_public_tables_sql

    stmts = harden_public_tables_sql(["users", "alembic_version"])
    joined = "\n".join(stmts)

    assert 'ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;' in joined
    assert 'ALTER TABLE public."alembic_version" ENABLE ROW LEVEL SECURITY;' in joined
    assert "FORCE ROW LEVEL SECURITY" not in joined
    assert "pg_roles" in joined
    assert "REVOKE ALL" in joined
    assert "anon" in joined
    assert "authenticated" in joined
    assert "ALTER DEFAULT PRIVILEGES" in joined
