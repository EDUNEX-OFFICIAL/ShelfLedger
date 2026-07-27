#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose up -d postgres
echo "Waiting for Postgres on 127.0.0.1:5434..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U shelfledger -d shelfledger >/dev/null 2>&1; then
    echo "Postgres ready."
    exit 0
  fi
  sleep 1
done
echo "Postgres did not become ready in time" >&2
exit 1
