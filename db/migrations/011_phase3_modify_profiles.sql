-- Migration 011: Phase 3 — Modify profiles table + ALTER product_reviews

-- ============================================================
-- ALTER profiles — add Phase 3 columns
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE,
  ADD COLUMN IF NOT EXISTS gender            TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS phone_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS account_status    TEXT NOT NULL DEFAULT 'active'
                                               CHECK (account_status IN ('active', 'suspended', 'deleted')),
  ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMPTZ;

-- ============================================================
-- ALTER product_reviews — add Phase 3 columns
-- (table created in migration 006; only ADD missing columns)
-- ============================================================
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS order_item_id      UUID REFERENCES order_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unhelpful_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moderation_notes   TEXT,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_product_reviews_order_item ON product_reviews(order_item_id);

-- Add updated_at trigger for reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'product_reviews_updated_at'
  ) THEN
    CREATE TRIGGER product_reviews_updated_at
      BEFORE UPDATE ON product_reviews
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add own-review select policy so customers can see their own pending reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'product_reviews' AND policyname = 'reviews_select_own'
  ) THEN
    CREATE POLICY "reviews_select_own" ON product_reviews FOR SELECT
      USING (customer_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- Extend email_logs to accept Phase 3 email types
-- ============================================================
ALTER TABLE email_logs
  DROP CONSTRAINT IF EXISTS email_logs_email_type_check;

ALTER TABLE email_logs
  ADD CONSTRAINT email_logs_email_type_check
    CHECK (email_type IN (
      'order_confirmation',
      'admin_alert',
      'status_update',
      'low_stock',
      'review_invitation',
      'return_update'
    ));
