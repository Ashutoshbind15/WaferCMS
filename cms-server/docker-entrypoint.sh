#!/bin/sh
set -e

echo "Applying pending database migrations..."
pnpm --filter @packages/cms-db run migrate

echo "Starting CMS server..."
exec pnpm --filter cms-server start
