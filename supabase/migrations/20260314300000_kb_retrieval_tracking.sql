-- ClawHQ Migration: KB document retrieval tracking

-- Add retrieval_count column to kb_documents
ALTER TABLE public.kb_documents
  ADD COLUMN IF NOT EXISTS retrieval_count INT NOT NULL DEFAULT 0;

-- RPC to atomically increment retrieval count
CREATE OR REPLACE FUNCTION increment_kb_retrieval_count(p_document_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.kb_documents
  SET retrieval_count = retrieval_count + 1
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
