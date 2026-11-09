# Deploying the web app to Vercel

The Next.js app in `apps/web` deploys to Vercel through Vercel's Git integration.
The FastAPI backend is **not** hosted on Vercel. Deploy it separately (see "Backend" below) and point
the web app at it with `BACKEND_URL`.

## 1. Import the repository

1. Go to <https://vercel.com/new> and import `mh4ns/G-AI` (grant the Vercel GitHub app access to it if asked).
2. **Root Directory:** `apps/web`. Framework preset: Next.js (auto-detected). Leave build and install commands at their defaults.
3. Add the environment variables below, then click **Deploy**.

Each push to `main` deploys to production. Every other branch gets a preview URL.

## 2. Environment variables

Set these under Project → Settings → Environment Variables (for Production and Preview).

| Variable | Required | Value |
|---|---|---|
| `PREDICTION_SIGNING_SECRET` | yes | Random string, at least 32 characters: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `GEMINI_API_KEY` | for predictions | Key from <https://aistudio.google.com/app/apikey> |
| `BACKEND_URL` | for login and Today sync | Public HTTPS URL of the FastAPI backend, e.g. `https://g-ai-api.onrender.com` |
| `IMAGE_MODEL`, `VISION_MODEL` | no | Override the default Gemini models |

`BACKEND_URL` is read **at build time** (Next.js rewrites). After you change it, redeploy.

Without `BACKEND_URL` the site still builds and guests can use the quiz, the prediction page and a
local-only Today page, but login and server sync return errors.

## 3. Known limitation: photo predictions

On Vercel, prediction jobs and generated images live in one function instance's memory and in `/tmp`.
`after()` keeps generation running after the response is sent. However, a polling request that lands
on a different instance cannot see the job, and images disappear when the instance is recycled.
Expect occasional "job not found" errors until the durable job queue in
[ADR-0002](adr/0002-prediction-images-privacy.md) is built.

## 4. Backend (separate host)

The backend needs a long-running Python process and PostgreSQL. Any of Render, Railway or Fly.io works
with `apps/backend/Dockerfile`, and Supabase or Neon can provide the database. Backend environment variables:

```
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DB
SECRET_KEY=<random, at least 32 characters>
AUTO_CREATE_SCHEMA=false
AUTH_COOKIE_SECURE=true
BACKEND_CORS_ORIGINS=https://<your-vercel-domain>
```

The container runs `alembic upgrade head` on start. Browsers reach the backend only through the Vercel
`/api/v1` proxy, so the session cookie stays first-party on the Vercel domain.
