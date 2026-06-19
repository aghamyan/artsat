-- Migration 010: Phase 3 — New customer account tables
-- Run after 009_phase2_analytics_triggers.sql

-- ============================================================
-- CUSTOMER ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT 'home' CHECK (label IN ('home', 'work', 'other')),
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address_line1   TEXT NOT NULL,
  address_line2   TEXT,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT '',
  postal_code     TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'Armenia',
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  is_billing      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);

CREATE TRIGGER customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_own" ON customer_addresses FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- ============================================================
-- WISHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, product_id, variant_id)
);

CREATE INDEX idx_wishlists_customer ON wishlists(customer_id);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlists_own" ON wishlists FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- ============================================================
-- REVIEW_HELPFUL (track helpful votes)
-- ============================================================
CREATE TABLE IF NOT EXISTS review_helpful (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id   UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful  BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, customer_id)
);

CREATE INDEX idx_review_helpful_review ON review_helpful(review_id);

ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_helpful_select_all" ON review_helpful FOR SELECT USING (TRUE);
CREATE POLICY "review_helpful_own_insert" ON review_helpful FOR INSERT
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "review_helpful_own_delete" ON review_helpful FOR DELETE
  USING (customer_id = auth.uid());

-- ============================================================
-- RETURNS & EXCHANGES
-- ============================================================
CREATE TABLE IF NOT EXISTS returns_exchanges (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id       UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  request_type        TEXT NOT NULL CHECK (request_type IN ('return', 'exchange')),
  reason              TEXT NOT NULL CHECK (reason IN ('size', 'color', 'damaged', 'defect', 'wrong_item', 'other')),
  reason_description  TEXT,
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'shipped_back', 'completed', 'cancelled')),
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  tracking_number     TEXT,
  return_address      TEXT,
  notes               TEXT,
  created_by          UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_returns_order ON returns_exchanges(order_id);
CREATE INDEX idx_returns_created_by ON returns_exchanges(created_by);
CREATE INDEX idx_returns_status ON returns_exchanges(status);

CREATE TRIGGER returns_updated_at
  BEFORE UPDATE ON returns_exchanges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE returns_exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "returns_own_select" ON returns_exchanges FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );
CREATE POLICY "returns_own_insert" ON returns_exchanges FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "returns_admin_update" ON returns_exchanges FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- ============================================================
-- EMAIL PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS email_preferences (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_notifications  BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_emails     BOOLEAN NOT NULL DEFAULT FALSE,
  product_alerts       BOOLEAN NOT NULL DEFAULT FALSE,
  review_invitations   BOOLEAN NOT NULL DEFAULT TRUE,
  newsletter           BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id)
);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_prefs_own" ON email_preferences FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());
