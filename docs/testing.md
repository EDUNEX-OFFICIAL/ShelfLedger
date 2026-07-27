# Testing Strategy — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27

---

## 1. Goals

Protect **inventory correctness**, **GST math**, and **core document posting**. UI snapshot tests are low priority.

---

## 2. Layers

### Unit (`packages/domain`)

- Average cost formula (normal, zero stock, inbound after zero)
- GST split CGST/SGST (V1); IGST helpers may exist but stay unused
- Discount distribution
- Invoice amount totals

Runner: Vitest.

### Integration (`packages/db` + services)

- Post purchase → ledger + balance + avg cost
- Post sale → stock down + unitCost snapshot
- Insufficient stock rejection
- Exchange in/out
- Sequence allocation concurrency (two parallel posts)

Use test Postgres (Docker) or transactional rollback pattern.

### E2E (`apps/web`)

Playwright flows:

1. Login  
2. Create article + variant  
3. Purchase post  
4. Sale post  
5. Exchange  
6. Assert ledger rows / invoice print page  

---

## 3. What Not to Over-Test

- shadcn primitives
- Trivial getters
- Prisma itself

---

## 4. CI (Phase 6+)

```
pnpm lint → pnpm test:unit → pnpm test:integration → pnpm build
```

E2E nightly or on main.

---

## 5. Fixtures

Deterministic seed for tests separate from demo seed. Money/qty as decimals strings where needed to avoid float drift.
