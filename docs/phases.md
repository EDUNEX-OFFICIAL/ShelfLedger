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

**Status:** Complete

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
- [x] Sale blocked on insufficient stock (override path works)
- [x] GST totals match line sums
- [x] Exchange updates ledger both ways
- [x] E2E happy path: purchase → sale → exchange (`packages/db/prisma/test-sale-exchange.ts`)

---

## Phase 5 — Expenses, Staff, Reports, Settings

**Status:** Complete

### Deliverables
- Expenses CRUD
- Staff invite/create + roles
- Reports: sales, GST, stock valuation, low stock, purchases
- Settings: org profile, sequences, tax rates

### Dependencies
- Phase 4

### Definition of Done
- [x] Report totals match fixture SQL checks (`packages/db/prisma/test-phase5-reports.ts`)
- [x] Settings changes affect new invoices only
- [x] Viewer role read-only enforced

---

## Phase 6 — Hardening & Deployment

**Status:** Complete

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
- [x] App reachable via Caddy hostname network (`shelfledger-web:3000` on `vps_edge`) + loopback `127.0.0.1:3002`
- [x] No 0.0.0.0 app port publish
- [x] PORT_REGISTRY updated (`3002`, `5434`, shared DB notes)
- [x] Smoke test on VPS (`/api/health?deep=1`)

---

## Phase 6.1 — Quick Sale + Mobile-first counter UX

**Status:** Complete

### Deliverables
- `saleService.createAndPost` (+ `createAndPostSaleAction`)
- Mobile-first Quick Sale route `/sales/quick` (nav primary for cashiers)
- Walk-in / today / selling price / default tax / pay-in-full defaults
- Sticky “Punch sale” CTA → invoice; keep draft form for complex bills
- Touch-target / sticky-CTA pass on sale, exchange, purchase primary flows

### Dependencies
- Phase 4 sale service + Phase 6 deploy

### Definition of Done
- [x] Cashier can punch a walk-in paid sale in one action from a phone viewport
- [x] Stock/GST/invoice sequence invariants identical to draft→post
- [x] Draft sale form still available for overrides / partial pay
- [x] Docs ADR-012 / ADR-013 reflected in UI

---

## Phase 7+ — Future Modules

Barcode scanning/printing, WhatsApp, Loyalty, Warehouse, Multi-branch UI, Accounting, optional native mobile API.

See [future-roadmap.md](./future-roadmap.md) (Quick Sale is Phase **6.1**, ahead of barcode).

---

## Working Agreement (AI + Humans)

1. One phase at a time.  
2. Update `memory.md` at phase end.  
3. If blocked by open questions, ask before coding.  
4. Prefer correctness of stock/GST over UI polish when conflicted.  
5. No placeholder architecture — if incomplete, mark TODO in memory, don’t invent fake modules.
