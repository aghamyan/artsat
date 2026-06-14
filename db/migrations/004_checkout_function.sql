-- Migration 004: Atomic order creation stored procedure
-- This is the ONLY correct way to create an order — all-or-nothing transaction.
-- Called via: supabase.rpc('create_order_transaction', { ... })

CREATE OR REPLACE FUNCTION create_order_transaction(
  p_user_id           UUID,
  p_guest_email       TEXT,
  p_guest_token       TEXT,
  p_shipping          JSONB,         -- {full_name, email, phone, address_line1, address_line2, city, postal_code, country, notes}
  p_items             JSONB,         -- [{variant_id, quantity}]
  p_payment_method    TEXT,
  p_discount_code     TEXT DEFAULT NULL,
  p_cart_id           UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id          UUID;
  v_order_number      TEXT;
  v_subtotal          INTEGER := 0;
  v_shipping_fee      INTEGER := 0;
  v_discount_amount   INTEGER := 0;
  v_total             INTEGER := 0;
  v_discount_code_id  UUID;
  v_item              JSONB;
  v_variant           RECORD;
  v_product           RECORD;
  v_unit_price        INTEGER;
  v_item_quantity     INTEGER;
  v_line_total        INTEGER;
  v_discount_rec      RECORD;
BEGIN
  -- ── 1. Validate each item: existence, stock, price ─────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_quantity := (v_item->>'quantity')::INTEGER;

    IF v_item_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY: quantity must be positive';
    END IF;

    SELECT
      pv.id, pv.stock, pv.is_active, pv.sku, pv.size, pv.color, pv.price_delta,
      p.price AS base_price, p.name AS product_name, p.is_active AS product_active,
      p.deleted_at, p.id AS product_id
    INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = (v_item->>'variant_id')::UUID;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'VARIANT_NOT_FOUND: variant % does not exist', v_item->>'variant_id';
    END IF;

    IF NOT v_variant.is_active OR NOT v_variant.product_active OR v_variant.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE: % is no longer available', v_variant.product_name;
    END IF;

    IF v_variant.stock < v_item_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: only % units of % available', v_variant.stock, v_variant.product_name;
    END IF;

    v_unit_price := v_variant.base_price + v_variant.price_delta;
    v_line_total := v_unit_price * v_item_quantity;
    v_subtotal   := v_subtotal + v_line_total;
  END LOOP;

  -- ── 2. Calculate shipping fee ───────────────────────────────────────────────
  -- Free shipping above 15000 AMD (1500000 cents) — adjust as needed
  IF v_subtotal >= 1500000 THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := 100000; -- 1000 AMD in cents
  END IF;

  -- ── 3. Validate and apply discount code ────────────────────────────────────
  IF p_discount_code IS NOT NULL AND p_discount_code != '' THEN
    SELECT * INTO v_discount_rec
    FROM discount_codes
    WHERE code = UPPER(p_discount_code)
      AND is_active = TRUE
      AND (valid_until IS NULL OR valid_until > NOW())
      AND valid_from <= NOW()
      AND (max_uses IS NULL OR uses_count < max_uses)
    FOR UPDATE; -- lock row to prevent race conditions

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_DISCOUNT: code "%" is not valid or has expired', p_discount_code;
    END IF;

    IF v_subtotal < COALESCE(v_discount_rec.minimum_amount, 0) THEN
      RAISE EXCEPTION 'DISCOUNT_MINIMUM_NOT_MET: minimum order amount is %', v_discount_rec.minimum_amount;
    END IF;

    IF v_discount_rec.type = 'percentage' THEN
      v_discount_amount := (v_subtotal * v_discount_rec.value) / 100;
    ELSE
      v_discount_amount := LEAST(v_discount_rec.value, v_subtotal);
    END IF;

    v_discount_code_id := v_discount_rec.id;

    -- Increment usage count
    UPDATE discount_codes
    SET uses_count = uses_count + 1
    WHERE id = v_discount_rec.id;
  END IF;

  -- ── 4. Calculate total ─────────────────────────────────────────────────────
  v_total := GREATEST(0, v_subtotal + v_shipping_fee - v_discount_amount);

  -- ── 5. Insert order ────────────────────────────────────────────────────────
  INSERT INTO orders (
    user_id, guest_email, guest_token,
    shipping_full_name, shipping_email, shipping_phone,
    shipping_address_line1, shipping_address_line2,
    shipping_city, shipping_postal_code, shipping_country, shipping_notes,
    subtotal, shipping_fee, discount_amount, total,
    discount_code_id, discount_code_used,
    payment_method, status, payment_status
  ) VALUES (
    p_user_id,
    p_guest_email,
    p_guest_token,
    p_shipping->>'full_name',
    p_shipping->>'email',
    p_shipping->>'phone',
    p_shipping->>'address_line1',
    p_shipping->>'address_line2',
    p_shipping->>'city',
    p_shipping->>'postal_code',
    COALESCE(p_shipping->>'country', 'Armenia'),
    p_shipping->>'notes',
    v_subtotal, v_shipping_fee, v_discount_amount, v_total,
    v_discount_code_id,
    p_discount_code,
    p_payment_method,
    'pending',
    'pending'
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- ── 6. Insert order items + decrement stock ────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_quantity := (v_item->>'quantity')::INTEGER;

    SELECT
      pv.id, pv.stock, pv.sku, pv.size, pv.color, pv.price_delta,
      p.price AS base_price, p.name AS product_name, p.id AS product_id
    INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = (v_item->>'variant_id')::UUID;

    v_unit_price := v_variant.base_price + v_variant.price_delta;
    v_line_total := v_unit_price * v_item_quantity;

    INSERT INTO order_items (
      order_id, product_id, variant_id,
      product_name, variant_sku, variant_size, variant_color,
      unit_price, quantity, total_price
    ) VALUES (
      v_order_id,
      v_variant.product_id,
      v_variant.id,
      v_variant.product_name,
      v_variant.sku,
      v_variant.size,
      v_variant.color,
      v_unit_price,
      v_item_quantity,
      v_line_total
    );

    -- Atomic stock decrement with race-condition check
    UPDATE product_variants
    SET stock = stock - v_item_quantity
    WHERE id = v_variant.id
      AND stock >= v_item_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'STOCK_RACE: stock for % changed during checkout, please try again', v_variant.product_name;
    END IF;
  END LOOP;

  -- ── 7. Clear cart if provided ──────────────────────────────────────────────
  IF p_cart_id IS NOT NULL THEN
    UPDATE carts SET items = '[]'::JSONB WHERE id = p_cart_id;
  END IF;

  -- ── 8. Return order details ────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', v_order_number,
    'total',        v_total,
    'subtotal',     v_subtotal,
    'shipping_fee', v_shipping_fee,
    'discount',     v_discount_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction auto-rolls back; re-raise with structured message
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant execute to authenticated users (checkout goes via server route with service_role anyway)
REVOKE ALL ON FUNCTION create_order_transaction FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order_transaction TO service_role;
