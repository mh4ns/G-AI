# Deploying to Vercel (three projects)

The repo ships **three independent websites** that share one design foundation (`packages/ui`):

| Vercel project | Root Directory | What it serves |
|---|---|---|
| `g-ai-hub` | `apps/hub` | Main website: product cards that link to the other two. Every product's logo links back here. |
| `g-ai-site` | `apps/site` | G-AI Movement: brand landing page and Movement Goods store |
| `g-ai-app` | `apps/web` | Onboarding quiz, photo prediction, Today dashboard, login, `/api/prediction/*` |

The FastAPI backend is **not** hosted on Vercel. Deploy it separately (see "Backend" below) and point
the app at it with `BACKEND_URL`.

## 1. Create the projects

For each row in the table above:

1. Go to <https://vercel.com/new> and import `mh4ns/G-AI`.
2. Set **Root Directory** to the value in the table. Vercel detects the npm workspace and installs from
   the repo root, so `packages/ui` is available. Keep the framework preset (Next.js) and the default commands.
3. Add that project's environment variables (below), then click **Deploy**.

Pushing to `main` redeploys every project whose files changed. To skip builds for unrelated changes, set
Settings → Git → **Ignored Build Step** to `git diff --quiet HEAD^ HEAD -- . ../../packages/ui`.

## 2. Environment variables

**All projects:** set these so the sites can link to each other. They are read at build time, so
redeploy after changing them.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_HUB_URL` | Public URL of `g-ai-hub`, e.g. `https://g-ai-hub.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | Public URL of `g-ai-site`, e.g. `https://g-ai-site.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Public URL of `g-ai-app`, e.g. `https://g-ai-app.vercel.app` |

**`g-ai-app` only:**

| Variable | Required | Value |
|---|---|---|
| `PREDICTION_SIGNING_SECRET` | yes | Random string, at least 32 characters: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `GEMINI_API_KEY` | optional | Best-quality predictions (needs paid image quota). Key from <https://aistudio.google.com/app/apikey> |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_API_TOKEN` | optional | Free fallback via Workers AI when there is no Gemini key. Token permission: *Workers AI: Read* |
| `HF_TOKEN`, `HF_IMAGE_MODEL` | optional | Hugging Face Inference Providers (free account, no card; ~$0.10 credits/month). Default model `black-forest-labs/FLUX.1-Kontext-dev` |
| `IMAGE_PROVIDER` | no | Force `gemini`, `ai-gateway`, `huggingface`, `cloudflare` or `none`. AI Gateway also requires a credit card on the Vercel team. `ai-gateway` on Vercel needs no key (OIDC) and bills AI Gateway credits |
| `AI_GATEWAY_IMAGE_MODEL` | no | `meta/muse-image-1.0` (default, Muse Image) or `google/gemini-3.1-flash-image-preview` |
| `BACKEND_URL` | for login and Today sync | Public HTTPS URL of the FastAPI backend, e.g. `https://g-ai-api.onrender.com` |
| `IMAGE_MODEL`, `VISION_MODEL` | no | Override the default Gemini models |

`BACKEND_URL` is also read **at build time** (Next.js rewrites).

Without `BACKEND_URL`, guests can still use the quiz, the prediction page and a local-only Today page,
but login and server sync return errors.

With no image provider configured, the prediction page still works: it shows illustrative preset
images labelled "ẢNH MINH HỌA" instead of calling an AI model.

## 3. Known limitation: photo predictions

On Vercel, prediction jobs and generated images live in one function instance's memory and in `/tmp`.
`after()` keeps generation running after the response is sent. However, a polling request that lands
on a different instance cannot see the job, and images disappear when the instance is recycled.
Expect occasional "job not found" errors until the durable job queue in
[ADR-0002](adr/0002-prediction-images-privacy.md) is built.

## 4. Backend (separate host)

The backend runs on **Render** (Docker, from [`render.yaml`](../render.yaml)) with a **Supabase**
PostgreSQL database. Follow [deploy-render.md](deploy-render.md); in short:

1. Supabase → **Connect** → *Session pooler* (port 5432) URI, with the prefix changed to
   `postgresql+asyncpg://`.
2. Render → **New → Blueprint** → this repo → paste that value as `DATABASE_URL`. Everything else
   (`ENVIRONMENT=production`, generated `SECRET_KEY`, `AUTO_CREATE_SCHEMA=false`,
   `AUTH_COOKIE_SECURE=true`, `BACKEND_CORS_ORIGINS`) comes from the Blueprint.
3. Set `BACKEND_URL` on `g-ai-app` to the Render URL (e.g. `https://g-ai-api.onrender.com`) and
   redeploy, because it is read at build time.

The container runs `alembic upgrade head` on start. Browsers reach the backend only through the Vercel
`/api/v1` proxy, so the session cookie stays first-party on the Vercel domain. Any other Docker host
(Railway, Fly.io) works with `apps/backend/Dockerfile` and the same variables; the app listens on `$PORT`
(default 8000).
