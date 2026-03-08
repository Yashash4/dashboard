-- ClawHQ Migration: Knowledge Base Full-Text Search (replaces ILIKE)
-- Adds tsvector column with GIN index + ranked search RPC function

-- Add search_vector column (auto-generated from content)
ALTER TABLE public.kb_chunks
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_kb_chunks_search_vector
  ON public.kb_chunks USING GIN (search_vector);

-- RPC function for ranked FTS search
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
