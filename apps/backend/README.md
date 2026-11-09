# G-AI — Backend API

FastAPI + async SQLAlchemy 2.0 service behind the web app.

## What is implemented

| Area | Endpoints (`/api/v1`) | Auth |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | — |
| Quiz & plan | `POST /quiz/submit`, `GET /quiz/plans/me` | optional / required |
| Today dashboard | `GET /today`, `POST /today/{water,calories,fasting,habits/toggle}` | required |
| Workouts | `GET /workouts/{exercises,routines}`, `POST /workouts/logs`, `GET /workouts/logs/me` | public / required |
| Store | `GET /store/products[/{id}]`, `POST /store/orders` | public / optional |

Not implemented yet (see the root README roadmap): nutrition logging, body-fat tools, CBT journal, payments.

### Security model

- Sessions are JWTs (HS256, `SECRET_KEY`). The web app receives them as an **httpOnly, SameSite=Lax cookie**
  via the same-origin `/api/v1` proxy; other clients may send `Authorization: Bearer <token>`.
- The acting user always comes from the session. No endpoint accepts a `user_id` from the client.
- Order prices, names and images are read from the catalog; the client only picks product, size and quantity.
  Orders start as `payment_status=pending` until a payment provider confirms them.
- Passwords: PBKDF2-HMAC-SHA256, 600k iterations, per-user salt (legacy 100k hashes still verify).
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
