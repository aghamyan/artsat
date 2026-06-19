-- Migration 006: Phase 2 — Add new tables
-- Run after 005_seed_categories.sql

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_featured ON collections(is_featured) WHERE is_active = TRUE;

CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COLLECTION PRODUCTS (pivot)
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection_id, product_id)
);

CREATE INDEX idx_collection_products_collection ON collection_products(collection_id);
CREATE INDEX idx_collection_products_product ON collection_products(product_id);

-- ============================================================
-- PRODUCT ANALYTICS (per-day counters)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_analytics (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  views               INTEGER NOT NULL DEFAULT 0,
  searches            INTEGER NOT NULL DEFAULT 0,
  add_to_cart         INTEGER NOT NULL DEFAULT 0,
  searches_from_query TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, date)
);

CREATE INDEX idx_product_analytics_product_date ON product_analytics(product_id, date);

-- ============================================================
-- PRODUCT REVIEWS (schema-ready; submissions open in Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rating               INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                TEXT NOT NULL,
  comment              TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count        INTEGER NOT NULL DEFAULT 0,
  is_approved          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id) WHERE is_approved = TRUE;
CREATE INDEX idx_product_reviews_customer ON product_reviews(customer_id);

-- ============================================================
-- PRODUCT RATINGS (aggregated; updated by trigger)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_ratings (
  product_id    UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count  INTEGER NOT NULL DEFAULT 0,
  star_5_count  INTEGER NOT NULL DEFAULT 0,
  star_4_count  INTEGER NOT NULL DEFAULT 0,
  star_3_count  INTEGER NOT NULL DEFAULT 0,
  star_2_count  INTEGER NOT NULL DEFAULT 0,
  star_1_count  INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Collections: read all; write admin only
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_select_all" ON collections FOR SELECT USING (TRUE);
CREATE POLICY "collections_write_admin" ON collections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')
  ));

-- Collection products: read all; write admin only
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_products_select_all" ON collection_products FOR SELECT USING (TRUE);
CREATE POLICY "collection_products_write_admin" ON collection_products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')
  ));

-- Product analytics: admin only
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_admin_only" ON product_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')
  ));
-- Allow server-side upserts via service role (bypasses RLS)

-- Product reviews: approved public; own insert; admin all
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select_approved" ON product_reviews FOR SELECT
  USING (is_approved = TRUE);
CREATE POLICY "reviews_insert_customer" ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_update_admin" ON product_reviews FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')
  ));

-- Product ratings: read all
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_select_all" ON product_ratings FOR SELECT USING (TRUE);
