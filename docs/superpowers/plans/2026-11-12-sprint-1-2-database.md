# Sprint 1–2 Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Sprint 1 and Sprint 2 PostgreSQL/Supabase database layer in `apps/backend` (ADR-0004 RLS/role hardening, user timezone, fasting fields, `food_items`, `meal_logs`, `body_measurements`, `progress_photos`, `cbt_sessions`, `cbt_messages`, and Postgres RLS tests), deferring store currency migration, `subscriptions`, and `prediction_jobs` to Sprint 3 as approved.

**Architecture:** `apps/backend` (FastAPI + async SQLAlchemy 2.0 + Alembic) remains the single owner of schema, identity, and business rules. All tables stay in `public` with `ENABLE ROW LEVEL SECURITY` (zero permissive policies) and revoked `anon`/`authenticated` privileges, guarded against `TEST_DATABASE_URL` plain Postgres and SQLite test runs. Work is split into 3 sequential-migration sessions with verification after each session.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, `asyncpg`, `aiosqlite`, `cryptography` (AES-256-GCM for `cbt_messages`), `pytest`.

**Spec:** [docs/superpowers/specs/2026-11-12-web-database-design.md](../specs/2026-11-12-web-database-design.md) and [docs/adr/0004-supabase-postgres-and-storage.md](../../adr/0004-supabase-postgres-and-storage.md).

## Global Constraints
- Defer `products`/`orders` currency minor-unit conversion, `subscriptions`, and `prediction_jobs` (do not alter `products` or `orders` in this plan).
- Every new JSON column uses `JSONB().with_variant(JSON(), "sqlite")`.
- Every timestamp uses `DateTime(timezone=True)` (`TIMESTAMPTZ`).
- Timeline tables (`meal_logs`, `body_measurements`, `progress_photos`, `cbt_messages`) use composite `(user_id, <time_col>)` B-tree indexes (no `DESC`).
- Every schema change goes through Alembic with a working `downgrade()`.
- Separate Pydantic Request and Response schemas; never accept `user_id` from client payloads.
- Do not modify or revert existing uncommitted files in `apps/web/`, `package.json`, `package-lock.json`, or `apps/backend/.env.example`.
- Never write secrets or touch the live Supabase project (`fvyzrwmydcjadrlgopga`).

## Review Focus
- Running Alembic migrations on plain Postgres (`TEST_DATABASE_URL`, where Supabase roles `anon`/`authenticated`/`postgres` may not exist) or SQLite must never crash on `REVOKE`/`ENABLE ROW LEVEL SECURITY`.
- `alembic_version` must also have RLS enabled and `anon`/`authenticated` revoked on Postgres, because Alembic creates it outside `Base.metadata`.
- Deleting a `User` must cascade to `quiz_assessments`, `personalized_plans`, `meal_logs`, `body_measurements`, `progress_photos`, `cbt_sessions`, and `cbt_messages`, while `orders` remains `SET NULL` and `meal_logs` retains nutrition snapshots when a `FoodItem` is deleted.
- Duplicate `food_items` prevention (`canonical_name` partial unique index for global vs per-user custom items, plus global `barcode` partial unique index) must enforce uniqueness in both Postgres and SQLite.
- `cbt_messages.content_ciphertext` must never store or expose plaintext in the database, and key rotation via `key_version` must decrypt older messages cleanly.

---

## File Structure

- **Session 1 (Hardening + Sprint 1 Base):**
  - Modify: `apps/backend/app/core/config.py` (add `MIGRATION_DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CBT_ENCRYPTION_KEY`, `CBT_ENCRYPTION_KEY_VERSION`)
  - Modify: `apps/backend/alembic/env.py` (prefer `MIGRATION_DATABASE_URL or settings.DATABASE_URL`)
  - Create: `apps/backend/app/services/rls.py` (PostgreSQL DDL helpers for RLS + `REVOKE` + `ALTER DEFAULT PRIVILEGES`)
  - Modify: `apps/backend/app/models/user.py` (add `timezone`, relationships for new Sprint 1–2 models)
  - Modify: `apps/backend/app/models/daily_metric.py` (add `fasting_started_at`, `fasting_protocol`, `JSONB` variant on `habits_completed`)
  - Modify: `apps/backend/app/models/quiz.py` (`user_id` `ondelete="CASCADE"`, index on `personalized_plans(user_id, is_active, created_at)`)
  - Modify: `apps/backend/app/models/workout.py` (index on `workout_logs(user_id, completed_at)`)
  - Modify: `apps/backend/app/schemas/user.py`, `apps/backend/app/schemas/daily_metric.py`, `apps/backend/app/api/v1/endpoints/today.py` (`local_today(user.timezone)` + expose `timezone`, `fasting_started_at`, `fasting_protocol`)
  - Update: `packages/shared-types/openapi/backend-v1.json` (via `python -m app.export_openapi`)
  - Create: `apps/backend/alembic/versions/<rev1>_hardening_rls_and_sprint1_base.py`
  - Create: `apps/backend/tests/test_postgres_rls.py`

- **Session 2 (Sprint 1 Nutrition: `food_items` & `meal_logs`):**
  - Create: `apps/backend/app/models/nutrition.py` (`FoodItem`, `MealLog`)
  - Modify: `apps/backend/app/models/__init__.py`, `apps/backend/app/models/user.py`
  - Create: `apps/backend/app/schemas/nutrition.py`
  - Create: `apps/backend/app/services/nutrition.py` (`canonicalize_food_name`, `compute_meal_macros`)
  - Create: `apps/backend/alembic/versions/<rev2>_nutrition_food_items_and_meal_logs.py`
  - Create: `apps/backend/tests/test_nutrition_models.py`

- **Session 3 (Sprint 2 Body & Mind: `body_measurements`, `progress_photos`, `cbt_sessions`, `cbt_messages`):**
  - Modify: `apps/backend/requirements.txt` (add `cryptography>=44.0.0`)
  - Create: `apps/backend/app/models/body.py` (`BodyMeasurement`, `ProgressPhoto`)
  - Create: `apps/backend/app/models/mind.py` (`CbtSession`, `CbtMessage`)
  - Modify: `apps/backend/app/models/__init__.py`, `apps/backend/app/models/user.py`
  - Create: `apps/backend/app/schemas/body.py`, `apps/backend/app/schemas/mind.py`
  - Create: `apps/backend/app/services/body_metrics.py` (`calculate_us_navy_body_fat`, `build_progress_photo_path`)
  - Create: `apps/backend/app/services/cbt_crypto.py` (AES-256-GCM encrypt/decrypt with `key_version`)
  - Create: `apps/backend/alembic/versions/<rev3>_body_and_mind_tables.py`
  - Create: `apps/backend/tests/test_body_and_mind_models.py`

---

## Session 1: Hardening, Role Separation & Sprint 1 Base Extensions

### Task 1: Config, Migration URL Precedence & Postgres RLS DDL Helper
**Files:**
- Modify: `apps/backend/app/core/config.py`
- Modify: `apps/backend/alembic/env.py`
- Create: `apps/backend/app/services/rls.py`
- Test: `apps/backend/tests/test_config.py`

**Interfaces:**
- Produces: `settings.MIGRATION_DATABASE_URL`, `settings.SUPABASE_URL`, `settings.SUPABASE_SECRET_KEY`, `settings.CBT_ENCRYPTION_KEY`, `settings.CBT_ENCRYPTION_KEY_VERSION`; `app.services.rls.harden_public_tables_sql(table_names: list[str]) -> list[str]`.

- [ ] **Step 1: Write failing tests in `apps/backend/tests/test_config.py`**
  - Assert `Settings(MIGRATION_DATABASE_URL="postgresql://m@localhost/db").effective_migration_database_url` returns `MIGRATION_DATABASE_URL`, and falls back to `DATABASE_URL` when unset.
  - Assert `harden_public_tables_sql(["users", "alembic_version"])` emits `ENABLE ROW LEVEL SECURITY` for every named table and guarded `REVOKE ALL` from `anon, authenticated`.
- [ ] **Step 2: Run `pytest -q tests/test_config.py` to confirm FAIL.**
- [ ] **Step 3: Implement settings fields in `apps/backend/app/core/config.py`, update `apps/backend/alembic/env.py` to use `settings.effective_migration_database_url`, and create `apps/backend/app/services/rls.py`.**
  - `rls.py` generates idempotent `DO $$ ... END $$;` blocks checking `pg_roles` for `anon`/`authenticated` so plain Postgres never errors, plus `ALTER TABLE public."{name}" ENABLE ROW LEVEL SECURITY;`.
- [ ] **Step 4: Run `pytest -q tests/test_config.py` to confirm PASS.**

### Task 2: Extend `User`, `DailyMetric`, `QuizAssessment`, `PersonalizedPlan`, `WorkoutLog` & Today Timezone
**Files:**
- Modify: `apps/backend/app/models/user.py`
- Modify: `apps/backend/app/models/daily_metric.py`
- Modify: `apps/backend/app/models/quiz.py`
- Modify: `apps/backend/app/models/workout.py`
- Modify: `apps/backend/app/schemas/user.py`
- Modify: `apps/backend/app/schemas/daily_metric.py`
- Modify: `apps/backend/app/api/v1/endpoints/today.py`
- Modify: `packages/shared-types/openapi/backend-v1.json`
- Test: `apps/backend/tests/test_today_and_workouts.py`

**Interfaces:**
- Produces: `User.timezone`, `DailyMetric.fasting_started_at`, `DailyMetric.fasting_protocol`, `local_today(tz_name: str) -> datetime.date`.

- [ ] **Step 1: Write failing tests in `apps/backend/tests/test_today_and_workouts.py`**
  - `test_today_uses_user_timezone`: user with `timezone="America/Los_Angeles"` vs `"Asia/Ho_Chi_Minh"` resolves `local_today(tz_name)` accurately; invalid timezone rejected with 422 on profile/timezone update or schema validation.
  - `test_fasting_update_persists_protocol_and_started_at`: `POST /api/v1/today/fasting` accepts optional `fasting_protocol` and `fasting_started_at` and returns them in `DailyMetricResponse`.
  - `test_deleting_user_cascades_quiz_and_plan`: deleting `User` deletes its `QuizAssessment` and `PersonalizedPlan` rows.
- [ ] **Step 2: Run `pytest -q tests/test_today_and_workouts.py` to confirm FAIL.**
- [ ] **Step 3: Update models (`user.py`, `daily_metric.py`, `quiz.py`, `workout.py`), schemas (`user.py`, `daily_metric.py`), `today.py`, and run `python -m app.export_openapi`.**
- [ ] **Step 4: Run `pytest -q tests/test_today_and_workouts.py tests/test_openapi_contract.py` to confirm PASS.**

### Task 3: Alembic Migration 1 (`hardening_rls_and_sprint1_base`) & Postgres RLS Verification Test
**Files:**
- Create: `apps/backend/alembic/versions/<rev1>_hardening_rls_and_sprint1_base.py`
- Create: `apps/backend/tests/test_postgres_rls.py`

- [ ] **Step 1: Write `apps/backend/tests/test_postgres_rls.py`**
  - When `TEST_DATABASE_URL` is PostgreSQL: runs Alembic `upgrade head` on a temporary/clean Postgres target (or verifies current DB schema after upgrade), asserts every table in `pg_tables WHERE schemaname = 'public'` (including `alembic_version`) has `rowsecurity = True`, asserts zero `SELECT/INSERT/UPDATE/DELETE` privileges for `anon` (when `anon` role exists, or after creating a test role) and verifies `FORCE ROW LEVEL SECURITY` (`relforcerowsecurity`) is `False`.
  - Also includes SQLite-runnable unit tests for `harden_public_tables_sql` covering `alembic_version` and all registered `Base.metadata.tables`.
- [ ] **Step 2: Author Migration 1 (`hardening_rls_and_sprint1_base`) with clean `upgrade()` and `downgrade()`**
  - Adds `users.timezone`, `daily_metrics.fasting_started_at`, `daily_metrics.fasting_protocol`, updates `quiz_assessments`/`personalized_plans` FK `ondelete="CASCADE"` (via `batch_alter_table` for SQLite compatibility), adds `ix_personalized_plans_user_active_created` and `ix_workout_logs_user_completed`, and executes Postgres-only RLS + `REVOKE ALL` on all 10 existing tables + `alembic_version`.
- [ ] **Step 3: Verify Session 1**
  - Run `alembic upgrade head` & `alembic check` on temp SQLite DB, then `python -m pytest -q` (and on `TEST_DATABASE_URL` if Postgres is running).

---

## Session 2: Sprint 1 Nutrition (`food_items` & `meal_logs`)

### Task 4: `FoodItem` & `MealLog` Models, Schemas & Canonicalization Service
**Files:**
- Create: `apps/backend/app/models/nutrition.py`
- Modify: `apps/backend/app/models/__init__.py`, `apps/backend/app/models/user.py`
- Create: `apps/backend/app/schemas/nutrition.py`
- Create: `apps/backend/app/services/nutrition.py`
- Test: `apps/backend/tests/test_nutrition_models.py`

**Interfaces:**
- Produces: `FoodItem`, `MealLog`, `canonicalize_food_name(name: str) -> str`, `compute_meal_macros(food: FoodItem, serving_grams: float) -> dict`.

- [ ] **Step 1: Write failing tests in `apps/backend/tests/test_nutrition_models.py`**
  - `test_canonicalize_food_name_normalizes_vietnamese`: `"Phở Bò  Tái "` → `"pho bo tai"`.
  - `test_global_and_user_food_dedup`: duplicate global `canonical_name` raises `IntegrityError`; same `canonical_name` for two different users succeeds, while duplicate for the same `owner_user_id` raises `IntegrityError`; duplicate global `barcode` raises `IntegrityError`.
  - `test_meal_log_survives_food_deletion_and_cascades_on_user_delete`: deleting `FoodItem` sets `meal_logs.food_item_id = NULL` while preserving `food_name_snapshot` and `calories`; deleting `User` cascades to `meal_logs` and custom `food_items`.
- [ ] **Step 2: Run `pytest -q tests/test_nutrition_models.py` to confirm FAIL.**
- [ ] **Step 3: Implement `nutrition.py` model, schema, service, and wire into `models/__init__.py` & `User`.**
- [ ] **Step 4: Run `pytest -q tests/test_nutrition_models.py` to confirm PASS.**

### Task 5: Alembic Migration 2 (`nutrition_food_items_and_meal_logs`)
**Files:**
- Create: `apps/backend/alembic/versions/<rev2>_nutrition_food_items_and_meal_logs.py`
- Modify: `apps/backend/tests/test_postgres_rls.py` (include `food_items`, `meal_logs` in expected hardened tables)

- [ ] **Step 1: Write Migration 2 with `food_items`, `meal_logs`, partial unique indexes, `(user_id, logged_at)` and `(user_id, local_date)` indexes, Postgres RLS + `REVOKE`, and `downgrade()`.**
- [ ] **Step 2: Verify Session 2**
  - Run `alembic upgrade head` & `alembic check` on temp SQLite DB, then `python -m pytest -q`.

---

## Session 3: Sprint 2 Body & Mind (`body_measurements`, `progress_photos`, `cbt_sessions`, `cbt_messages`)

### Task 6: `BodyMeasurement` & `ProgressPhoto` Models, Schemas & Services
**Files:**
- Create: `apps/backend/app/models/body.py`
- Create: `apps/backend/app/schemas/body.py`
- Create: `apps/backend/app/services/body_metrics.py`
- Test: `apps/backend/tests/test_body_and_mind_models.py`

**Interfaces:**
- Produces: `BodyMeasurement`, `ProgressPhoto`, `calculate_us_navy_body_fat(gender: str, height_cm: float, neck_cm: float, waist_cm: float, hip_cm: float | None) -> tuple[float, str]`, `build_progress_photo_path(user_id: int, photo_uuid: str, ext: str) -> str`.

- [ ] **Step 1: Write failing tests in `apps/backend/tests/test_body_and_mind_models.py`**
  - US Navy formula for male and female inputs + rejects invalid geometry (`waist <= neck`, missing `hip_cm` for female).
  - `build_progress_photo_path(42, "abc", "webp")` returns `"users/42/abc.webp"`; `storage_path` enforces uniqueness.
- [ ] **Step 2: Run `pytest -q tests/test_body_and_mind_models.py` to confirm FAIL.**
- [ ] **Step 3: Implement `body.py` model, schema, and `body_metrics.py` service.**
- [ ] **Step 4: Run `pytest -q tests/test_body_and_mind_models.py` to confirm PASS.**

### Task 7: `CbtSession` & `CbtMessage` Models, Schemas & AES-256-GCM Crypto Service
**Files:**
- Modify: `apps/backend/requirements.txt` (add `cryptography>=44.0.0`)
- Create: `apps/backend/app/models/mind.py`
- Modify: `apps/backend/app/models/__init__.py`, `apps/backend/app/models/user.py`
- Create: `apps/backend/app/schemas/mind.py`
- Create: `apps/backend/app/services/cbt_crypto.py`
- Modify: `apps/backend/tests/test_body_and_mind_models.py`

**Interfaces:**
- Produces: `CbtSession`, `CbtMessage`, `encrypt_cbt_content(plaintext: str, key_b64: str, key_version: int = 1) -> tuple[bytes, int]`, `decrypt_cbt_content(ciphertext: bytes, keys_by_version: dict[int, str], key_version: int) -> str`.

- [ ] **Step 1: Install `cryptography` into `.venv` and add failing tests in `test_body_and_mind_models.py`**
  - Round-trip encrypt/decrypt with AES-256-GCM, ciphertext does not contain plaintext bytes, tampered ciphertext raises error, key rotation (`key_version=1` vs `2`) works, deleting `User` cascades `CbtSession` → `CbtMessage`.
- [ ] **Step 2: Run `pytest -q tests/test_body_and_mind_models.py` to confirm FAIL.**
- [ ] **Step 3: Implement `mind.py` models/schemas, `cbt_crypto.py`, and wire into `models/__init__.py` & `User`.**
- [ ] **Step 4: Run `pytest -q tests/test_body_and_mind_models.py` to confirm PASS.**

### Task 8: Alembic Migration 3 (`body_and_mind_tables`) & Full Verification
**Files:**
- Create: `apps/backend/alembic/versions/<rev3>_body_and_mind_tables.py`
- Modify: `apps/backend/tests/test_postgres_rls.py`

- [ ] **Step 1: Write Migration 3 creating `body_measurements`, `progress_photos`, `cbt_sessions`, `cbt_messages`, composite indexes `(user_id, measured_at)`, `(user_id, taken_at)`, `(user_id, last_message_at)`, `(user_id, created_at)`, `(session_id, created_at)`, `(created_at)`, Postgres RLS + `REVOKE`, and `downgrade()`.**
- [ ] **Step 2: Final cross-session verification**
  - Run `alembic upgrade head`, `alembic check`, `alembic downgrade ae6bddef5c1d` + `alembic upgrade head` on a temp SQLite DB.
  - Run `python -m pytest -q` on SQLite (and on `TEST_DATABASE_URL` if Postgres is available).
  - Run `python -m app.export_openapi --check`.
