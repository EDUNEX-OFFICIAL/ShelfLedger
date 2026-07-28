# Security Checklist — ShelfLedger (Phase 6)

**Date:** 2026-07-28  
**Status:** Pass for V1 go-live hardening

| # | Check | Status | Notes |
|---|--------|--------|-------|
| 1 | Zod validation on Server Actions | Pass | validators package |
| 2 | No Prisma in client components | Pass | architecture |
| 3 | Auth before authz | Pass | guards + middleware |
| 4 | VIEWER read-only | Pass | `isReadOnly` + write guards |
| 5 | Non-superuser DB role in `DATABASE_URL` | Pass | role `shelfledger` |
| 6 | No `0.0.0.0` app publish | Pass | `127.0.0.1:3002` only |
| 7 | HttpOnly session cookies | Pass | Auth.js |
| 8 | Login rate limit | Pass | IP 5/min + email 5/min |
| 9 | Deactivated users blocked | Pass | `findActiveByEmail` + JWT re-check |
| 10 | Soft delete financial rows | Pass | no hard delete paths |
| 11 | Stock only via `applyStockMovement` | Pass | |
| 12 | No IGST billing in V1 | Pass | |
| 13 | Secrets not in git | Pass | `.env` gitignored |
| 14 | Caddy security headers | Pass | HSTS, nosniff, DENY frame |
| 15 | Healthcheck without leaking stacks | Pass | `/api/health` |
| 16 | Last OWNER protected | Pass | staff update guard |

Open / follow-ups (non-blocking): CSP report-only, Redis rate limit for multi-replica, Argon2id password hash migration.
