-- Migration 005: Seed initial categories and sample data
-- Run after 003_enable_rls.sql

-- ============================================================
-- Categories
-- ============================================================
INSERT INTO categories (name, slug, description, sort_order, is_active)
VALUES
  ('Men',         'men',         'Men''s clothing and accessories', 1, TRUE),
  ('Women',       'women',       'Women''s clothing and accessories', 2, TRUE),
  ('Unisex',      'unisex',      'Unisex clothing for everyone', 3, TRUE),
  ('New Arrivals','new-arrivals','Latest drops and new products', 4, TRUE),
  ('Sale',        'sale',        'Sale items at great prices', 5, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories under Men
WITH men AS (SELECT id FROM categories WHERE slug = 'men')
INSERT INTO categories (name, slug, parent_id, sort_order, is_active)
SELECT name, slug, men.id, sort_order, TRUE FROM men,
(VALUES
  ('T-Shirts',  'men-t-shirts',  1),
  ('Hoodies',   'men-hoodies',   2),
  ('Pants',     'men-pants',     3),
  ('Jackets',   'men-jackets',   4)
) AS sub(name, slug, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories under Women
WITH women AS (SELECT id FROM categories WHERE slug = 'women')
INSERT INTO categories (name, slug, parent_id, sort_order, is_active)
SELECT name, slug, women.id, sort_order, TRUE FROM women,
(VALUES
  ('T-Shirts',  'women-t-shirts',  1),
  ('Hoodies',   'women-hoodies',   2),
  ('Dresses',   'women-dresses',   3),
  ('Jackets',   'women-jackets',   4)
) AS sub(name, slug, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Sample products (for development/testing)
-- ============================================================
DO $$
DECLARE
  v_cat_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'men-t-shirts';

  INSERT INTO products (category_id, name, slug, description, price, material, label, is_active)
  VALUES (
    v_cat_id,
    'Classic Black Tee',
    'classic-black-tee',
    'A wardrobe essential. Clean cut, premium cotton, made to last. Available in multiple sizes.',
    2900,  -- 2900 cents = $29 / ~11,600 AMD
    '100% Premium Cotton',
    'new',
    TRUE
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NOT NULL THEN
    -- Variants
    INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock, reorder_level)
    VALUES
      (v_product_id, 'CBT-S-BLK',  'S',   'Black', '#000000', 10, 3),
      (v_product_id, 'CBT-M-BLK',  'M',   'Black', '#000000', 15, 3),
      (v_product_id, 'CBT-L-BLK',  'L',   'Black', '#000000', 12, 3),
      (v_product_id, 'CBT-XL-BLK', 'XL',  'Black', '#000000', 8,  3),
      (v_product_id, 'CBT-S-WHT',  'S',   'White', '#FFFFFF', 10, 3),
      (v_product_id, 'CBT-M-WHT',  'M',   'White', '#FFFFFF', 12, 3),
      (v_product_id, 'CBT-L-WHT',  'L',   'White', '#FFFFFF', 10, 3)
    ON CONFLICT (sku) DO NOTHING;
  END IF;

  -- Second product: Oversized Hoodie
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'men-hoodies';

  INSERT INTO products (category_id, name, slug, description, price, material, label, is_active)
  VALUES (
    v_cat_id,
    'Artsat Oversized Hoodie',
    'artsat-oversized-hoodie',
    'Our signature oversized hoodie. Heavyweight fleece, dropped shoulders, relaxed fit.',
    5900,  -- 5900 cents = $59
    '80% Cotton, 20% Polyester Fleece',
    'bestseller',
    TRUE
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NOT NULL THEN
    INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock, reorder_level)
    VALUES
      (v_product_id, 'AOH-S-BLK',  'S',  'Black', '#000000', 8,  3),
      (v_product_id, 'AOH-M-BLK',  'M',  'Black', '#000000', 12, 3),
      (v_product_id, 'AOH-L-BLK',  'L',  'Black', '#000000', 10, 3),
      (v_product_id, 'AOH-XL-BLK', 'XL', 'Black', '#000000', 6,  3),
      (v_product_id, 'AOH-M-GRY',  'M',  'Grey',  '#9CA3AF', 8,  3),
      (v_product_id, 'AOH-L-GRY',  'L',  'Grey',  '#9CA3AF', 7,  3)
    ON CONFLICT (sku) DO NOTHING;
  END IF;
END $$;
