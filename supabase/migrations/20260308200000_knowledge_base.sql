-- ClawHQ Migration: Knowledge Base (RAG) — Pro Feature #1

-- Documents metadata
CREATE TABLE IF NOT EXISTS public.kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'txt', 'md', 'csv', 'url')),
  source_url TEXT,
  storage_path TEXT,
  file_size BIGINT DEFAULT 0,
  chunk_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'indexed', 'error')),
  error_message TEXT,
  indexed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_documents_user_id ON public.kb_documents(user_id);

-- Chunked text for search
CREATE TABLE IF NOT EXISTS public.kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.kb_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_chunks_document_id ON public.kb_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_user_id ON public.kb_chunks(user_id);

-- RLS
ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own kb docs" ON public.kb_documents FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own kb chunks" ON public.kb_chunks FOR SELECT USING (auth.uid() = user_id);

-- Storage bucket (run manually in Supabase dashboard: Settings → Storage → New Bucket "knowledge-base", private)
