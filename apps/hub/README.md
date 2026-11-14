# G-AI — Main website (hub)

Entry point for the G-AI ecosystem. It shows one card per product; clicking a product's logo card
opens that product's own website. Product logos lead to the brand site's home page (`homeUrl()` from `@g-ai/ui`), not here.

```bash
npm install          # from the repo root (npm workspaces)
npm run dev:hub      # http://localhost:3002
```

Add a product by appending to `PRODUCTS` in `src/app/page.tsx`. Product URLs come from
`NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL`.
