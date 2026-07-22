# Expose with Caddy (TLS example)

Optional reverse-proxy overlay that terminates HTTPS for the admin UI and API, keeps Postgres/RustFS on the Docker network only, and unpublishes the app host ports.

This is an **example**. Any TLS terminator that forwards `X-Forwarded-*` works when the API runs with `CMS_TRUST_PROXY=true` (this overlay sets that).

## Hostname layout

Use the same registrable site so cookies stay `SameSite=Lax`:

| Host | Service |
| --- | --- |
| `cms.example.com` | Admin SPA (`cms-client`) |
| `api.example.com` | API (`cms-server`) |

Point both DNS names at the host running Caddy (ports 80/443).

## Setup

From the repo root:

```bash
cp deploy/expose-caddy/.env.example deploy/expose-caddy/.env
# Edit .env: secrets, hostnames, HTTPS URLs, strong RUSTFS_* credentials
```

Start the stack (pull or build images once; changing `CMS_API_BASE` only needs a container recreate):

```bash
docker compose -f docker-compose.yml -f deploy/expose-caddy/docker-compose.yml \
  --env-file deploy/expose-caddy/.env up -d
```

Set `CMS_API_BASE=https://api.example.com` so the admin UI talks to the public API origin. The client entrypoint writes that into `/config.js` on start.

After the first admin exists, remove `CMS_BOOTSTRAP_ADMIN_*` from `.env` and recreate `cms-server`.

## What this overlay changes

- Publishes only Caddy `80` / `443` (HTTP→HTTPS and ACME via Caddy defaults)
- Clears published ports on `cms-server` and `cms-client` (`ports: !override []`)
- Forces production cookie/TLS-related settings and requires strong secrets / RustFS keys
- Disables the RustFS console by default

Postgres and RustFS stay unpublished (same as the base compose).

## Bring your own edge

Skip this directory and put your own proxy in front of `cms-client:80` and `cms-server:3001` on the Compose network (or published ports from the base file for a different topology). Set:

- On the API: `CMS_TRUST_PROXY=true`, `COOKIE_SECURE=true`, HTTPS `CMS_PUBLIC_BASE_URL` / `CORS_ORIGIN`
- On the admin container: `CMS_API_BASE` to the browser-reachable API origin
