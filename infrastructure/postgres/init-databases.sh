#!/bin/sh
# Runs once via /docker-entrypoint-initdb.d on first init of an empty
# postgres_data volume. Creates one dedicated database per microservice —
# mirrors the "Create per-service databases" step in .github/workflows/ci.yml,
# which is the authoritative list of per-service databases this platform uses.
#
# NOTE: if postgres_data already has data from a previous run, this script
# will NOT execute (Postgres only runs initdb scripts against a fresh data
# directory). Run `docker compose down -v` first for a clean init, or create
# the databases manually with the same loop below via `docker exec`.
set -e

for db in mindora_auth mindora_user mindora_appointment mindora_mood mindora_admin mindora_ai mindora_notifications; do
  exists=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname = '$db'")
  if [ "$exists" != "1" ]; then
    psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db"
  fi
done
