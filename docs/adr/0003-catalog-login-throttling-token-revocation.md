# ADR-0003: One store catalog, login throttling and token revocation

- Status: Accepted
- Date: 2026-11-10

## Context

ADR-0001 left three gaps before public launch: the site's mock catalogue (`p1..p8`) and the backend seed
(`ga-*`) disagreed, so checkout could not call `/store/orders`; nothing limited password guessing; and a
copied token stayed valid for 7 days after logout. The backend is going to Render (free) with Supabase
Postgres (free), behind the Vercel `/api/v1` rewrite.

## Decision

1. **Catalog.** `apps/backend/app/data/store_catalog.json` is the only source of truth, first built from the
   site's former mock catalogue (same ids, names, prices, sizes and images). The site reads it through
   `GET /store/products`; its `sampleCatalog.ts` is a browse-only fallback with non-orderable ids. Migration `c3f1a9d2b8e4` loads a frozen
   copy of it; later edits go through `python -m app.services.catalog`. Both are idempotent: they insert or
   update descriptive fields, never reset stock and never delete (products not in the file are deactivated,
   because orders keep snapshots of what was bought). `seed_data.py` stays dev-only.
2. **Login throttling in the database**, not in process memory, so it survives restarts and works with
   more than one instance. Fixed 15-minute windows on three keys: email+IP (5), email (20), IP (50). Keys are
   HMAC-SHA256 of the email/IP with `SECRET_KEY`, so the table holds no personal data. The lock is checked
   before the password, and a success clears only the email+IP key. `TRUSTED_PROXY_HOPS` says how many
   `X-Forwarded-For` entries to trust; the default (0) ignores the header, because clients can forge it.
3. **Revocation by `users.token_version`**, copied into the JWT as `tv` and compared on every request.
   Logout and `POST /auth/password` increment it. Tokens without `tv` are rejected.

## Consequences

- Logout signs the user out on every device. Per-device sessions would need a session table (or a `jti`
  deny-list). Leave that until users ask for it.
- Every authenticated request already loads the user, so checking `tv` costs no extra query.
- The per-email limit lets someone lock a known email out for 15 minutes. This is accepted in exchange for
  stopping distributed guessing. Concurrent failures can race and exceed a limit by a few attempts.
- Changing `SECRET_KEY` resets all throttle keys (and invalidates all tokens, as before).
- Product sort order is by id, which is fine for `p1..p9` but needs a `sort_order` column at `p10`.
