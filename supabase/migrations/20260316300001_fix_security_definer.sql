-- Fix SECURITY DEFINER functions that accept p_user_id without auth.uid() validation.
-- These functions bypass RLS and could allow users to query other users' data.

-- Fix search_kb_chunks_fts: add auth.uid() check
CREATE OR REPLACE FUNCTION search_kb_chunks_fts(
  p_user_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  chunk_content TEXT,
  chunk_document_id UUID,
  chunk_index INT,
  rank FLOAT4
) AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.content AS chunk_content,
    c.document_id AS chunk_document_id,
    c.chunk_index,
    ts_rank(c.search_vector, plainto_tsquery('english', p_query)) AS rank
  FROM public.kb_chunks c
  WHERE c.user_id = p_user_id
    AND c.search_vector @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix search_kb_chunks_vector: add auth.uid() check
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
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

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

-- Fix get_webhook_delivery_stats (first version): add auth.uid() check
-- This version accepts p_webhook_id without user ownership check.
CREATE OR REPLACE FUNCTION get_webhook_delivery_stats(
  p_webhook_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  period_start TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
BEGIN
  -- Verify the webhook belongs to the calling user
  IF NOT EXISTS (
    SELECT 1 FROM public.webhooks WHERE id = p_webhook_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

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
