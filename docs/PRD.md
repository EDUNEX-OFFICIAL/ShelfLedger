# Product Requirements Document — ShelfLedger

**Version:** 1.1.0  
**Status:** Phase 0 approved decisions locked — ready for Phase 1 scaffold  
**Last Updated:** 2026-07-27  
**Owner:** Product + Engineering  
**Product:** ShelfLedger (generic retail ERP brand)  
**First vertical:** Footwear (size × color variants)

---

## 1. Executive Summary

**ShelfLedger** is a production-grade **inventory management and GST billing** platform for retail shops. It is an **internal business management application** (not ecommerce), named so it can be pitched to any retailer—not locked to one category.

The first production vertical is **footwear** (articles with size × color variants). The architecture stays category-agnostic so apparel and general retail can reuse the same core.

V1 targets a **single shop** with purchase → stock → sale → GST invoice (CGST+SGST). Multi-branch and broader ERP modules can follow without rewriting the core.

Inventory never stores quantity as a mutable field on products. **Stock Ledger** is the source of truth; balances are maintained transactionally. Costing uses **weighted average cost**.

---

## 2. Business Problem

Retailers (especially variant-heavy categories like footwear) typically run on:

- Spreadsheets or generic billing software that handle variants poorly
- Direct “stock quantity” edits that destroy auditability
- Weak GST invoice correctness and poor purchase–sale cost linkage
- No reliable exchange / return stock trail

This causes stock mismatches, GST risk, and opaque margins.

**ShelfLedger** solves this with ledger-based inventory, variant SKUs, same-state GST billing (CGST+SGST), and clear purchase/sale/exchange workflows.

---

## 3. Goals

| ID | Goal |
|----|------|
| G1 | Accurate, auditable inventory via stock ledger |
| G2 | GST-compliant sales invoices (India) for retail (footwear-first) |
| G3 | End-to-end purchase → stock → sale → reports loop |
| G4 | Fast counter UX for billing and exchanges |
| G5 | Architecture ready for multi-branch without rewrite |
| G6 | Maintainable codebase with clear domain boundaries |
| G7 | Deployable on Hostinger VPS (Docker + Caddy) |

---

## 4. Non Goals (V1)

- Ecommerce storefront / customer self-checkout
- Online payments gateway as primary flow
- Full accounting (ledger books, P&L, balance sheet) — deferred
- Multi-company / multi-tenant SaaS in V1 (single org; multi-branch schema-ready)
- Mobile native apps
- Barcode hardware integration (schema hooks only)
- WhatsApp automation
- Loyalty program
- Warehouse WMS complexity (single location first)
- Marketplace integrations

---

## 5. Target Users

| Persona | Needs |
|---------|--------|
| Shop Owner | Dashboard, margins, expenses, staff oversight, settings |
| Billing Counter Staff | Fast sales, GST invoice, exchange, customer lookup |
| Store Manager | Purchases, stock adjustments, vendors, reports |
| Accountant (light) | GST summaries, expense lists, invoice reprints |

Roles (V1): `OWNER`, `MANAGER`, `CASHIER`, `VIEWER`

---

## 6. Core Modules (V1)

1. Dashboard  
2. Purchase Management  
3. Vendors  
4. Brands  
5. Categories  
6. Articles (with variants: size × color)  
7. Inventory (balances view)  
8. Stock Ledger  
9. Sales / GST Billing  
10. Exchange  
11. Customers  
12. Expenses  
13. Staff  
14. Reports  
15. Settings  

---

## 7. Feature List

### 7.1 Authentication & Access
- Secure session-cookie auth
- Role-based access control (RBAC)
- Password reset (owner-initiated / admin)

### 7.2 Master Data
- Brands, Categories (tree optional; flat + parentId OK)
- Articles with HSN, brand, category, description
- Variants: size, color, SKU, barcode (nullable until Phase 5)
- Vendors with GSTIN, address, payment terms
- Customers with phone, GSTIN (B2B), credit optional later

### 7.3 Purchase
- Purchase invoice entry (vendor, date, lines)
- Line: variant, qty, rate, discount, tax
- On post: stock IN + ledger + update average cost
- Purchase return (posted) creates stock OUT + reverse cost impact

### 7.4 Inventory & Ledger
- Opening stock entry
- Adjustments (damage, lost, found, recount)
- Stock ledger immutable (no hard delete)
- Balance query / materialized balance table

### 7.5 Sales & GST
- Counter sale with multiple lines
- Discounts (line + bill)
- **CGST + SGST only (same-state)** in V1 — no IGST flow
- Invoice number sequences
- Printable / PDF-ready invoice layout
- Payments: cash, UPI, card, mixed (record method; no gateway required)

### 7.6 Exchange
- Return against original sale (or open return with reason)
- Optional replacement sale in same flow
- Stock IN for return + OUT for replacement via ledger

### 7.7 Expenses
- Expense categories, amount, payment mode, date, notes
- Soft delete; never affect inventory

### 7.8 Staff
- User accounts, roles, active/inactive
- Optional attendance later (out of V1 scope)

### 7.9 Reports
- Sales summary (day/period)
- GST summary (taxable, CGST, SGST; IGST N/A in V1)
- Stock valuation (avg cost × qty)
- Purchase summary
- Low stock (threshold per variant or global)
- Profit estimate (sale − avg cost COGS) — clearly labeled as estimate

### 7.10 Settings
- Organization profile, GSTIN, address, state code
- Invoice prefix / series
- Tax rates / HSN defaults
- Financial year
- Single default branch/location (V1)

---

## 8. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | System SHALL never update stock quantity except via ledger-posting services |
| FR-02 | Every stock movement SHALL create ≥1 stock_ledger entry |
| FR-03 | Posted financial/inventory documents SHALL not be hard-deleted |
| FR-04 | Average cost SHALL update on purchase (and opening) per variant |
| FR-05 | Sale SHALL fail if available stock &lt; requested qty (unless override role + reason) |
| FR-06 | GST breakup SHALL be stored on invoice lines and headers |
| FR-07 | Soft delete via `deletedAt`; queries default to non-deleted |
| FR-08 | Audit fields: `createdAt`, `updatedAt`, `createdBy`, `updatedBy` where applicable |
| FR-09 | All mutations SHALL validate with Zod on the server |
| FR-10 | UI SHALL never call Prisma; only services/repositories |
| FR-11 | Invoice numbers SHALL be unique per series/branch/FY |
| FR-12 | Exchange SHALL keep return and replacement linked in one exchange document |

---

## 9. Non Functional Requirements

| Area | Requirement |
|------|-------------|
| Performance | Counter sale create &lt; 500ms p95 on VPS for typical carts (≤20 lines) |
| Availability | Single-node Docker; graceful DB errors |
| Security | AuthN before AuthZ; CSRF for cookie sessions; rate limit login |
| Accessibility | WCAG AA for primary flows |
| Maintainability | Feature modules; services; typed errors |
| Observability | Structured logs; request correlation id |
| Backup | Postgres backups via shared VPS ops (documented) |
| Browser | Last 2 Chrome/Edge/Firefox; Safari recent |

---

## 10. Acceptance Criteria (V1)

- [ ] Owner can log in and reach dashboard
- [ ] Can create brand, category, article + variants
- [ ] Can create vendor and post purchase → stock increases; ledger rows exist
- [ ] Average cost updates correctly after purchases
- [ ] Can create customer and post GST sale → stock decreases; invoice printable
- [ ] Exchange return+replace updates ledger correctly
- [ ] Soft-deleted masters hidden from pickers; historical docs remain readable
- [ ] Reports: sales, GST, stock valuation return correct totals for fixture data
- [ ] Docker Compose boots app against Postgres; Caddy path documented
- [ ] Docs and `.cursor/rules` match implementation

---

## 11. Success Metrics

| Metric | Target (first 30 days live) |
|--------|------------------------------|
| Stock adjustment frequency | Decreasing vs week 1 (trust in system) |
| Invoice time (staff) | &lt; 2 minutes typical bill |
| Stock variance at month end | &lt; 2% of SKUs needing recount |
| Critical bugs (stock wrong sign) | Zero |
| GST invoice reprint success | 100% for posted invoices |

---

## 12. Future Scope

See [future-roadmap.md](./future-roadmap.md): Barcode, WhatsApp, Loyalty, Warehouse, Multi-branch UI, Accounting, Mobile.

---

## 13. Decisions Locked / Remaining

| Topic | Status |
|-------|--------|
| GST V1 = CGST+SGST same-state only | **Locked** |
| Shared `edunex-postgres`, DB/role `shelfledger` | **Locked** |
| Hostname `shelfledger.edunexservices.in` | **Locked** (DNS in Phase 6) |
| Product name ShelfLedger | **Locked** |
| Negative stock | Block by default; `MANAGER`+ override + reason |
| Invoice PDF | Print CSS first; server PDF later |
| Receivables | Payment status only (`PAID` / `PARTIAL` / `UNPAID`) |
| Seed owner email | Open (ask at Phase 1 seed) |

---

## Document Control

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-27 | Initial PRD — documentation phase |
| 1.1.0 | 2026-07-27 | Rename to ShelfLedger; lock GST/DB/domain decisions |
