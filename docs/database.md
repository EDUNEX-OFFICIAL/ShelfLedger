# Database Design — ShelfLedger

**Version:** 1.0.0  
**Last Updated:** 2026-07-27  
**Engine:** PostgreSQL 16+  
**ORM:** Prisma  
**PK strategy:** UUID (`uuid()` / `gen_random_uuid()`)

---

## 1. Design Principles

1. Normalized masters; documents as headers + lines.
2. Soft delete: `deletedAt TIMESTAMPTZ NULL`.
3. Audit: `createdAt`, `updatedAt`, `createdBy`, `updatedBy` (nullable FK → users).
4. Inventory: `stock_ledger` + `inventory_balances`.
5. Multi-branch ready: `organization_id`, `branch_id`, `location_id`.
6. Money: `DECIMAL(12,2)`; unit cost: `DECIMAL(14,4)`; qty: `DECIMAL(12,3)`.
7. Never physically delete ledger or posted financial rows.

---

## 2. ER Diagram (Markdown)

```
organizations 1──* branches 1──* locations
organizations 1──* users
organizations 1──* brands
organizations 1──* categories
organizations 1──* vendors
organizations 1──* customers
organizations 1──* articles
articles *──1 brands
articles *──1 categories
articles 1──* article_variants
article_variants 1──* inventory_balances *──1 locations
article_variants 1──* stock_ledger *──1 locations

vendors 1──* purchases 1──* purchase_lines *──1 article_variants
customers 1──* sales 1──* sale_lines *──1 article_variants
sales 1──* sale_payments
sales 1──* exchanges (optional link)
exchanges 1──* exchange_lines

users *──* roles (via user_roles)   [or enum role on users for V1]

expense_categories 1──* expenses
organizations 1──* tax_rates
organizations 1──* document_sequences
```

---

## 3. Tables

### 3.1 `organizations`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| gstin | TEXT NULL | |
| state_code | CHAR(2) NOT NULL | |
| address_line1 | TEXT NULL | |
| address_line2 | TEXT NULL | |
| city | TEXT NULL | |
| pincode | TEXT NULL | |
| phone | TEXT NULL | |
| email | TEXT NULL | |
| financial_year_start_month | INT NOT NULL DEFAULT 4 | |
| created_at, updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ NULL | |
| created_by, updated_by | UUID NULL | |

### 3.2 `branches`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK NOT NULL | |
| code | TEXT NOT NULL | unique per org |
| name | TEXT NOT NULL | |
| state_code | CHAR(2) NULL | override org |
| is_default | BOOLEAN DEFAULT false | |
| audit + soft delete | | |

**Unique:** `(organization_id, code)` WHERE deleted_at IS NULL (partial unique index).

### 3.3 `locations`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| branch_id | UUID FK NOT NULL | |
| organization_id | UUID FK NOT NULL | denormalized for RLS-ready queries |
| code | TEXT NOT NULL | |
| name | TEXT NOT NULL | |
| is_default | BOOLEAN | |
| audit + soft delete | | |

**Unique:** `(branch_id, code)` partial.

### 3.4 `users`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK NOT NULL | |
| email | CITEXT / TEXT NOT NULL | unique per org |
| name | TEXT NOT NULL | |
| password_hash | TEXT NOT NULL | |
| role | TEXT NOT NULL | OWNER\|MANAGER\|CASHIER\|VIEWER |
| branch_id | UUID NULL | default branch |
| is_active | BOOLEAN DEFAULT true | |
| last_login_at | TIMESTAMPTZ NULL | |
| audit + soft delete | | |

**Indexes:** `(organization_id, email)`, `(organization_id, role)`.

### 3.5 `brands`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| name | TEXT NOT NULL | |
| code | TEXT NULL | |
| audit + soft delete | | |

**Unique:** `(organization_id, name)` partial.

### 3.6 `categories`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| parent_id | UUID NULL FK → categories | |
| name | TEXT NOT NULL | |
| audit + soft delete | | |

**Unique:** `(organization_id, parent_id, name)` partial.

### 3.7 `vendors`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| name | TEXT NOT NULL | |
| gstin | TEXT NULL | |
| phone | TEXT NULL | |
| email | TEXT NULL | |
| address | TEXT NULL | |
| state_code | CHAR(2) NULL | |
| payment_terms_days | INT NULL | |
| notes | TEXT NULL | |
| audit + soft delete | | |

### 3.8 `customers`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| name | TEXT NOT NULL | |
| phone | TEXT NULL | |
| email | TEXT NULL | |
| gstin | TEXT NULL | |
| state_code | CHAR(2) NULL | |
| address | TEXT NULL | |
| is_walk_in | BOOLEAN DEFAULT false | |
| audit + soft delete | | |

**Unique:** `(organization_id, phone)` partial where phone not null.

### 3.9 `articles`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| brand_id | UUID FK | |
| category_id | UUID FK | |
| name | TEXT NOT NULL | |
| article_code | TEXT NOT NULL | style code |
| hsn_code | TEXT NULL | |
| description | TEXT NULL | |
| default_tax_rate_id | UUID NULL | |
| audit + soft delete | | |

**Unique:** `(organization_id, article_code)` partial.

### 3.10 `article_variants`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| article_id | UUID FK | |
| size | TEXT NOT NULL | |
| color | TEXT NOT NULL | |
| sku | TEXT NOT NULL | |
| barcode | TEXT NULL | |
| mrp | DECIMAL(12,2) NOT NULL | |
| selling_price | DECIMAL(12,2) NOT NULL | |
| low_stock_threshold | DECIMAL(12,3) DEFAULT 0 | |
| audit + soft delete | | |

**Unique:** `(organization_id, sku)` partial; `(organization_id, barcode)` partial where barcode not null; `(article_id, size, color)` partial.

> **Note:** Quantity is NOT a column here.

### 3.11 `tax_rates`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| name | TEXT NOT NULL | e.g. GST 18% |
| total_rate | DECIMAL(5,2) NOT NULL | 18.00 |
| cgst_rate | DECIMAL(5,2) NOT NULL | 9 |
| sgst_rate | DECIMAL(5,2) NOT NULL | 9 |
| igst_rate | DECIMAL(5,2) NOT NULL | 18 |
| is_active | BOOLEAN | |
| audit + soft delete | | |

### 3.12 `inventory_balances`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| location_id | UUID FK | |
| variant_id | UUID FK | |
| quantity | DECIMAL(12,3) NOT NULL DEFAULT 0 | |
| avg_unit_cost | DECIMAL(14,4) NOT NULL DEFAULT 0 | |
| created_at, updated_at | TIMESTAMPTZ | |
| created_by, updated_by | UUID NULL | |
| deleted_at | TIMESTAMPTZ NULL | rarely used |

**Unique:** `(location_id, variant_id)`  

**Indexes:** `(organization_id, variant_id)`, `(location_id)`.

### 3.13 `stock_ledger`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| location_id | UUID FK | |
| variant_id | UUID FK | |
| movement_type | TEXT NOT NULL | enum-like |
| qty_change | DECIMAL(12,3) NOT NULL | signed |
| unit_cost | DECIMAL(14,4) NOT NULL | |
| reference_type | TEXT NOT NULL | PURCHASE, SALE, … |
| reference_id | UUID NOT NULL | |
| reference_line_id | UUID NULL | |
| notes | TEXT NULL | |
| occurred_at | TIMESTAMPTZ NOT NULL | |
| created_at, updated_at | TIMESTAMPTZ | |
| created_by, updated_by | UUID NULL | |
| deleted_at | TIMESTAMPTZ NULL | **must stay null** for active rows; void via reverse |

**Indexes:** `(variant_id, location_id, occurred_at)`, `(reference_type, reference_id)`, `(organization_id, occurred_at)`.

### 3.14 `purchases`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| branch_id | UUID FK | |
| location_id | UUID FK | |
| vendor_id | UUID FK | |
| vendor_invoice_no | TEXT NULL | |
| vendor_invoice_date | DATE NULL | |
| status | TEXT NOT NULL | DRAFT\|POSTED\|VOIDED |
| subtotal | DECIMAL(12,2) | |
| discount_amount | DECIMAL(12,2) | |
| tax_amount | DECIMAL(12,2) | |
| total_amount | DECIMAL(12,2) | |
| notes | TEXT NULL | |
| posted_at | TIMESTAMPTZ NULL | |
| audit + soft delete | | |

**Unique:** `(organization_id, vendor_id, vendor_invoice_no)` partial where invoice not null and not deleted.

### 3.15 `purchase_lines`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| purchase_id | UUID FK | |
| variant_id | UUID FK | |
| qty | DECIMAL(12,3) | |
| unit_rate | DECIMAL(14,4) | ex-GST |
| discount_amount | DECIMAL(12,2) | |
| tax_rate_id | UUID NULL | |
| taxable_amount | DECIMAL(12,2) | |
| cgst_amount, sgst_amount, igst_amount | DECIMAL(12,2) | |
| line_total | DECIMAL(12,2) | |
| audit + soft delete | | |

### 3.16 `sales`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| branch_id | UUID FK | |
| location_id | UUID FK | |
| customer_id | UUID FK | |
| invoice_no | TEXT NOT NULL | |
| invoice_date | DATE NOT NULL | |
| status | TEXT NOT NULL | DRAFT\|POSTED\|VOIDED |
| place_of_supply_state | CHAR(2) | |
| is_inter_state | BOOLEAN | |
| subtotal, discount_amount, tax_amount, round_off, total_amount | DECIMAL(12,2) | |
| payment_status | TEXT | PAID\|PARTIAL\|UNPAID |
| notes | TEXT NULL | |
| stock_override | BOOLEAN DEFAULT false | |
| override_reason | TEXT NULL | |
| posted_at | TIMESTAMPTZ NULL | |
| audit + soft delete | | |

**Unique:** `(organization_id, branch_id, invoice_no)`  

### 3.17 `sale_lines`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| sale_id | UUID FK | |
| variant_id | UUID FK | |
| qty | DECIMAL(12,3) | |
| unit_price | DECIMAL(12,2) | |
| unit_cost | DECIMAL(14,4) | snapshot avg |
| discount_amount | DECIMAL(12,2) | |
| tax_rate_id | UUID NULL | |
| hsn_code | TEXT NULL | snapshot |
| taxable_amount | DECIMAL(12,2) | |
| cgst_rate, sgst_rate, igst_rate | DECIMAL(5,2) | |
| cgst_amount, sgst_amount, igst_amount | DECIMAL(12,2) | |
| line_total | DECIMAL(12,2) | |
| audit + soft delete | | |

### 3.18 `sale_payments`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| sale_id | UUID FK | |
| method | TEXT | CASH\|UPI\|CARD\|OTHER |
| amount | DECIMAL(12,2) | |
| reference | TEXT NULL | UPI ref |
| paid_at | TIMESTAMPTZ | |
| audit + soft delete | | |

### 3.19 `exchanges`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| branch_id | UUID FK | |
| location_id | UUID FK | |
| customer_id | UUID FK | |
| original_sale_id | UUID NULL FK | |
| status | TEXT | DRAFT\|POSTED\|VOIDED |
| difference_amount | DECIMAL(12,2) | + customer pays / − refund |
| notes | TEXT NULL | |
| posted_at | TIMESTAMPTZ NULL | |
| audit + soft delete | | |

### 3.20 `exchange_lines`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| exchange_id | UUID FK | |
| direction | TEXT | RETURN\|REPLACE |
| variant_id | UUID FK | |
| qty | DECIMAL(12,3) | |
| unit_price | DECIMAL(12,2) | |
| unit_cost | DECIMAL(14,4) | |
| original_sale_line_id | UUID NULL | |
| tax fields | … | same pattern as sale_lines |
| audit + soft delete | | |

### 3.21 `expense_categories`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| name | TEXT NOT NULL | |
| audit + soft delete | | |

### 3.22 `expenses`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| branch_id | UUID FK | |
| category_id | UUID FK | |
| amount | DECIMAL(12,2) | |
| expense_date | DATE | |
| payment_method | TEXT | |
| notes | TEXT NULL | |
| audit + soft delete | | |

### 3.23 `document_sequences`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| branch_id | UUID FK | |
| doc_type | TEXT | SALE_INVOICE, … |
| prefix | TEXT | |
| fy_label | TEXT | e.g. 2026-27 |
| next_number | INT NOT NULL | |
| audit | | |

**Unique:** `(organization_id, branch_id, doc_type, fy_label)`  

Allocation: `UPDATE … SET next_number = next_number + 1 RETURNING` inside transaction.

### 3.24 `audit_logs` (optional V1, recommended)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID | |
| actor_user_id | UUID NULL | |
| action | TEXT | |
| entity_type | TEXT | |
| entity_id | UUID | |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | |

No soft delete required; append-only.

### 3.25 `sessions` (if DB sessions)

Depends on Auth.js adapter choice; document in implementation phase.

---

## 4. Soft Delete Strategy

- Default repository queries: `WHERE deleted_at IS NULL`
- Unique constraints: **partial indexes** on active rows
- Posted sales/purchases: prefer `status=VOIDED` over soft delete
- Ledger: never soft-delete for corrections; insert reverse movement

---

## 5. Audit Columns

All mutable business tables include:

`created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`

Exceptions: pure append-only `audit_logs` (only `created_at`); junction tables as needed.

---

## 6. Index Summary (critical)

- SKU, barcode, invoice_no, vendor_invoice_no
- stock_ledger (variant, location, occurred_at)
- sales (invoice_date), purchases (posted_at)
- customers (phone), users (email)

---

## 7. Migration Notes

- Prisma migrate in `packages/db`
- Seed: org, branch, location, owner user, walk-in customer, default tax rates (5/12/18), expense categories

Prisma schema generation is **Phase 2** after this document is approved.
