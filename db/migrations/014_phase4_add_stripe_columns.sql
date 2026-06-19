-- Phase 4: Add Stripe payment columns to orders table
-- Run this in Supabase SQL editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_customer_id       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id        TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id         TEXT,
  ADD COLUMN IF NOT EXISTS payment_intent_client_secret TEXT,
  ADD COLUMN IF NOT EXISTS amount_received          INTEGER,
  ADD COLUMN IF NOT EXISTS payment_metadata         JSONB,
  ADD COLUMN IF NOT EXISTS risk_level               TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS sca_required             BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_payment_error       TEXT,
  ADD COLUMN IF NOT EXISTS refund_requested_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount            INTEGER,
  ADD COLUMN IF NOT EXISTS refund_reason            TEXT;

-- stripe_payment_intent_id already exists from Phase 1 schema
-- payment_method already exists from Phase 1 schema

-- Add unique constraint on stripe_payment_intent_id (nullable — not enforced on NULL)
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_payment_intent_id_key
  ON public.orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
