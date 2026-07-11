# syntax=docker/dockerfile:1

FROM node:alpine3.24 AS build

RUN npm install -g pnpm@10.33.0 @quantco/pnpm-licenses@2.4.2

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY cms-client/package.json cms-client/
COPY packages/rich-text/package.json packages/rich-text/
COPY scripts/generate-third-party-notices.mjs scripts/

RUN pnpm install --frozen-lockfile --filter cms-client...

COPY cms-client cms-client/
COPY packages/rich-text packages/rich-text/

ARG VITE_CMS_API_BASE=http://localhost:3001
ENV VITE_CMS_API_BASE=$VITE_CMS_API_BASE

RUN pnpm --filter @wafercms/rich-text build && pnpm --filter cms-client build \
  && node scripts/generate-third-party-notices.mjs \
    --filter cms-client... \
    --component cms-client \
    --out /tmp/THIRD_PARTY_NOTICES

FROM caddy:2.11.4-alpine

LABEL org.opencontainers.image.title="WaferCMS Client" \
  org.opencontainers.image.description="WaferCMS admin UI" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.source="https://github.com/Ashutoshbind15/WaferCMS"

RUN apk upgrade --no-cache

COPY cms-client/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/cms-client/dist /srv
COPY LICENSE /licenses/LICENSE
COPY cms-client/LICENSE /licenses/cms-client.LICENSE
COPY packages/rich-text/LICENSE /licenses/rich-text.LICENSE
COPY --from=build /tmp/THIRD_PARTY_NOTICES /licenses/THIRD_PARTY_NOTICES

EXPOSE 80
