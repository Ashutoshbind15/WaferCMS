# syntax=docker/dockerfile:1

FROM node:alpine3.24 AS build

RUN npm install -g pnpm@10.33.0 @quantco/pnpm-licenses@2.4.2

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY cms-server/package.json cms-server/
COPY packages/cms-db/package.json packages/cms-db/
COPY packages/storage/package.json packages/storage/
COPY scripts/generate-third-party-notices.mjs scripts/

RUN pnpm install --frozen-lockfile --filter cms-server...

COPY cms-server cms-server/
COPY packages/cms-db packages/cms-db/
COPY packages/storage packages/storage/

RUN pnpm --filter @packages/cms-db --filter @packages/storage --filter cms-server run build \
  && node scripts/generate-third-party-notices.mjs \
    --filter cms-server... \
    --component cms-server \
    --out /tmp/THIRD_PARTY_NOTICES

FROM node:alpine3.24

ARG VERSION=1.0.0
ARG REVISION=unknown
LABEL org.opencontainers.image.title="WaferCMS Server" \
  org.opencontainers.image.description="WaferCMS API server" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.source="https://github.com/Ashutoshbind15/WaferCMS" \
  org.opencontainers.image.url="https://github.com/Ashutoshbind15/WaferCMS" \
  org.opencontainers.image.documentation="https://github.com/Ashutoshbind15/WaferCMS" \
  org.opencontainers.image.vendor="WaferCMS" \
  org.opencontainers.image.version="${VERSION}" \
  org.opencontainers.image.revision="${REVISION}" \
  org.opencontainers.image.base.name="docker.io/library/node:alpine3.24"

RUN npm install -g pnpm@10.33.0 \
  && apk upgrade --no-cache

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY cms-server/package.json cms-server/
COPY packages/cms-db/package.json packages/cms-db/
COPY packages/storage/package.json packages/storage/

RUN pnpm install --frozen-lockfile --prod --filter cms-server...

COPY --from=build /app/cms-server/dist cms-server/dist/
COPY cms-server/docker-entrypoint.sh cms-server/docker-entrypoint.sh
COPY --from=build /app/packages/cms-db/dist packages/cms-db/dist/
COPY --from=build /app/packages/cms-db/drizzle packages/cms-db/drizzle/
COPY --from=build /app/packages/storage/dist packages/storage/dist/

COPY LICENSE /licenses/LICENSE
COPY cms-server/LICENSE /licenses/cms-server.LICENSE
COPY packages/cms-db/LICENSE /licenses/cms-db.LICENSE
COPY packages/storage/LICENSE /licenses/storage.LICENSE
COPY --from=build /tmp/THIRD_PARTY_NOTICES /licenses/THIRD_PARTY_NOTICES

RUN chmod +x cms-server/docker-entrypoint.sh

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/ready').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["cms-server/docker-entrypoint.sh"]
