# ShelfLedger

**Retail inventory & GST billing ERP** — ledger-based stock, average costing, counter billing.

**Status:** Phase 3 complete (purchase + inventory + ledger). Next: Phase 4 sales/GST.

| | |
|--|--|
| Local web | http://127.0.0.1:3002 |
| Local DB | `127.0.0.1:5434` |
| Owner | `owner@shelfledger.local` / `ChangeMe!Owner1` |
| Cashier | `cashier@shelfledger.local` / `ChangeMe!Cashier1` |

## Quick start

```bash
cd /srv/ShelfLedger
docker compose up -d postgres
pnpm install
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

## Phase 1 audit fixes applied

- Next loads root `.env` via `next.config.ts` (apps/web had no `.env`)
- Category unique index fixed for `parent_id IS NULL` (COALESCE expression)
- AUTH_SECRET + AUTH_URL set for Auth.js
- Seed validates state code / password length; sets audit `createdBy` on org/branch/location
- Root `postinstall` runs Prisma generate; build script fixed

## Docs

[docs/memory.md](docs/memory.md) · [docs/phases.md](docs/phases.md)
