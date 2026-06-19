-- Migration 013: Phase 3 — Triggers

-- ============================================================
-- Auto-create email_preferences row on new profile
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_profile_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (customer_id)
  VALUES (NEW.id)
  ON CONFLICT (customer_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_prefs ON profiles;
CREATE TRIGGER on_profile_created_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile_prefs();

-- ============================================================
-- Update product_ratings when a review is approved/inserted
-- (extends the Phase 2 trigger — replace it)
-- ============================================================
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Determine which product to update
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  INSERT INTO product_ratings (
    product_id, average_rating, review_count,
    star_5_count, star_4_count, star_3_count, star_2_count, star_1_count,
    updated_at
  )
  SELECT
    v_product_id,
    COALESCE(AVG(rating), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1),
    NOW()
  FROM product_reviews
  WHERE product_id = v_product_id
    AND is_approved = TRUE
  ON CONFLICT (product_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    review_count   = EXCLUDED.review_count,
    star_5_count   = EXCLUDED.star_5_count,
    star_4_count   = EXCLUDED.star_4_count,
    star_3_count   = EXCLUDED.star_3_count,
    star_2_count   = EXCLUDED.star_2_count,
    star_1_count   = EXCLUDED.star_1_count,
    updated_at     = NOW();

  -- Sync denormalised average_rating on products table
  UPDATE products
  SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM product_reviews
    WHERE product_id = v_product_id AND is_approved = TRUE
  )
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS review_rating_update ON product_reviews;
CREATE TRIGGER review_rating_update
  AFTER INSERT OR UPDATE OF is_approved, rating OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================================
-- Enforce single default address per customer per type
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE customer_id = NEW.customer_id
      AND id <> NEW.id
      AND is_default = TRUE;
  END IF;

  IF NEW.is_billing = TRUE THEN
    UPDATE customer_addresses
    SET is_billing = FALSE
    WHERE customer_id = NEW.customer_id
      AND id <> NEW.id
      AND is_billing = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS single_default_address ON customer_addresses;
CREATE TRIGGER single_default_address
  BEFORE INSERT OR UPDATE OF is_default, is_billing ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION enforce_single_default_address();
