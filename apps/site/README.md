# G-AI — Brand site

Landing page and Movement Goods store. Deployed separately from the coaching app (`apps/web`);
both use the shared design package `packages/ui`.

```bash
npm install            # from the repo root (npm workspaces)
npm run dev:site       # http://localhost:3001
```

Links into the coaching app use `appUrl()` from `@g-ai/ui`, configured by `NEXT_PUBLIC_APP_URL`.
