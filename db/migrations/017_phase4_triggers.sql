-- Phase 4: Triggers for Stripe / payment updates

-- Update orders.updated_at when stripe payment fields change
-- (orders already has an updated_at trigger from migration 002; nothing extra needed)

-- Auto-set refunds.completed_at when status changes to 'succeeded' or 'failed'
CREATE OR REPLACE FUNCTION public.handle_refund_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('succeeded', 'failed') AND OLD.status = 'pending' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refund_status_change ON public.refunds;
CREATE TRIGGER refund_status_change
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_refund_status_change();

-- Mark orders as refunded when a full refund is completed
CREATE OR REPLACE FUNCTION public.handle_full_refund_complete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'succeeded' THEN
    UPDATE public.orders o
    SET
      payment_status   = 'refunded',
      refunded_at      = NOW(),
      refund_amount    = (SELECT COALESCE(SUM(amount), 0) FROM public.refunds WHERE order_id = NEW.order_id AND status = 'succeeded'),
      refund_reason    = NEW.reason
    WHERE o.id = NEW.order_id
      AND o.total <= (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.refunds
        WHERE order_id = NEW.order_id AND status = 'succeeded'
      ) + NEW.amount;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS full_refund_complete ON public.refunds;
CREATE TRIGGER full_refund_complete
  AFTER UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_full_refund_complete();
