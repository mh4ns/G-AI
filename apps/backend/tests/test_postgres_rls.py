import importlib.util
import os
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

import app.models  # noqa: F401
from app.core.database import Base, engine_options
from app.services.rls import harden_public_tables_sql

BACKEND_DIR = Path(__file__).resolve().parents[1]
HARDENING_MIGRATIONS: tuple[Path, ...] = (
    BACKEND_DIR / "alembic" / "versions" / "f1a9c3e7b204_hardening_rls_and_sprint1_base.py",
    BACKEND_DIR / "alembic" / "versions" / "b4d8e2a19c37_nutrition_food_items_and_meal_logs.py",
    BACKEND_DIR / "alembic" / "versions" / "c9e4a7f21d58_body_and_mind_tables.py",
)


def _load_hardened_migration_tables() -> set[str]:
    tables: set[str] = set()
    for idx, path in enumerate(HARDENING_MIGRATIONS):
        spec = importlib.util.spec_from_file_location(f"migration_rls_{idx}", path)
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        tables.update(module.HARDENED_PUBLIC_TABLES)
    return tables


def test_rls_sql_covers_all_metadata_tables_and_alembic_version():
    expected_tables = sorted([*Base.metadata.tables.keys(), "alembic_version"])
    stmts = harden_public_tables_sql(expected_tables)
    joined = "\n".join(stmts)

    for table in expected_tables:
        assert f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY;' in joined

    assert "FORCE ROW LEVEL SECURITY" not in joined
    assert "REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon" in joined
    assert "REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated" in joined
    assert "ALTER DEFAULT PRIVILEGES" in joined


def test_migrations_harden_every_registered_table_and_alembic_version():
    hardened = _load_hardened_migration_tables()
    expected = set(Base.metadata.tables.keys()) | {"alembic_version"}
    assert expected.issubset(hardened)


def test_rls_rejects_invalid_table_identifier():
    with pytest.raises(ValueError, match="Invalid PostgreSQL table identifier"):
        harden_public_tables_sql(["users; DROP TABLE users;--"])


async def test_postgres_rls_and_anon_privileges_after_alembic_upgrade():
    test_db_url = os.environ.get("TEST_DATABASE_URL", "")
    if not test_db_url.startswith("postgres"):
        pytest.skip("TEST_DATABASE_URL is unset or not PostgreSQL")

    # conftest.fresh_schema calls Base.metadata.create_all() before every test,
    # which leaves un-hardened tables in public. Reset public so Alembic runs
    # a true clean upgrade from base -> head.
    url, opts = engine_options(test_db_url)
    pg_engine = create_async_engine(url, **opts)
    try:
        async with pg_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.execute(text("DROP TABLE IF EXISTS public.alembic_version"))
    finally:
        await pg_engine.dispose()

    env = {
        **os.environ,
        "DATABASE_URL": test_db_url,
        "MIGRATION_DATABASE_URL": test_db_url,
    }
    proc = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=str(BACKEND_DIR),
        env=env,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0, f"alembic upgrade head failed:\n{proc.stdout}\n{proc.stderr}"

    pg_engine = create_async_engine(url, **opts)
    try:
        async with pg_engine.connect() as conn:
            rows = (
                await conn.execute(
                    text(
                        """
                        SELECT t.tablename, t.rowsecurity, c.relforcerowsecurity
                        FROM pg_tables t
                        JOIN pg_namespace n ON n.nspname = t.schemaname
                        JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = n.oid
                        WHERE t.schemaname = 'public'
                        ORDER BY t.tablename
                        """
                    )
                )
            ).all()

            by_table = {row.tablename: (row.rowsecurity, row.relforcerowsecurity) for row in rows}
            expected_tables = set(Base.metadata.tables.keys()) | {"alembic_version"}
            assert expected_tables.issubset(by_table.keys())

            for table in expected_tables:
                rowsecurity, relforcerowsecurity = by_table[table]
                assert rowsecurity is True, f"{table} does not have rowsecurity enabled"
                assert relforcerowsecurity is False, f"{table} must not have FORCE ROW LEVEL SECURITY"

            # Verify non-owner / anon privileges are zero across all public tables.
            role_exists = await conn.scalar(text("SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')"))
            check_role = "anon" if role_exists else "PUBLIC"

            for table in by_table:
                for priv in ("SELECT", "INSERT", "UPDATE", "DELETE"):
                    has_priv = await conn.scalar(
                        text("SELECT has_table_privilege(:role, :tbl, :priv)"),
                        {"role": check_role, "tbl": f'public."{table}"', "priv": priv},
                    )
                    assert has_priv is False, f"Role {check_role} unexpectedly has {priv} on {table}"
    finally:
        await pg_engine.dispose()
