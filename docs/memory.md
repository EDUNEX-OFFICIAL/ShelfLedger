# AI Memory — ShelfLedger

**Current Phase:** Phase 3 complete — ready for Phase 4 (Sales + GST + Exchange)  
**Path:** `/srv/ShelfLedger`  
**Last Updated:** 2026-07-27

## Completed

- Phase 0–1: docs, monorepo, Prisma, seed, health
- Phase 1 fixes: env loading, category NULL unique, AUTH_SECRET, seed audits
- Phase 2: Auth.js, shell, masters CRUD, RBAC staff gate
- Phase 2 fix: DeleteButton `action` prop on brands/articles/vendors
- Phase 3: `applyStockMovement` (ledger+balance same TX), purchase draft/post/return, opening/adjustments, inventory + stock-ledger UI
- Integration test PASS: purchase → qty/avg/ledger; `article_variants` has no `quantity` column

## Seed users

| Email | Role | Password |
|-------|------|----------|
| owner@shelfledger.local | OWNER | ChangeMe!Owner1 |
| cashier@shelfledger.local | CASHIER | ChangeMe!Cashier1 |

## Inventory invariants

1. Only `applyStockMovement` mutates balances
2. Purchase inbound updates weighted avg; purchase return keeps avg
3. Outbound snapshots avg as unitCost; never edits qty on variants

## Pending

- Phase 4: Sales, GST billing, customers, exchange
- Phase 5–6: expenses/staff/reports + deploy

## Never Forget

- Middleware uses `auth.config.ts` (no bcrypt on Edge)
- No Prisma in client components
- No IGST in V1
- No `0.0.0.0` app ports
