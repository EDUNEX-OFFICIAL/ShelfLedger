-- Partial unique indexes for soft-deleted masters (active rows only).
-- Applied after Prisma schema migration.

CREATE UNIQUE INDEX IF NOT EXISTS branches_org_code_active_uidx
  ON branches (organization_id, code) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS locations_branch_code_active_uidx
  ON locations (branch_id, code) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_org_email_active_uidx
  ON users (organization_id, email) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS brands_org_name_active_uidx
  ON brands (organization_id, name) WHERE deleted_at IS NULL;

-- COALESCE required: NULL parent_id breaks uniqueness in PostgreSQL
CREATE UNIQUE INDEX IF NOT EXISTS categories_org_parent_name_active_uidx
  ON categories (
    organization_id,
    (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)),
    name
  )
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS articles_org_code_active_uidx
  ON articles (organization_id, article_code) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS article_variants_org_sku_active_uidx
  ON article_variants (organization_id, sku) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS article_variants_org_barcode_active_uidx
  ON article_variants (organization_id, barcode) WHERE deleted_at IS NULL AND barcode IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS article_variants_article_size_color_active_uidx
  ON article_variants (article_id, size, color) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_org_phone_active_uidx
  ON customers (organization_id, phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS purchases_vendor_invoice_active_uidx
  ON purchases (organization_id, vendor_id, vendor_invoice_no)
  WHERE deleted_at IS NULL AND vendor_invoice_no IS NOT NULL;
