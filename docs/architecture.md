# Architecture — ShelfLedger

**Version:** 1.0.0  
**Status:** Approved for Phase 1 review  
**Last Updated:** 2026-07-27

---

## 1. Architecture Decisions (ADRs summary)

### ADR-001: Next.js App Router monolith (modular)

**Decision:** One Next.js app (`apps/web`) with Route Handlers + Server Actions; Prisma in `packages/db`; Zod/domain types in `packages/validators` and `packages/domain`.

**Why:** Internal ERP, single deployable, team size small. Separate Nest/API would add latency and ops cost without benefit at V1.

**Tradeoff:** Heavy compute jobs later may need workers; design services so they can move to a worker process without UI coupling.

### ADR-002: Stock Ledger as source of truth + transactional balances

**Decision:** Never store “editable quantity” on Article/Variant. Persist immutable `stock_ledger` rows. Maintain `inventory_balance` rows updated **in the same DB transaction** as ledger inserts.

**Why:** Pure `SUM(ledger)` on every bill is correct but slow under load. Materialized balances with ledger as audit/source keep correctness + speed (same pattern as mature inventory systems).

**Invariant:** Balance must always equal sum of ledger quantities for that variant+location. Enforced by service + periodic reconciliation job (Phase 4+).

### ADR-003: Multi-branch ready, single-branch runtime (V1)

**Decision:** Tables include `organizationId` and `branchId` / `locationId` from day one. V1 seeds one org + one branch. UI does not expose branch switcher until multi-branch phase.

**Why:** Adding tenant columns later forces painful migrations and query rewrites.

### ADR-004: Session cookies over JWT-in-browser

**Decision:** Auth.js (Auth.js v5) or Lucia-equivalent with **httpOnly secure cookies**, CSRF protection. Prefer Auth.js Credentials + database session/JWT strategy with cookie.

**Why:** Internal staff app; cookie sessions reduce XSS token theft vs localStorage JWT.

### ADR-005: Feature-first folders inside the app

**Decision:** `apps/web/src/features/<module>/` owns UI, hooks, and feature-specific actions. Shared cross-cutting code in `components/`, `lib/`, packages.

### ADR-006: Repository + Service layers

**Decision:**

```
UI / Server Action / Route Handler
        ↓
   Application Service (use-cases, transactions, rules)
        ↓
   Repository (Prisma only)
        ↓
   PostgreSQL
```

UI never imports Prisma. Services never return raw Prisma types to clients without mapping to DTOs.

### ADR-007: Soft delete everywhere; no hard delete of financial/inventory docs

**Decision:** `deletedAt` on all domain tables. Posted purchases/sales/ledger: cancel/void via **reversing entries**, not delete.

### ADR-008: Average (weighted) costing

**Decision:** Per variant (+ location):

```
newAvg = (oldQty * oldAvg + inQty * inRate) / (oldQty + inQty)
```

Sales use current avg cost for COGS snapshot on line (store `unitCost` at sale time).

### ADR-009: VPS deployment alignment

**Decision:** Project path `/srv/ShelfLedger`, private Docker network `shelfledger_internal`, web joins `vps_edge` only, dedicated Postgres role/DB `shelfledger` on shared `edunex-postgres` (`postgres_shared`). Caddy: `shelfledger.edunexservices.in`. No public 0.0.0.0 app ports. See [deployment.md](./deployment.md).

### ADR-010: V1 GST same-state only

**Decision:** Billing uses **CGST + SGST** only. IGST columns may exist (zeroed) for forward-compat; no inter-state tax UI in V1.

### ADR-011: Generic product brand

**Decision:** Product name **ShelfLedger** (pitchable to any retailer). Footwear is the first vertical template, not the product brand.

---

## 2. High-Level Diagram

```
┌─────────────┐     HTTPS      ┌──────────────┐
│  Browser    │ ──────────────▶│ Caddy (edge) │
└─────────────┘                └──────┬───────┘
                                      │ vps_edge
                               ┌──────▼───────┐
                               │  apps/web    │
                               │  Next.js     │
                               └──────┬───────┘
                    shelfledger_internal │
                               ┌──────▼───────┐
                               │  PostgreSQL  │
                               │ (shared/dev) │
                               └──────────────┘
```

---

## 3. Folder Structure (target)

```
ShelfLedger/
├── apps/
│   └── web/                 # Next.js App Router
├── packages/
│   ├── db/                  # Prisma schema, client, migrations
│   ├── domain/              # Pure business logic, costing, GST calc
│   ├── validators/          # Zod schemas shared FE/BE
│   ├── errors/              # Typed error classes + codes
│   └── tsconfig/            # Shared TS configs
├── docs/                    # This documentation set
├── docker/                  # Dockerfiles, compose overlays
├── scripts/                 # Dev/ops scripts
├── .cursor/rules/           # Cursor agent rules
├── prisma/                  # Optional root re-export; prefer packages/db
└── package.json             # pnpm workspace root
```

Detailed tree: [folder-structure.md](./folder-structure.md).

---

## 4. Data Flow

### Read path
1. Server Component or TanStack Query calls Server Action / Route Handler  
2. Auth middleware resolves session + permissions  
3. Service loads via repository (filters `deletedAt: null`)  
4. Map to DTO → UI  

### Write path (example: Post Purchase)
1. Client submits validated form (RHF + Zod)  
2. Server Action re-validates with same Zod schema  
3. `PurchaseService.post()` opens Prisma `$transaction`  
4. Insert purchase header/lines (status POSTED)  
5. For each line: insert ledger IN; upsert balance; recompute avg cost  
6. Commit; invalidate query keys  
7. On rule violation → typed `BusinessError`; rollback  

---

## 5. Component Hierarchy

```
app/(auth)/login
app/(app)/layout          # shell: nav, header, session gate
  ├── dashboard
  ├── purchases/
  ├── sales/
  ├── inventory/
  ├── masters/ (brands, categories, articles, vendors, customers)
  ├── expenses/
  ├── staff/
  ├── reports/
  └── settings/
```

Feature components: `features/sales/components/SaleForm.tsx` etc.  
Primitives: `components/ui/*` (shadcn).

---

## 6. Server Actions vs Route Handlers

| Use | When |
|-----|------|
| **Server Actions** | First-party mutations & queries from this UI (forms, tables) |
| **Route Handlers** | External webhooks, future mobile API, file download streams, health checks |

Both call the **same services**. Never duplicate business logic.

API envelope for Route Handlers: see [api.md](./api.md).

---

## 7. Repository Pattern

- One repository per aggregate root (e.g. `PurchaseRepository`, `StockLedgerRepository`)
- Repositories accept Prisma transaction client `tx` for composability
- No business rules inside repositories (only persistence queries)

---

## 8. Service Layer

- Application services orchestrate use-cases
- Domain helpers in `packages/domain` (pure functions: GST split, avg cost)
- Services own authorization checks for sensitive ops (or dedicated Policy layer)

---

## 9. Validation Layer

- Zod schemas in `packages/validators`
- Shared between client forms and server
- Parse at boundary; services receive typed domain inputs

---

## 10. Error Handling

Typed hierarchy (see packages/errors):

| Type | HTTP | Example |
|------|------|---------|
| `ValidationError` | 400 | Zod flatten |
| `UnauthorizedError` | 401 | No session |
| `ForbiddenError` | 403 | Role |
| `NotFoundError` | 404 | Missing entity |
| `BusinessRuleError` | 422 | Insufficient stock |
| `ConflictError` | 409 | Duplicate invoice no |
| `InternalError` | 500 | Unexpected |

Central mapper: log + safe client message. Never leak stack traces.

---

## 11. Logging

- Structured JSON logs (`level`, `msg`, `requestId`, `userId`, `module`)
- No PII in logs beyond user id / invoice ids
- Purchase/sale post events logged at `info`

---

## 12. Caching Strategy

| Layer | Strategy |
|-------|----------|
| TanStack Query | Client cache for lists; invalidate on mutation |
| Next.js | Prefer dynamic for authenticated ERP pages (`force-dynamic` or no static) |
| Redis | **Not required V1**; add later for sessions/rate-limit if needed |
| DB | Indexes + balance table; avoid caching stock without invalidation |

---

## 13. Security

See [security.md](./security.md). Highlights: validate all input, AuthN→AuthZ, CSRF, rate-limit login, Prisma parameterized queries, least-privilege DB role.

---

## 14. Deployment

Docker multi-stage Next.js image; Compose with `shelfledger_internal` + `vps_edge` (web only). Shared Postgres role `shelfledger` / DB `shelfledger`. Caddy reverse proxy. Details: [deployment.md](./deployment.md).

---

## 15. Scaling Strategy

| Stage | Approach |
|-------|----------|
| V1 | Single Next.js container + shared Postgres |
| Growth | Separate read replicas only if needed; connection pooling (PgBouncer) |
| Heavy reports | Async report jobs + object storage for exports |
| Multi-branch | Same app; branch-scoped queries; optional branch-local caches |

Do not split microservices until a clear bottleneck or team boundary exists.

---

## 16. Future Multi-Branch Support

- `branches` / `locations` tables exist from V1  
- Inventory balances keyed by `(variantId, locationId)`  
- Document headers carry `branchId`  
- Transfer ledger type `TRANSFER_OUT` / `TRANSFER_IN` reserved  
- UI branch context in session when feature flag enabled  

---

## 17. Explicit Non-Overengineering

- No event bus / Kafka in V1  
- No CQRS/Event Sourcing beyond ledger immutability  
- No GraphQL  
- No separate BFF  

If requirements conflict with simplicity, prefer the simpler correct design and document the debt in [memory.md](./memory.md).
