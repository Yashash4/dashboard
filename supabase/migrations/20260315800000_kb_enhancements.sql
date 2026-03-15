-- ClawHQ Migration: KB/RAG Enhancement tables

-- 8.4 Metadata filtering
ALTER TABLE public.kb_chunks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 8.5 Parent document retrieval
ALTER TABLE public.kb_chunks ADD COLUMN IF NOT EXISTS parent_chunk_id UUID REFERENCES public.kb_chunks(id);

-- 8.6 Chunk editing support
ALTER TABLE public.kb_chunks ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

-- 8.10 Feedback loop
CREATE TABLE IF NOT EXISTS public.kb_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL,
  document_id UUID NOT NULL,
  query TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)), -- -1 = thumbs down, 1 = thumbs up
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_feedback_user ON public.kb_feedback(user_id);
ALTER TABLE public.kb_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own kb feedback' AND tablename = 'kb_feedback') THEN
    CREATE POLICY "Users can manage own kb feedback" ON public.kb_feedback FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 8.7 Document connectors
CREATE TABLE IF NOT EXISTS public.kb_connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('url_sync', 'google_drive', 'notion')),
  config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kb_connectors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own kb connectors' AND tablename = 'kb_connectors') THEN
    CREATE POLICY "Users can manage own kb connectors" ON public.kb_connectors FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 8.12 KB Analytics
ALTER TABLE public.kb_documents ADD COLUMN IF NOT EXISTS avg_relevance_score NUMERIC DEFAULT 0;
ALTER TABLE public.kb_documents ADD COLUMN IF NOT EXISTS last_retrieved_at TIMESTAMPTZ;

-- Hybrid search RPC (8.1) - combines vector + FTS with RRF
CREATE OR REPLACE FUNCTION search_kb_chunks_hybrid(
  p_user_id UUID,
  p_query_embedding TEXT,
  p_query_text TEXT,
  p_match_threshold FLOAT DEFAULT 0.3,
  p_limit INT DEFAULT 10
) RETURNS TABLE (
  chunk_id UUID,
  chunk_document_id UUID,
  chunk_content TEXT,
  chunk_metadata JSONB,
  vector_rank INT,
  fts_rank INT,
  rrf_score FLOAT
) AS $$
DECLARE
  k CONSTANT INT := 60; -- RRF constant
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT c.id, c.document_id, c.content, c.metadata,
      ROW_NUMBER() OVER (ORDER BY c.embedding <=> p_query_embedding::vector) AS rank
    FROM public.kb_chunks c
    WHERE c.user_id = p_user_id
      AND c.embedding IS NOT NULL
      AND (1 - (c.embedding <=> p_query_embedding::vector)) >= p_match_threshold
    LIMIT p_limit * 2
  ),
  fts_results AS (
    SELECT c.id, c.document_id, c.content, c.metadata,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', p_query_text)) DESC) AS rank
    FROM public.kb_chunks c
    WHERE c.user_id = p_user_id
      AND to_tsvector('english', c.content) @@ plainto_tsquery('english', p_query_text)
    LIMIT p_limit * 2
  ),
  combined AS (
    SELECT
      COALESCE(v.id, f.id) AS cid,
      COALESCE(v.document_id, f.document_id) AS cdoc,
      COALESCE(v.content, f.content) AS ccontent,
      COALESCE(v.metadata, f.metadata) AS cmeta,
      v.rank AS vrank,
      f.rank AS frank,
      COALESCE(1.0 / (k + v.rank), 0) + COALESCE(1.0 / (k + f.rank), 0) AS score
    FROM vector_results v
    FULL OUTER JOIN fts_results f ON v.id = f.id
  )
  SELECT cid, cdoc, ccontent, cmeta,
    COALESCE(vrank, 0)::INT, COALESCE(frank, 0)::INT, score::FLOAT
  FROM combined
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
