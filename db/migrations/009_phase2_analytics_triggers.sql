-- Migration 009: Phase 2 — Analytics atomic increment + ratings trigger

-- ============================================================
-- FUNCTION: increment_product_analytic
-- Atomically increments a counter in product_analytics.
-- Uses INSERT ... ON CONFLICT DO UPDATE to avoid race conditions.
-- Called from API routes via supabase.rpc().
-- ============================================================
CREATE OR REPLACE FUNCTION increment_product_analytic(
  p_product_id UUID,
  p_event      TEXT,  -- 'views' | 'searches' | 'add_to_cart'
  p_date       DATE DEFAULT CURRENT_DATE,
  p_query      TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_event NOT IN ('views', 'searches', 'add_to_cart') THEN
    RAISE EXCEPTION 'Invalid event type: %', p_event;
  END IF;

  INSERT INTO product_analytics (product_id, date, views, searches, add_to_cart, searches_from_query)
  VALUES (
    p_product_id,
    p_date,
    CASE WHEN p_event = 'views'       THEN 1 ELSE 0 END,
    CASE WHEN p_event = 'searches'    THEN 1 ELSE 0 END,
    CASE WHEN p_event = 'add_to_cart' THEN 1 ELSE 0 END,
    p_query
  )
  ON CONFLICT (product_id, date) DO UPDATE SET
    views       = product_analytics.views       + CASE WHEN p_event = 'views'       THEN 1 ELSE 0 END,
    searches    = product_analytics.searches    + CASE WHEN p_event = 'searches'    THEN 1 ELSE 0 END,
    add_to_cart = product_analytics.add_to_cart + CASE WHEN p_event = 'add_to_cart' THEN 1 ELSE 0 END,
    searches_from_query = COALESCE(p_query, product_analytics.searches_from_query);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION + TRIGGER: refresh_product_rating
-- Recalculates aggregate rating after insert/update/delete on reviews
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  INSERT INTO product_ratings (
    product_id, average_rating, review_count,
    star_5_count, star_4_count, star_3_count, star_2_count, star_1_count,
    updated_at
  )
  SELECT
    v_product_id,
    COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1),
    NOW()
  FROM product_reviews
  WHERE product_id = v_product_id AND is_approved = TRUE
  ON CONFLICT (product_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    review_count   = EXCLUDED.review_count,
    star_5_count   = EXCLUDED.star_5_count,
    star_4_count   = EXCLUDED.star_4_count,
    star_3_count   = EXCLUDED.star_3_count,
    star_2_count   = EXCLUDED.star_2_count,
    star_1_count   = EXCLUDED.star_1_count,
    updated_at     = EXCLUDED.updated_at;

  -- Keep products.average_rating in sync for sort queries
  UPDATE products
  SET average_rating = (
    SELECT COALESCE(average_rating, 0)
    FROM product_ratings
    WHERE product_id = v_product_id
  )
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_refresh_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_product_rating();

-- ============================================================
-- FUNCTION: sync_collection_ids_on_product
-- Keeps products.collection_ids in sync when collection_products changes
-- ============================================================
CREATE OR REPLACE FUNCTION sync_product_collection_ids()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE products
  SET collection_ids = (
    SELECT ARRAY_AGG(collection_id)
    FROM collection_products
    WHERE product_id = v_product_id
  )
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_sync_collection_ids
  AFTER INSERT OR DELETE ON collection_products
  FOR EACH ROW EXECUTE FUNCTION sync_product_collection_ids();
