# ADR-0002: Privacy of photo predictions, and where the pipeline should run

- Status: Accepted (storage & access) · Proposed (durable job queue)
- Date: 2026-11-09

## Context

Predictions edit the user's own body photo, which is biometric data. Previously:
generated images were written to `public/generated/` (world-readable by URL), the cache key hashed
only the first 500 base64 characters (two different photos could collide and serve one user's images
to another), deletion was a no-op, consent was hard-coded to `true`, and a second pipeline
(`/api/generate-twin`) sent photos without consent.

## Decision (implemented)

- Images are stored in a private directory (`PREDICTION_STORAGE_DIR`, default `.data/predictions`)
  and served only by `/api/prediction/image/[cacheKey]/[day]` with an HMAC signature that expires
  after 24h (`PREDICTION_SIGNING_SECRET`). Responses are `Cache-Control: private` and bypass
  Next's shared image optimiser.
- Each job has a random access token, returned once; polling and deletion require it.
- The cache key is SHA-256 over the whole photo plus every generation input.
- Consent is opt-in, stored on the device, and checked before any upload.
- Only one pipeline remains (`/api/prediction/*`).

## Known limitation → next step (proposed)

Jobs live in process memory and the worker runs after the HTTP response. This works on a single
long-lived Node process (`next start`, Docker) but **not on serverless (Vercel)**: the job map is
per-instance, background work can be frozen after the response, and the filesystem is ephemeral.

Proposed: move generation to the backend.

1. `prediction_jobs` table (owner `user_id`, status, progress, error, cache key).
2. Images in object storage (Supabase Storage / S3) with signed URLs from the storage provider.
3. A worker (arq or RQ on Redis, or a managed queue) runs the Gemini calls.
4. Rate limits per user instead of per IP; require sign-in to generate.
5. Next.js `/api/prediction/*` routes become thin proxies or are removed.

## Addendum (2026-11-09): pluggable image providers

`src/lib/image-providers.ts` picks the backend: Gemini (Google AI Studio key) → Vercel AI Gateway
(Muse Image or Google's image model, key-less on Vercel through OIDC, billed to gateway credits) → Cloudflare
Workers AI img2img (free daily allowance, lower fidelity, no vision pre-check) → none (illustrative
presets, nothing leaves the device). The cache key includes the provider and model, so outputs from
different backends never mix. The same consent, private storage and signed-link rules apply to every provider.

Google Flow was considered and rejected: it has no official API, and the unofficial wrappers drive a
logged-in browser session, which is fragile and likely against Google's terms. Google's image model is
reachable officially through AI Gateway instead.
