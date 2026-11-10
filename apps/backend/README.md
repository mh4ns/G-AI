# G-AI — Backend API

FastAPI + async SQLAlchemy 2.0 service behind the web app.

## What is implemented

| Area | Endpoints (`/api/v1`) | Auth |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/password`, `GET /auth/me` | — / required for password |
| Quiz & plan | `POST /quiz/submit`, `GET /quiz/plans/me` | optional / required |
| Today dashboard | `GET /today`, `POST /today/{water,calories,fasting,habits/toggle}` | required |
| Workouts | `GET /workouts/{exercises,routines}`, `POST /workouts/logs`, `GET /workouts/logs/me` | public / required |
| Store | `GET /store/products[/{id}]` (`?category=&activity=`), `POST /store/orders`, `GET /store/orders/me` | public / optional / required |

Not implemented yet (see the root README roadmap): nutrition logging, body-fat tools, CBT journal, payments.

### Security model

- Sessions are JWTs (HS256, `SECRET_KEY`). The web app receives them as an **httpOnly, SameSite=Lax cookie**
  via the same-origin `/api/v1` proxy; other clients may send `Authorization: Bearer <token>`.
- The acting user always comes from the session. No endpoint accepts a `user_id` from the client.
- Order prices, names and images are read from the catalog; the client only picks product, size and quantity.
  Orders start as `payment_status=pending` until a payment provider confirms them.
- Passwords: PBKDF2-HMAC-SHA256, 600k iterations, per-user salt (legacy 100k hashes still verify).
- Failed logins are throttled per email+IP (5), email (20) and IP (50) per 15 minutes, stored in
  `auth_throttles` under keyed hashes; over the limit, login answers `429` with `Retry-After`.
  Behind proxies set `TRUSTED_PROXY_HOPS` (Vercel rewrite + Render = 2) so the real client IP is used.
- Every JWT carries the user's `token_version`. Logout and password change bump it, which revokes all
  earlier tokens on every device (see ADR-0003).
- `ENVIRONMENT=production` refuses to start with the default `SECRET_KEY`, insecure cookies or `AUTO_CREATE_SCHEMA=true`.

## Layout

```text
app/
├── api/deps.py   # get_current_user / get_optional_user
├── api/v1/       # Versioned routers
├── core/         # Settings, security (hashing, JWT), database session
├── models/       # SQLAlchemy entities
├── schemas/      # Pydantic request / response models
└── services/     # Pure business logic (plan_calculator.py)
alembic/          # Migrations
tests/            # pytest suite (isolated SQLite DB per run)
```

## Running locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python seed_data.py          # drops & recreates tables, adds demo data (dev only)
uvicorn app.main:app --reload --port 8000
```

Swagger: `http://localhost:8000/api/v1/docs` (disabled in production).
Demo account from the seed: `demo@g-ai.health` / `PilatesPass2026!`.

## Store catalog

`app/data/store_catalog.json` is the only source of truth for the catalog (ids `p1..p8`); the website reads it
through `GET /store/products` (its `sampleCatalog.ts` is a browse-only fallback for when the backend is down).
Migration `c3f1a9d2b8e4` loads it on `alembic upgrade head`. To change products later, edit the JSON and run:

```bash
python -m app.services.catalog --dry-run   # show inserts / updates / deactivations
python -m app.services.catalog             # apply (idempotent, keeps stock, never deletes)
```

## API contract for the web apps

`packages/shared-types/openapi/backend-v1.json` is the generated OpenAPI schema and
`packages/shared-types/api/store.ts` the matching TypeScript types. After changing a schema or route:
`python -m app.export_openapi` (a test fails if the committed file is stale).

## Postgres / Supabase

`DATABASE_URL` accepts the provider's string as-is (`postgres://…`, `postgresql://…?sslmode=require`);
it is rewritten for asyncpg. On Supabase's **transaction pooler (port 6543)** server-side prepared
statements are disabled automatically (`DB_TRANSACTION_POOLER=true|false` overrides). The pool is small
for free tiers (`DB_POOL_SIZE=3`, `DB_MAX_OVERFLOW=2`, `DB_POOL_RECYCLE_SECONDS=300`, `pool_pre_ping`).
`GET /healthz` returns 200 when the database answers, 503 otherwise.

Run the suite against Postgres (it drops all tables, so use a throwaway database):

```bash
TEST_DATABASE_URL=postgresql://postgres@localhost:5432/gai_test python -m pytest -q
```

## Migrations

`AUTO_CREATE_SCHEMA=true` (default for local SQLite) creates tables on startup. Anywhere data matters:

```bash
alembic upgrade head                                   # apply
alembic revision --autogenerate -m "describe change"   # after editing models
```

## Tests

```bash
python -m pytest -q
```

`tests/test_quiz_and_plan.py` asserts `services/plan_calculator.py` against
`packages/shared-types/fixtures/plan-vectors.json`, which the web test suite also checks, so the plan
numbers shown in the browser and the ones stored here cannot drift apart silently.
