-- Migration 018: Phase 6 — Analytics & Automation
-- Run after 017_phase4_triggers.sql

-- ============================================================
-- WIDEN email_logs.email_type to support automation emails
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
    'return_update',
    'payment_confirmation',
    'payment_failed',
    'refund_confirmation',
    'abandoned_cart',
    'payment_retry'
  ));

-- ============================================================
-- AUTOMATION LOGS (track when cron jobs ran)
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name    TEXT NOT NULL,             -- 'abandoned_cart', 'review_invitations', etc.
  status      TEXT NOT NULL DEFAULT 'success'
                CHECK (status IN ('success', 'failed', 'skipped')),
  processed   INTEGER NOT NULL DEFAULT 0,
  skipped     INTEGER NOT NULL DEFAULT 0,
  errors      INTEGER NOT NULL DEFAULT 0,
  details     JSONB,
  triggered_by TEXT NOT NULL DEFAULT 'cron', -- 'cron' | 'manual'
  run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automation_logs_job ON automation_logs(job_name, run_at DESC);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_logs_admin" ON automation_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- ============================================================
-- A/B TESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ab_tests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  variants     JSONB NOT NULL DEFAULT '[]',   -- [{id, name, ...extra}]
  traffic_split JSONB NOT NULL DEFAULT '{}',  -- {variantId: 0.5, ...}
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  winner       TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ab_tests_admin" ON ab_tests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- ============================================================
-- A/B TEST ASSIGNMENTS (deterministic user→variant mapping)
-- ============================================================
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id    UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,                  -- for anonymous users
  variant    TEXT NOT NULL,
  converted  BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ab_assignment_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL),
  UNIQUE (test_id, user_id),
  UNIQUE (test_id, session_id)
);

CREATE INDEX idx_ab_assignments_test ON ab_test_assignments(test_id);

ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ab_assignments_admin" ON ab_test_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));
CREATE POLICY "ab_assignments_own_insert" ON ab_test_assignments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR session_id IS NOT NULL
  );
CREATE POLICY "ab_assignments_own_update" ON ab_test_assignments FOR UPDATE
  USING (user_id = auth.uid() OR session_id IS NOT NULL);
