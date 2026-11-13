"""PostgreSQL RLS and Data API privilege-hardening DDL helpers (ADR-0004)."""

import re
from typing import Sequence

_VALID_IDENTIFIER = re.compile(r"^[a-z_][a-z0-9_]*$")
_DATA_API_ROLES = ("anon", "authenticated")


def _validate_table_name(table_name: str) -> str:
    if not _VALID_IDENTIFIER.match(table_name):
        raise ValueError(f"Invalid PostgreSQL table identifier: {table_name!r}")
    return table_name


def revoke_public_api_privileges_sql() -> list[str]:
    """
    Emit idempotent DO blocks revoking public-schema privileges and default privileges
    from Supabase Data API roles (`anon`, `authenticated`), guarded on `pg_roles` so
    plain PostgreSQL instances without those roles never fail.
    """
    revoke_existing_blocks = "\n".join(
        f"""    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role}') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM {role};
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM {role};
        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM {role};
    END IF;"""
        for role in _DATA_API_ROLES
    )

    revoke_postgres_defaults = "\n".join(
        f"""        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role}') THEN
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM {role};
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM {role};
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON ROUTINES FROM {role};
        END IF;"""
        for role in _DATA_API_ROLES
    )

    revoke_current_defaults = "\n".join(
        f"""    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role}') THEN
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM {role};
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM {role};
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM {role};
    END IF;"""
        for role in _DATA_API_ROLES
    )

    return [
        f"DO $$\nBEGIN\n{revoke_existing_blocks}\nEND $$;",
        (
            "DO $$\nBEGIN\n"
            "    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres')\n"
            "       AND pg_has_role(current_user, 'postgres', 'MEMBER') THEN\n"
            f"{revoke_postgres_defaults}\n"
            "    END IF;\n"
            f"{revoke_current_defaults}\n"
            "END $$;"
        ),
    ]


def enable_rls_sql(table_names: Sequence[str]) -> list[str]:
    """
    Emit `ALTER TABLE public."<table>" ENABLE ROW LEVEL SECURITY;` without `FORCE ROW LEVEL SECURITY`
    so table owners and `BYPASSRLS` runtime roles remain unaffected while Data API roles with
    zero policies face default-deny.
    """
    return [f'ALTER TABLE public."{_validate_table_name(name)}" ENABLE ROW LEVEL SECURITY;' for name in table_names]


def disable_rls_sql(table_names: Sequence[str]) -> list[str]:
    """Emit `DISABLE ROW LEVEL SECURITY` statements for Alembic downgrades."""
    return [f'ALTER TABLE public."{_validate_table_name(name)}" DISABLE ROW LEVEL SECURITY;' for name in table_names]


def harden_public_tables_sql(table_names: Sequence[str], *, include_revokes: bool = True) -> list[str]:
    """Return ordered PostgreSQL DDL statements to revoke Data API grants and enable RLS."""
    statements: list[str] = []
    if include_revokes:
        statements.extend(revoke_public_api_privileges_sql())
    statements.extend(enable_rls_sql(table_names))
    return statements
