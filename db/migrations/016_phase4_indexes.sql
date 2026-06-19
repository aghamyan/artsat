-- Phase 4: Indexes for Stripe tables

CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_type
  ON public.stripe_webhooks (event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_order_id
  ON public.stripe_webhooks (order_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed
  ON public.stripe_webhooks (processed);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id
  ON public.refunds (order_id);

CREATE INDEX IF NOT EXISTS idx_refunds_status
  ON public.refunds (status);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_charge_id
  ON public.orders (stripe_charge_id)
  WHERE stripe_charge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created
  ON public.orders (payment_status, created_at DESC);
