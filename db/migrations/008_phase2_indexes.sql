-- Migration 008: Phase 2 — Additional performance indexes

-- Products
CREATE INDEX IF NOT EXISTS idx_products_category_id   ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_is_active      ON products(is_active)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_is_featured    ON products(is_featured) WHERE deleted_at IS NULL AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_created_at     ON products(created_at DESC) WHERE deleted_at IS NULL;

-- Full-text search using trigram index on name + description
-- pg_trgm should already be enabled (migration 001); add description index
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm ON products USING gin(description gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- Variants
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku         ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_stock       ON product_variants(stock) WHERE is_active = TRUE;

-- Images
CREATE INDEX IF NOT EXISTS idx_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_primary    ON product_images(product_id, is_primary) WHERE is_primary = TRUE;
