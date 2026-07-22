# Deployment

WaferCMS is meant to run as containers: an admin UI for editors and an API for apps. TLS and the public edge stay **outside** the app images—pick an option below.

| Layout | Path | Use when |
| --- | --- | --- |
| **Private (default)** | [`../docker-compose.yml`](../docker-compose.yml) | Local bring-up or a private host. Admin/API published on the host; Postgres and RustFS stay on the Docker network only. |
| **Dev infra ports** | [`../docker-compose.dev.yml`](../docker-compose.dev.yml) | Need `psql` / S3 tooling against Postgres and RustFS from the host. |
| **HTTPS example** | [`expose-caddy/`](expose-caddy/) | Want a worked Caddy TLS setup for `cms.*` + `api.*` on the public internet. |

## Quick start

**Private stack** (repo root):

```bash
cp .env.example .env
# set POSTGRES_* and any secrets you care about locally
docker compose up -d
```

Admin: `http://localhost:8080` · API: `http://localhost:3001`

**Dev ports for Postgres / RustFS**:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**Internet-facing example (Caddy)**:

```bash
cp deploy/expose-caddy/.env.example deploy/expose-caddy/.env
# edit hostnames, HTTPS URLs, and strong secrets
docker compose -f docker-compose.yml -f deploy/expose-caddy/docker-compose.yml \
  --env-file deploy/expose-caddy/.env up -d
```

See [`expose-caddy/README.md`](expose-caddy/README.md) for hostname layout, bootstrap cleanup, and bring-your-own-proxy notes.

## Notes

- Published `cms-client` images take `CMS_API_BASE` (and optional AI flags) at **container start** via `/config.js` — no rebuild when the API URL changes. Local `pnpm dev` still uses `VITE_CMS_API_BASE`.
- Do not publish Postgres or RustFS on the public internet.
- Prefer same-site admin/API hostnames (`cms.example.com` / `api.example.com`) so session cookies can use `SameSite=Lax`.
