-- PostgreSQL treats NULLs as distinct in unique indexes, so root categories
-- (parent_id IS NULL) could duplicate names. Use COALESCE sentinel.
DROP INDEX IF EXISTS categories_org_parent_name_active_uidx;
CREATE UNIQUE INDEX categories_org_parent_name_active_uidx
  ON categories (
    organization_id,
    (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)),
    name
  )
  WHERE deleted_at IS NULL;
