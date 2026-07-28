# Backup & Restore — ShelfLedger

**Last Updated:** 2026-07-28

## Scope

Back up PostgreSQL database **`shelfledger`** on shared container **`edunex-postgres`**.  
App containers are rebuildable from git; the DB holds inventory ledger and invoices.

## Backup (logical dump)

```bash
# On VPS host (loopback publish of edunex-postgres)
mkdir -p /srv/backups/shelfledger
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
docker exec edunex-postgres \
  pg_dump -U edunex -d shelfledger --no-owner --no-acl \
  | gzip > "/srv/backups/shelfledger/shelfledger-${STAMP}.sql.gz"
```

Prefer a dedicated backup role if available; otherwise use ops superuser only for dumps.

Retention suggestion: keep daily dumps ≥ 14 days; weekly ≥ 8 weeks.

## Restore drill

```bash
# Stop writers (optional but safer)
docker compose -f /srv/ShelfLedger/docker-compose.yml \
  -f /srv/ShelfLedger/docker-compose.prod.yml stop web

# Recreate empty DB (destructive) — only for drill / disaster recovery
# docker exec -i edunex-postgres psql -U edunex -c 'DROP DATABASE IF EXISTS shelfledger;'
# docker exec -i edunex-postgres psql -U edunex -c 'CREATE DATABASE shelfledger OWNER shelfledger;'

gunzip -c /srv/backups/shelfledger/shelfledger-YYYYMMDDTHHMMSSZ.sql.gz \
  | docker exec -i edunex-postgres psql -U shelfledger -d shelfledger

# Re-apply migrations if dump is older than code
cd /srv/ShelfLedger && export DATABASE_URL="$(grep DATABASE_URL_HOST .env | cut -d= -f2- | tr -d '"')"
pnpm db:migrate:deploy

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d web
curl -fsS 'http://127.0.0.1:3002/api/health?deep=1'
```

## What not to back up as source of truth

- Docker image layers (rebuild from git)
- `node_modules`
- Committed secrets (there should be none)

## Checklist after restore

- [ ] `/api/health?deep=1` → database `up`
- [ ] Login as OWNER
- [ ] Spot-check one posted sale invoice + inventory balance for a known SKU
