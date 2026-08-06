#!/bin/sh
# One-time (or per-schema-change) step after `docker compose up`: applies
# Prisma migrations to every Postgres-backed service's dedicated database.
# Mirrors the "Generate Prisma clients and apply migrations" step in
# .github/workflows/ci.yml. Not run automatically by any Dockerfile/CMD —
# migration is kept as an explicit, separate step so it isn't re-run (and
# racing itself) every time a container restarts or is scaled.
#
# Run from the repo root: sh scripts/migrate-all.sh
set -e

for dir in apps/auth-service apps/user-service apps/appointment-service apps/mood-tracking-service apps/admin-service apps/ai-integration-service apps/notification-service; do
  echo "==> $dir"
  (cd "$dir" && npx prisma generate && npx prisma migrate deploy)
done
