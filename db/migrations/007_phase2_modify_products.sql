-- Migration 007: Phase 2 — Extend products table + add average_rating denorm

-- SEO fields
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS meta_title       TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords    TEXT;

-- Product SKU (product-level, separate from variant SKUs)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Physical properties (used in Phase 4 shipping calc)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight     DECIMAL(8,3),
  ADD COLUMN IF NOT EXISTS dimensions JSONB;

-- Denormalized average rating for sorting without joining product_ratings
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) NOT NULL DEFAULT 0;

-- Track last restock date
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMPTZ;

-- Denormalized collection_ids for fast "products in collection X" filtering
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS collection_ids UUID[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating DESC)
  WHERE deleted_at IS NULL AND is_active = TRUE;
