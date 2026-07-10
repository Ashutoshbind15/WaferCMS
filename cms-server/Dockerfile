FROM node:alpine3.24

RUN apk add --no-cache vips \
  && npm install -g pnpm@10.33.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY cms-server/package.json cms-server/
COPY packages/cms-db/package.json packages/cms-db/
COPY packages/storage/package.json packages/storage/

RUN pnpm install --frozen-lockfile --filter cms-server...

COPY cms-server cms-server/
COPY packages/cms-db packages/cms-db/
COPY packages/storage packages/storage/

RUN pnpm --filter @packages/cms-db --filter @packages/storage --filter cms-server run build \
  && chmod +x cms-server/docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["cms-server/docker-entrypoint.sh"]
