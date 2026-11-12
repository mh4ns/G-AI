# Builds one Next.js app from the npm-workspaces monorepo.
# Usage: docker build -f docker/next-app.Dockerfile --build-arg APP=web .   (context = repo root)
ARG APP=web

FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/
COPY apps/site/package.json apps/site/
COPY apps/hub/package.json apps/hub/
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
ARG APP
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Rewrites and NEXT_PUBLIC_* values are resolved at build time.
ARG BACKEND_URL=http://backend:8000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3001
ARG NEXT_PUBLIC_HUB_URL=http://localhost:3002
ENV BACKEND_URL=$BACKEND_URL NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_HUB_URL=$NEXT_PUBLIC_HUB_URL
RUN npm run build -w apps/${APP}

FROM node:20-alpine AS runtime
ARG APP
WORKDIR /repo
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 APP=${APP}
COPY --from=build /repo /repo
# Private storage for generated prediction images (never under public/).
RUN mkdir -p /repo/apps/${APP}/.data && chown -R node:node /repo/apps/${APP}/.data
USER node
WORKDIR /repo/apps/${APP}
CMD ["sh", "-c", "npm run start"]
