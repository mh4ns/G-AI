# ADR-0001: Sessions and the web ↔ backend boundary

- Status: Accepted
- Date: 2026-11-09

## Context

The web app and the FastAPI backend were two disconnected systems. The backend had no authentication
and trusted a `user_id` sent by the client in paths and bodies, so any caller could read or change any
user's health data. Store orders trusted client prices and were marked `paid` without any payment.

## Decision

1. **The backend owns identity.** `/api/v1/auth/{register,login,logout,me}` issue a JWT (HS256,
   `SECRET_KEY`). The acting user is resolved only by `get_current_user` / `get_optional_user`;
   no endpoint accepts a `user_id`.
2. **Browser sessions use an httpOnly cookie.** Next.js rewrites `/api/v1/*` to `BACKEND_URL`, so the
   cookie is first-party (`SameSite=Lax`, `Secure` in production) and the token is never readable by
   page JavaScript. Non-browser clients may send `Authorization: Bearer`.
3. **The server computes anything with money or health meaning.** Order totals come from the
   catalog; plan numbers are recomputed in `plan_calculator.py`. The web keeps its own calculator for
   instant feedback, and both are pinned to `packages/shared-types/fixtures/plan-vectors.json`.
4. **Guests stay local.** Quiz answers are persisted only for signed-in users.
5. **Schema changes go through Alembic.** `AUTO_CREATE_SCHEMA` is a local-SQLite convenience and is
   rejected in production.

## Consequences

- CSRF: relies on `SameSite=Lax` plus JSON bodies (cross-site forms cannot send `application/json`
  without a preflight that CORS rejects). Revisit if any endpoint starts accepting form posts.
- There is no refresh token or server-side revocation yet: logout clears the cookie, but a copied
  token stays valid until it expires (7 days). Add a token version per user before adding admin roles.
- No login rate limiting yet; add it before public launch.
- The web store still uses its local mock catalogue; wiring checkout to `/store/orders` requires
  unifying product ids with the backend seed.
