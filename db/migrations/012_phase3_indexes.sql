-- Migration 012: Phase 3 — Performance indexes

-- Soft-deleted profiles excluded from customer queries
CREATE INDEX IF NOT EXISTS idx_profiles_active
  ON profiles(id, role)
  WHERE account_status = 'active';

-- Returns ordered by recency
CREATE INDEX IF NOT EXISTS idx_returns_created
  ON returns_exchanges(created_at DESC);

-- Orders by user (customer order history)
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders(user_id, created_at DESC);

-- Wishlist lookup by customer+product
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_product
  ON wishlists(customer_id, product_id);

-- Reviews pending moderation
CREATE INDEX IF NOT EXISTS idx_product_reviews_pending
  ON product_reviews(is_approved, created_at DESC)
  WHERE is_approved = FALSE;

-- Customer addresses default
CREATE INDEX IF NOT EXISTS idx_addresses_default
  ON customer_addresses(customer_id, is_default)
  WHERE is_default = TRUE;
