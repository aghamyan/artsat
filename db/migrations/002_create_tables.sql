-- Migration 002: Create all application tables
-- Run after 001_init_schema.sql

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  price         INTEGER NOT NULL CHECK (price >= 0),   -- cents
  compare_price INTEGER CHECK (compare_price >= 0),    -- original price if on sale (cents)
  material      TEXT,
  care_instructions TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  label         TEXT CHECK (label IN ('new', 'sale', 'bestseller', 'limited', NULL)),
  tags          TEXT[] DEFAULT '{}',
  deleted_at    TIMESTAMPTZ,                            -- soft delete
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON products USING gin(name gin_trgm_ops);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================================
-- PRODUCT VARIANTS (size + color combinations)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku           TEXT NOT NULL UNIQUE,
  size          TEXT,                                   -- XS, S, M, L, XL, XXL
  color         TEXT,                                   -- Black, White, Blue, etc.
  color_hex     TEXT,                                   -- #000000
  price_delta   INTEGER NOT NULL DEFAULT 0,            -- added to product.price (cents)
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 5,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

CREATE TRIGGER variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CARTS (persistent, guests + users)
-- ============================================================
CREATE TABLE IF NOT EXISTS carts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id   TEXT,                                   -- guest identifier
  items        JSONB NOT NULL DEFAULT '[]',            -- [{variant_id, quantity, added_at}]
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_carts_expires ON carts(expires_at);

CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DISCOUNT CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value           INTEGER NOT NULL CHECK (value > 0),  -- % or cents
  minimum_amount  INTEGER DEFAULT 0,                   -- minimum order subtotal (cents)
  max_uses        INTEGER,                             -- NULL = unlimited
  uses_count      INTEGER NOT NULL DEFAULT 0,
  one_per_customer BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);

CREATE TRIGGER discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number             TEXT NOT NULL UNIQUE DEFAULT generate_order_number(),
  user_id                  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_email              TEXT,
  guest_token              TEXT UNIQUE,                -- secure lookup for guests

  -- shipping address (denormalized)
  shipping_full_name       TEXT NOT NULL,
  shipping_email           TEXT NOT NULL,
  shipping_phone           TEXT NOT NULL,
  shipping_address_line1   TEXT NOT NULL,
  shipping_address_line2   TEXT,
  shipping_city            TEXT NOT NULL,
  shipping_postal_code     TEXT,
  shipping_country         TEXT NOT NULL DEFAULT 'Armenia',
  shipping_notes           TEXT,

  -- financials (all in cents)
  subtotal                 INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_fee             INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount          INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total                    INTEGER NOT NULL CHECK (total >= 0),
  discount_code_id         UUID REFERENCES discount_codes(id),
  discount_code_used       TEXT,

  -- status
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled','returned','refunded')),
  payment_status           TEXT NOT NULL DEFAULT 'pending'
                             CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method           TEXT NOT NULL DEFAULT 'cash_on_delivery'
                             CHECK (payment_method IN ('cash_on_delivery','bank_transfer','stripe')),
  stripe_payment_intent_id TEXT,

  -- metadata
  internal_notes           TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_guest_token ON orders(guest_token);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ORDER ITEMS (denormalized for audit integrity)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id            UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id            UUID REFERENCES product_variants(id) ON DELETE SET NULL,

  -- denormalized at purchase time (immutable audit record)
  product_name          TEXT NOT NULL,
  variant_sku           TEXT NOT NULL,
  variant_size          TEXT,
  variant_color         TEXT,
  unit_price            INTEGER NOT NULL CHECK (unit_price >= 0), -- cents
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  total_price           INTEGER NOT NULL CHECK (total_price >= 0), -- cents

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- ADMIN LOGS (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,                          -- 'create', 'update', 'delete', 'status_change'
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_table ON admin_logs(table_name, record_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- ============================================================
-- EMAIL LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  email_type  TEXT NOT NULL CHECK (email_type IN ('order_confirmation','admin_alert','status_update','low_stock')),
  recipient   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  error       TEXT,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_order ON email_logs(order_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
