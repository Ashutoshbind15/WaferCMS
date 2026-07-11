# syntax=docker/dockerfile:1

FROM node:alpine3.24

LABEL org.opencontainers.image.title="WaferCMS Server" \
  org.opencontainers.image.description="WaferCMS API server" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.source="https://github.com/Ashutoshbind15/WaferCMS"

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
COPY LICENSE /licenses/LICENSE
COPY cms-server/LICENSE /licenses/cms-server.LICENSE
COPY packages/cms-db/LICENSE /licenses/cms-db.LICENSE
COPY packages/storage/LICENSE /licenses/storage.LICENSE

RUN pnpm --filter @packages/cms-db --filter @packages/storage --filter cms-server run build \
  && chmod +x cms-server/docker-entrypoint.sh \
  && node scripts/generate-third-party-notices.mjs \
    --filter cms-server... \
    --component cms-server \
    --out /licenses/THIRD_PARTY_NOTICES

EXPOSE 3001

ENTRYPOINT ["cms-server/docker-entrypoint.sh"]
