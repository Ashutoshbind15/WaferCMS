FROM node:alpine3.24 AS build

RUN npm install -g pnpm@10.33.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY cms-client/package.json cms-client/
COPY packages/rich-text/package.json packages/rich-text/

RUN pnpm install --frozen-lockfile --filter cms-client...

COPY cms-client cms-client/
COPY packages/rich-text packages/rich-text/

ARG VITE_CMS_API_BASE=http://localhost:3001
ENV VITE_CMS_API_BASE=$VITE_CMS_API_BASE

RUN pnpm --filter @wafercms/rich-text build && pnpm --filter cms-client build

FROM caddy:2.11.4-alpine

RUN apk upgrade --no-cache

COPY cms-client/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/cms-client/dist /srv

EXPOSE 80
