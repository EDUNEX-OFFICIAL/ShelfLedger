# Implementation Phases — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27

Work proceeds **phase by phase**. Do not start the next phase until Definition of Done is met and stakeholder approves.

---

## Phase Map vs Execution Order

| Execution step | Phase |
|----------------|-------|
| Documentation + Cursor rules | **Phase 0** (this delivery) |
| Prisma + project scaffold + tooling | **Phase 1** |
| Auth + shell + masters + dashboard | **Phase 2** |
| Purchase + inventory + stock ledger | **Phase 3** |
| Sales + GST + customers + exchange | **Phase 4** |
| Expenses + staff + reports + settings | **Phase 5** |
| Hardening + Docker/Caddy deploy | **Phase 6** |
| Future: barcode, WhatsApp, etc. | **Phase 7+** |

---

## Phase 0 — Documentation & Guardrails

**Status:** Complete

### Deliverables
- All files under `docs/` listed in PRD request
- `.cursor/rules/*.mdc` split rules
- Root README pointing to docs

### Dependencies
- None

### Definition of Done
- [x] Docs cover PRD, architecture, DB, rules, design, API, security, deploy, testing
- [x] Architecture tradeoffs recorded; open questions listed
- [x] User reviews and approves before Phase 1 code

---

## Phase 1 — Project Setup, Database, Tooling

**Status:** Complete

### Deliverables
- pnpm workspace monorepo (`apps/web`, `packages/*`)
- TypeScript strict, ESLint, Prettier
- Prisma schema matching `database.md`
- Docker Compose for local Postgres (and/or shared DB role plan)
- Env example files (no secrets committed)
- Seed script: org, branch, location, owner, tax rates, walk-in customer
- Health route `GET /api/health`

### Dependencies
- Phase 0 approval

### Definition of Done
- [x] `pnpm install && pnpm db:migrate && pnpm db:seed` works
- [x] `pnpm dev` boots Next.js
- [x] Prisma schema reviewed against rules (no qty on variants)
- [x] PORT_REGISTRY / VPS notes drafted (no host port conflicts)

---

## Phase 2 — Auth, App Shell, Masters, Dashboard

**Status:** Complete

### Deliverables
- Session auth (login/logout)
- RBAC middleware/guards
- App shell (nav, page header)
- CRUD: Brands, Categories, Articles+Variants, Vendors (basic)
- Dashboard placeholders with real counts where easy
- Shared UI: Form patterns, ConfirmDialog (delete confirm)

### Dependencies
- Phase 1

### Definition of Done
- [x] Unauthenticated users redirected to login
- [x] OWNER can manage masters
- [x] CASHIER cannot access staff settings
- [x] No Prisma in React components

---

## Phase 3 — Purchase, Inventory, Stock Ledger

**Status:** Complete

### Deliverables
- Purchase draft → post
- Stock ledger listing + filters
- Inventory balances view
- Opening stock + adjustments
- Average cost updates verified by tests
- Purchase return (posted)

### Dependencies
- Phase 2 masters

### Definition of Done
- [x] Posting purchase increases balance and writes ledger in one transaction
- [x] Direct balance update impossible via public API (only via `applyStockMovement`)
- [x] Unit tests for avg cost formula
- [x] Integration test: post purchase → balance (`packages/db/prisma/test-purchase-post.ts`)

---

## Phase 4 — Sales, GST Billing, Customers, Exchange

### Deliverables
- Customer CRUD
- Sale draft → post with GST split
- Payments capture
- Invoice print view
- Stock decrement + COGS snapshot
- Exchange flow
- Invoice sequences

### Dependencies
- Phase 3 stock

### Definition of Done
- [ ] Sale blocked on insufficient stock (override path works)
- [ ] GST totals match line sums
- [ ] Exchange updates ledger both ways
- [ ] E2E happy path: purchase → sale → exchange

---

## Phase 5 — Expenses, Staff, Reports, Settings

### Deliverables
- Expenses CRUD
- Staff invite/create + roles
- Reports: sales, GST, stock valuation, low stock, purchases
- Settings: org profile, sequences, tax rates

### Dependencies
- Phase 4

### Definition of Done
- [ ] Report totals match fixture SQL checks
- [ ] Settings changes affect new invoices only
- [ ] Viewer role read-only enforced

---

## Phase 6 — Hardening & Deployment

### Deliverables
- Docker image + compose (`shelfledger_internal`, `vps_edge`)
- Caddy site snippet
- Shared Postgres role `shelfledger` / DB `shelfledger`
- Rate limiting on auth
- Backup/restore notes
- Security checklist pass
- Performance pass (indexes, pagination)

### Dependencies
- Phase 5 (or parallel harden after Phase 4 if early go-live)

### Definition of Done
- [ ] App reachable via Caddy hostname
- [ ] No 0.0.0.0 app port publish
- [ ] PORT_REGISTRY updated
- [ ] Smoke test on VPS

---

## Phase 7+ — Future Modules

Barcode scanning/printing, WhatsApp, Loyalty, Warehouse, Multi-branch UI, Accounting, Mobile API.

See [future-roadmap.md](./future-roadmap.md).

---

## Working Agreement (AI + Humans)

1. One phase at a time.  
2. Update `memory.md` at phase end.  
3. If blocked by open questions, ask before coding.  
4. Prefer correctness of stock/GST over UI polish when conflicted.  
5. No placeholder architecture — if incomplete, mark TODO in memory, don’t invent fake modules.
