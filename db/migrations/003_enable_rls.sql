-- Migration 003: Enable Row Level Security on all tables
-- Run after 002_create_tables.sql

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs        ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin or staff
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES policies
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL
  USING (is_admin());

-- ============================================================
-- CATEGORIES policies
-- ============================================================
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "categories_admin_all"
  ON categories FOR ALL
  USING (is_admin());

-- ============================================================
-- PRODUCTS policies
-- ============================================================
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL);

CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (is_admin());

-- ============================================================
-- PRODUCT IMAGES policies
-- ============================================================
CREATE POLICY "product_images_public_read"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
      AND products.is_active = TRUE
      AND products.deleted_at IS NULL
    )
  );

CREATE POLICY "product_images_admin_all"
  ON product_images FOR ALL
  USING (is_admin());

-- ============================================================
-- PRODUCT VARIANTS policies
-- ============================================================
CREATE POLICY "product_variants_public_read"
  ON product_variants FOR SELECT
  USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_variants.product_id
      AND products.is_active = TRUE
      AND products.deleted_at IS NULL
    )
  );

CREATE POLICY "product_variants_admin_all"
  ON product_variants FOR ALL
  USING (is_admin());

-- ============================================================
-- CARTS policies
-- ============================================================
-- Users can only access their own cart
CREATE POLICY "carts_select_own_user"
  ON carts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "carts_insert_own_user"
  ON carts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "carts_update_own_user"
  ON carts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "carts_delete_own_user"
  ON carts FOR DELETE
  USING (user_id = auth.uid());

-- Admin can access all carts
CREATE POLICY "carts_admin_all"
  ON carts FOR ALL
  USING (is_admin());

-- NOTE: Guest cart operations (by session_id) must go through
-- server-side API routes using the service role key, never direct client access.

-- ============================================================
-- DISCOUNT CODES policies
-- ============================================================
-- Public can only check if a code is valid (via server route - not direct)
-- Admins manage all codes
CREATE POLICY "discount_codes_admin_all"
  ON discount_codes FOR ALL
  USING (is_admin());

-- ============================================================
-- ORDERS policies
-- ============================================================
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_admin()
  );

CREATE POLICY "orders_admin_all"
  ON orders FOR ALL
  USING (is_admin());

-- Guest order creation goes through service role via API route (not RLS insert)

-- ============================================================
-- ORDER ITEMS policies
-- ============================================================
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "order_items_admin_all"
  ON order_items FOR ALL
  USING (is_admin());

-- ============================================================
-- ADMIN LOGS policies
-- ============================================================
CREATE POLICY "admin_logs_admin_read"
  ON admin_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_logs_admin_insert"
  ON admin_logs FOR INSERT
  WITH CHECK (is_admin());

-- ============================================================
-- EMAIL LOGS policies
-- ============================================================
CREATE POLICY "email_logs_admin_all"
  ON email_logs FOR ALL
  USING (is_admin());
