#!/bin/sh
set -e

echo "Applying database schema..."
pnpm --filter @packages/cms-db exec drizzle-kit push --force

echo "Starting CMS server..."
exec pnpm --filter cms-server start
