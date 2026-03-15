-- ClawHQ Migration: Pro Tier ($129) Feature Build
-- 1. pgvector for KB RAG embeddings
-- 2. webhook_deliveries for delivery logs + auto-retry
-- 3. api_key_usage_daily for per-key stats
-- 4. KB document embedding status support
-- 5. Vector similarity search RPC

-- ============================================================
-- 1. PGVECTOR: Enable extension + add embedding column to kb_chunks
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- 384 dimensions for all-MiniLM-L6-v2 model
ALTER TABLE public.kb_chunks
  ADD COLUMN IF NOT EXISTS embedding vector(384);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding
  ON public.kb_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================
-- 2. KB DOCUMENT: Add pending_embedding status
-- ============================================================

-- Widen status check constraint to allow 'pending_embedding'
ALTER TABLE public.kb_documents
  DROP CONSTRAINT IF EXISTS kb_documents_status_check;

ALTER TABLE public.kb_documents
  ADD CONSTRAINT kb_documents_status_check
  CHECK (status IN ('processing', 'indexed', 'error', 'pending_embedding'));

-- ============================================================
-- 3. VECTOR SIMILARITY SEARCH RPC
-- ============================================================

CREATE OR REPLACE FUNCTION search_kb_chunks_vector(
  p_user_id UUID,
  p_query_embedding vector(384),
  p_match_threshold FLOAT DEFAULT 0.3,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  chunk_content TEXT,
  chunk_document_id UUID,
  chunk_index INT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.content AS chunk_content,
    c.document_id AS chunk_document_id,
    c.chunk_index,
    1 - (c.embedding <=> p_query_embedding) AS similarity
  FROM public.kb_chunks c
  WHERE c.user_id = p_user_id
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. WEBHOOK DELIVERIES: Delivery log + auto-retry support
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status_code INT,
  response_body TEXT,  -- truncated to 1KB
  latency_ms INT,
  success BOOLEAN NOT NULL DEFAULT false,
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id
  ON public.webhook_deliveries(webhook_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_user_id
  ON public.webhook_deliveries(user_id, created_at DESC);

-- Index for retry cron: find failed deliveries due for retry
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry
  ON public.webhook_deliveries(next_retry_at)
  WHERE success = false AND retry_count < 3 AND next_retry_at IS NOT NULL;

-- RLS: users can read their own delivery logs
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own webhook deliveries' AND tablename = 'webhook_deliveries'
  ) THEN
    CREATE POLICY "Users can read own webhook deliveries"
      ON public.webhook_deliveries FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 5. API KEY USAGE DAILY: Per-key daily stats
-- ============================================================

CREATE TABLE IF NOT EXISTS public.api_key_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INT NOT NULL DEFAULT 0,
  tokens_used INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one row per key per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_key_usage_daily_unique
  ON public.api_key_usage_daily(key_id, date);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_daily_user
  ON public.api_key_usage_daily(user_id, date DESC);

-- RLS
ALTER TABLE public.api_key_usage_daily ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own api key usage' AND tablename = 'api_key_usage_daily'
  ) THEN
    CREATE POLICY "Users can read own api key usage"
      ON public.api_key_usage_daily FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RPC: Upsert daily usage (atomic increment)
CREATE OR REPLACE FUNCTION increment_api_key_daily_usage(
  p_key_id UUID,
  p_user_id UUID,
  p_is_error BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.api_key_usage_daily (key_id, user_id, date, request_count, error_count)
  VALUES (p_key_id, p_user_id, CURRENT_DATE, 1, CASE WHEN p_is_error THEN 1 ELSE 0 END)
  ON CONFLICT (key_id, date)
  DO UPDATE SET
    request_count = api_key_usage_daily.request_count + 1,
    error_count = api_key_usage_daily.error_count + CASE WHEN p_is_error THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================
-- 6. WEBHOOK DELIVERY STATS RPC: Success rate, avg latency
-- ============================================================

CREATE OR REPLACE FUNCTION get_webhook_delivery_stats(
  p_webhook_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'success_count', COUNT(*) FILTER (WHERE success = true),
    'failure_count', COUNT(*) FILTER (WHERE success = false),
    'success_rate', CASE
      WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC * 100, 1)
      ELSE 0
    END,
    'avg_latency_ms', COALESCE(AVG(latency_ms)::INT, 0),
    'daily', (
      SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.date), '[]'::json)
      FROM (
        SELECT
          DATE(created_at) AS date,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE success = true) AS successes,
          COUNT(*) FILTER (WHERE success = false) AS failures
        FROM public.webhook_deliveries
        WHERE webhook_id = p_webhook_id AND created_at >= period_start
        GROUP BY DATE(created_at)
      ) d
    )
  ) INTO result
  FROM public.webhook_deliveries
  WHERE webhook_id = p_webhook_id AND created_at >= period_start;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
