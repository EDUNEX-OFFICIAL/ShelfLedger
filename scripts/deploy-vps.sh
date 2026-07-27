#!/usr/bin/env bash
# Build + recreate ShelfLedger web on this VPS.
# Usage: bash scripts/deploy-vps.sh
# Requires: /srv/ShelfLedger/.env with production DATABASE_URL (shelfledger role on edunex-postgres).
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo latest)"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

if [ ! -f "$REPO/.env" ]; then
  echo "error: missing $REPO/.env — copy from .env.example and set production values" >&2
  exit 1
fi

for net in vps_edge postgres_shared; do
  if ! docker network inspect "$net" >/dev/null 2>&1; then
    echo "error: external docker network '$net' missing" >&2
    exit 1
  fi
done

echo "==> build shelfledger-web @ ${GIT_COMMIT}"
"${COMPOSE[@]}" build web

echo "==> up shelfledger-web"
"${COMPOSE[@]}" up -d --remove-orphans --force-recreate web

echo "==> prisma migrate deploy"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "error: pnpm required on VPS for migrations" >&2
  exit 1
fi
# Host-side Prisma needs 127.0.0.1 (Docker service hostname only works inside containers).
export DATABASE_URL="$(
  node -e "
    const fs=require('fs');
    const t=fs.readFileSync('.env','utf8');
    let host='', docker='';
    for (const line of t.split(/\\r?\\n/)) {
      let m=line.match(/^DATABASE_URL_HOST=(.*)$/);
      if (m) {
        let v=m[1].trim();
        if ((v.startsWith('\"') && v.endsWith('\"')) || (v.startsWith(\"'\") && v.endsWith(\"'\"))) v=v.slice(1,-1);
        host=v; continue;
      }
      m=line.match(/^DATABASE_URL=(.*)$/);
      if (m) {
        let v=m[1].trim();
        if ((v.startsWith('\"') && v.endsWith('\"')) || (v.startsWith(\"'\") && v.endsWith(\"'\"))) v=v.slice(1,-1);
        docker=v;
      }
    }
    const url = host || docker.replace('@edunex-postgres:', '@127.0.0.1:');
    process.stdout.write(url);
  "
)"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: DATABASE_URL / DATABASE_URL_HOST missing in .env" >&2
  exit 1
fi
pnpm install --frozen-lockfile
pnpm db:migrate:deploy

echo "==> health check (deep)"
ok=0
for _ in $(seq 1 40); do
  if curl -fsS 'http://127.0.0.1:3002/api/health?deep=1' >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done
if [ "$ok" != "1" ]; then
  echo "error: health check failed on http://127.0.0.1:3002/api/health?deep=1" >&2
  "${COMPOSE[@]}" ps
  docker logs shelfledger-web --tail 80 || true
  exit 1
fi

curl -fsS 'http://127.0.0.1:3002/api/health?deep=1'
echo
"${COMPOSE[@]}" ps
echo "==> deploy ok"
