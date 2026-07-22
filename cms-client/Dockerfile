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
ARG VITE_CMS_AI_DRAFTS_ENABLED=false
ENV VITE_CMS_AI_DRAFTS_ENABLED=$VITE_CMS_AI_DRAFTS_ENABLED

RUN pnpm --filter @wafercms/rich-text build && pnpm --filter cms-client build \
  && node scripts/generate-third-party-notices.mjs \
    --filter cms-client... \
    --component cms-client \
    --out /tmp/THIRD_PARTY_NOTICES

FROM caddy:2.11.4-alpine

# Override inherited Caddy OCI labels so GHCR metadata describes this image.
# base.name records the upstream base.
ARG VERSION=1.0.0
ARG REVISION=unknown
LABEL org.opencontainers.image.title="WaferCMS Client" \
  org.opencontainers.image.description="WaferCMS admin UI" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.source="https://github.com/Ashutoshbind15/WaferCMS" \
  org.opencontainers.image.url="https://github.com/Ashutoshbind15/WaferCMS" \
  org.opencontainers.image.documentation="https://github.com/Ashutoshbind15/WaferCMS" \
  org.opencontainers.image.vendor="WaferCMS" \
  org.opencontainers.image.version="${VERSION}" \
  org.opencontainers.image.revision="${REVISION}" \
  org.opencontainers.image.base.name="docker.io/library/caddy:2.11.4-alpine"

RUN apk upgrade --no-cache

COPY cms-client/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/cms-client/dist /srv
COPY LICENSE /licenses/LICENSE
COPY cms-client/LICENSE /licenses/cms-client.LICENSE
COPY packages/rich-text/LICENSE /licenses/rich-text.LICENSE
COPY --from=build /tmp/THIRD_PARTY_NOTICES /licenses/THIRD_PARTY_NOTICES

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1
