-- Phase 4: Create stripe_webhooks and refunds tables

-- ─── stripe_webhooks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_webhooks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id  TEXT UNIQUE NOT NULL,
  event_type       TEXT NOT NULL,
  order_id         UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payload          JSONB NOT NULL,
  processed        BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at     TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── refunds ──────────────────────────────────────────────────────────────────
CREATE TYPE refund_status AS ENUM ('pending', 'succeeded', 'failed');

CREATE TABLE IF NOT EXISTS public.refunds (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  stripe_refund_id TEXT UNIQUE NOT NULL,
  amount           INTEGER NOT NULL,  -- cents
  reason           TEXT NOT NULL,     -- 'requested_by_customer' | 'duplicate' | 'fraudulent'
  status           refund_status NOT NULL DEFAULT 'pending',
  requested_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  failure_reason   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.stripe_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- stripe_webhooks: admin SELECT only
CREATE POLICY "Admin can select stripe_webhooks"
  ON public.stripe_webhooks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- refunds: admin SELECT/INSERT/UPDATE
CREATE POLICY "Admin can select refunds"
  ON public.refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can insert refunds"
  ON public.refunds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update refunds"
  ON public.refunds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
