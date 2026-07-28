# Business Rules — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27

These rules are binding for services. UI may guide users; **server always enforces**.

---

## 1. Business Rules (General)

1. One **Organization** per deployment in V1; schema supports future multi-org only if product becomes SaaS (not required now).
2. Every operational document belongs to a **Branch** (and stock to a **Location**; V1: 1:1 branch↔location).
3. Posted documents are immutable except via **void/cancel reverse entries**.
4. Soft-deleted masters (`deletedAt`) cannot be selected for new documents; historical references remain.
5. Monetary amounts stored in **minor units avoided**; use `Decimal(12,2)` for money and `Decimal(14,4)` for unit costs where precision matters. Application rounds tax to 2 decimals per GST norms.
6. All timestamps UTC in DB; display in Asia/Kolkata in UI.

---

## 2. Inventory Rules

1. **Never** store authoritative quantity on `articles` or `article_variants` as an editable field.
2. Stock changes **only** through `StockLedgerService` (or equivalent), called from purchase/sale/exchange/adjustment/opening/transfer services.
3. Each ledger row: `variantId`, `locationId`, `qtyChange` (+/−), `unitCost`, `movementType`, `referenceType`, `referenceId`, `occurredAt`, audit fields.
4. `inventory_balances.quantity` updated in the **same transaction** as ledger insert(s).
5. Available qty for sale = balance quantity (V1; reserved stock later).
6. Physical delete of ledger rows is **forbidden**. Corrections = opposite movement with reason.

### Movement Types

| Code | Sign convention |
|------|-----------------|
| `OPENING` | + |
| `PURCHASE` | + |
| `PURCHASE_RETURN` | − |
| `SALE` | − |
| `SALE_RETURN` | + |
| `EXCHANGE_IN` | + |
| `EXCHANGE_OUT` | − |
| `ADJUSTMENT_IN` | + |
| `ADJUSTMENT_OUT` | − |
| `DAMAGE` | − |
| `LOST` | − |
| `FOUND` | + |
| `TRANSFER_IN` | + |
| `TRANSFER_OUT` | − |

---

## 3. Average Cost Formula

Per `(variantId, locationId)`:

**On inbound that should affect cost** (`OPENING`, `PURCHASE`, optionally `FOUND` / `ADJUSTMENT_IN` when cost provided):

```
oldQty = balance.quantity
oldAvg = balance.avgUnitCost
inQty  = inbound quantity (> 0)
inRate = inbound unit cost (ex-tax or as-per policy; see Pricing)

if oldQty + inQty == 0:
  newAvg = 0
else if oldQty <= 0:
  newAvg = inRate   # recovery from zero/negative edge
else:
  newAvg = (oldQty * oldAvg + inQty * inRate) / (oldQty + inQty)
```

**On outbound (sale, damage, etc.):** do **not** change avg cost; snapshot `unitCost = current avg` onto ledger/sale line for COGS.

**Purchase return:** reduce qty; avg cost policy V1 = **keep avg unchanged** (simpler, common retail practice). Document if qty returns to zero → avg may reset to 0.

**Cost basis for purchase rate:** landable cost **excluding GST** (GST is input credit, not inventory cost) unless org setting says inclusive (default: exclusive).

---

## 4. Purchase Rules

1. Draft purchases may be edited freely; **Posted** purchases cannot edit lines.
2. Posting requires ≥1 line, positive qtys, valid vendor, valid variants.
3. Posting creates ledger `PURCHASE` and updates balances + avg cost.
4. Purchase return references original purchase line where possible; qty returned ≤ qty purchased net of prior returns.
5. Vendor GSTIN validated format when provided (regex); not verified online in V1.
6. Duplicate vendor invoice number per vendor within FY → warning or block (configurable; default **block**).

---

## 5. Sales Rules

1. Sale requires ≥1 line; qty &gt; 0.
2. Insufficient stock → `BusinessRuleError` unless override by `MANAGER`/`OWNER` with `overrideReason`.
3. On post: ledger `SALE` (−qty), store line `unitCost` from avg, compute taxes, allocate payments.
4. Invoice number allocated atomically (sequence table) at post time.
5. Void sale: reverse stock via `SALE_RETURN` movements linked to void; mark sale `VOIDED`; do not delete.
6. Discounts cannot make line net &lt; 0.
7. Round-off line (±1) allowed on header per settings.
8. **Quick Sale** may create+post in one staff action; same invariants as draft→post (no stock bypass). Draft form remains for complex bills.

---

## 6. Exchange Rules

1. Exchange document links: return lines (must reference prior sale line when known) + optional replacement sale lines.
2. Return qty ≤ original sold qty net of prior returns/exchanges.
3. Stock: `EXCHANGE_IN` for returns, `EXCHANGE_OUT` for replacements (or compose as sale return + sale — prefer explicit exchange types for reporting).
4. Price difference: collect extra or refund; record payment adjustment on exchange.
5. GST: tax on replacement as new supply; credit note semantics for return — V1 simplified: store tax on both legs explicitly for reports.

---

## 7. Customer Rules

1. Phone unique per organization when provided (soft-deleted excluded).
2. Walk-in customer allowed (`isWalkIn` system customer).
3. GSTIN optional; if present, treat as B2B for invoice fields.
4. Soft delete hides from search; past invoices remain.

---

## 8. GST Rules (India, V1)

**Locked:** V1 is **same-state only** — always **CGST + SGST**. No IGST billing UI or posting path in V1.

1. Org has `gstin`, `stateCode`. Place of supply for V1 sales = **organization state**.
2. Split tax equally (or per configured rate row): **CGST + SGST** from `tax_rates` (`cgst_rate` / `sgst_rate`).
3. Customer state may be stored for address/B2B fields but **must not** switch V1 invoices to IGST.
4. `igst_rate` / `igst_amount` columns may exist for forward-compat; V1 always stores **0**.
5. Rate from HSN/tax rate on article or line override.
6. Taxable value = after discounts, before tax.
7. Store per-line: `taxableAmount`, `cgstRate/Amt`, `sgstRate/Amt` (IGST = 0).
8. Header sums must equal sum of lines (± round-off).
9. Not a full GSTR filing engine — reports export summaries only.
10. Inter-state / IGST is a **future** feature (see roadmap); do not half-implement.

---

## 9. Expense Rules

1. Expenses do not touch inventory.
2. Require category, amount &gt; 0, date, payment mode.
3. Soft delete only; no ledger impact.

---

## 10. Staff Rules

1. Only `OWNER` can create `OWNER` users.
2. `CASHIER` cannot post stock adjustments or void without manager (policy table).
3. Deactivating user sets `isActive=false`; sessions invalidated.
4. Passwords hashed (Argon2id or bcrypt cost ≥ 12).

---

## 11. Validation Rules

1. All external input validated with Zod.
2. UUIDs for ids; reject malformed.
3. Strings trimmed; max lengths enforced.
4. Dates not in far future beyond configured tolerance (e.g. +1 day).
5. Quantities: positive decimals with scale ≤ 3 (pairs can be integer; allow 0.5 if needed — default integers for footwear pairs).

---

## 12. Pricing Rules

1. MRP / selling price on variant (or article default).
2. Sale price ≤ MRP unless override permission (optional enforcement).
3. Purchase rate ≠ selling price; independent fields.
4. Currency INR only in V1.

---

## 13. Discount Rules

1. Line discount: amount or percent (store both resolved amount).
2. Bill discount: distributed proportionally to line taxable amounts **or** applied as header-only with GST on net — choose **proportional distribution** for cleaner GST lines.
3. Stacking: apply line discount first, then bill discount distribution.
4. Max discount % configurable (default 100 for owner, lower for cashier).

---

## 14. Stock Adjustment Rules

1. Require reason code + notes for OUT movements.
2. `DAMAGE` / `LOST` decrease stock; cost snapshot for write-off reporting.
3. Opening stock only allowed once per variant+location **or** additional openings treated as `ADJUSTMENT_IN` with cost (policy: allow multiple `OPENING` only during FY setup window).
4. Manager+ role for adjustments.

---

## 15. Article / Variant Rules

1. Article without variants cannot be stocked; at least one variant required to purchase/sell.
2. SKU unique per organization.
3. Size/color required for footwear variants (empty string not allowed; use `NA` only if truly N/A).
4. Barcode unique when present.

---

## 16. Never Forget

- Ledger first; balance second; same transaction.
- No hard delete of stock or financial rows.
- Avg cost on inbound (ex-GST); snapshot on outbound.
- Server enforces all rules.
