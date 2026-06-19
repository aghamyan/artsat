-- Phase 7: AI & Advanced Features
-- Run in Supabase SQL Editor after 018_phase6_analytics.sql

-- ──────────────────────────────────────────────────
-- 1. Enable pgvector extension
-- ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ──────────────────────────────────────────────────
-- 2. Product columns for AI-generated content
-- ──────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description_generated     BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS description_generated_by  TEXT,        -- 'gpt-4o', etc.
  ADD COLUMN IF NOT EXISTS ai_tags                   TEXT[]    DEFAULT '{}';

-- ──────────────────────────────────────────────────
-- 3. product_embeddings — vector similarity search
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_embeddings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  embedding    vector(1536),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_vec
  ON product_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;
-- Public can read embeddings (needed for recommendation API)
CREATE POLICY "embeddings_read_public"   ON product_embeddings FOR SELECT USING (TRUE);
-- Only service role writes (via createServiceClient in services)
CREATE POLICY "embeddings_write_service" ON product_embeddings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- ──────────────────────────────────────────────────
-- 4. RPC for cosine-similarity product search
-- ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_similar_products(
  query_embedding vector(1536),
  exclude_id      UUID,
  match_count     INT DEFAULT 5
)
RETURNS TABLE (product_id UUID, similarity FLOAT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.product_id,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM product_embeddings pe
  WHERE pe.product_id <> exclude_id
    AND pe.embedding <=> query_embedding < 0.5
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ──────────────────────────────────────────────────
-- 5. support_conversations — AI chatbot history
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,                          -- anonymous sessions
  messages   JSONB       NOT NULL DEFAULT '[]',
  status     TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'escalated', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_user   ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_own"   ON support_conversations FOR ALL
  USING (user_id = auth.uid() OR session_id IS NOT NULL);
CREATE POLICY "conversations_admin" ON support_conversations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- ──────────────────────────────────────────────────
-- 6. support_tickets — escalated conversations
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        REFERENCES support_conversations(id) ON DELETE SET NULL,
  user_id         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  subject         TEXT,
  status          TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority        TEXT        NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user   ON support_tickets(user_id);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets_own"   ON support_tickets FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "tickets_admin" ON support_tickets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- ──────────────────────────────────────────────────
-- 7. customer_segments — AI segmentation results
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_segments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  segment     TEXT        NOT NULL, -- 'vip', 'loyal', 'at_risk', 'new', 'high_potential'
  score       FLOAT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_segments_segment ON customer_segments(segment);

ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "segments_admin" ON customer_segments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- ──────────────────────────────────────────────────
-- 8. ai_cache — deduplicate expensive AI calls
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_cache (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key  TEXT        NOT NULL UNIQUE,
  value      JSONB       NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key        ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires_at ON ai_cache(expires_at);

ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_cache_admin" ON ai_cache FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- ──────────────────────────────────────────────────
-- 9. ai_usage_log — cost tracking
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feature      TEXT        NOT NULL,  -- 'recommendation', 'chatbot', 'description', etc.
  model        TEXT        NOT NULL,
  prompt_tokens    INT     NOT NULL DEFAULT 0,
  completion_tokens INT    NOT NULL DEFAULT 0,
  total_tokens INT         NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_log(created_at);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_admin" ON ai_usage_log FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- ──────────────────────────────────────────────────
-- 10. Trigger: updated_at on support tables
-- ──────────────────────────────────────────────────
CREATE TRIGGER set_support_conversations_updated_at
  BEFORE UPDATE ON support_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
