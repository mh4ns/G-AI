# G-AI — Comprehensive Health Coaching Ecosystem with Real-Time AI Companion

> Multi-agent guidelines, engineering conventions, and project configuration for G-AI.

---

## Agent skills

### Issue tracker

Issues and specs live as GitHub Issues for `mh4ns/G-AI`. Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical 5-role triage vocabulary mapped directly to GitHub labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout with root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.

---

## Architecture & Monorepo Layout

- **`apps/web`**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide icons, Canvas Confetti. Proxies `/api/v1/*` to the backend (see ADR-0001). MediaPipe Pose is planned, not yet integrated.
- **`apps/backend`**: Python FastAPI, Uvicorn, async SQLAlchemy 2.0 (`aiosqlite`/PostgreSQL), Pydantic v2 schemas, Alembic migrations, JWT cookie sessions.
- **`packages/shared-types`**: Shared types and `fixtures/plan-vectors.json`, the parity fixture both apps' plan maths is tested against.
- **`docs/`**: Technical specs, use case breakdown (`USECASE_BREAKDOWN.md`), architecture designs, sequence diagrams, and agent configs (`docs/agents/`).

---

## Commands (run before pushing)

- Backend (`apps/backend`): `pip install -r requirements.txt`, `python -m pytest -q`, `alembic check` after model changes.
- Web (`apps/web`): `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- CI (`.github/workflows/ci.yml`) runs all of the above.

## Engineering Guidelines & Cybersecurity Rules

1. **Security Mindset & Proactive Audits**:
   - Actively reference and apply secure patterns (OWASP Top 10, CWE mitigation, API security).
   - Never commit or hardcode secrets, API keys, credentials, or private tokens. Always read from `.env` or sanitized environment configurations.
   - Enforce robust input validation, output encoding, and parameterized database queries (SQLAlchemy ORM/parameterized queries).
   - Validate authentication, authorization checks, and session lifecycle management.
   - Follow the principle of least privilege, zero-trust network boundaries, and secure logging without leaking sensitive personal health data (PHI/BIA biometrics).

2. **Frontend Standards (`apps/web`)**:
   - 60 FPS silky micro-interactions with hardware-accelerated CSS/SVG rather than heavy blocking 3D assets.
   - Dynamic responsiveness across mobile, tablet, and widescreen viewports.
   - Strict TypeScript safety with zero build errors (`npm run build`).

3. **Backend Standards (`apps/backend`)**:
   - Async-first Python design (`async def` with SQLAlchemy `AsyncSession`).
   - Strong schema validation with Pydantic schemas separating Request models from Response models.
