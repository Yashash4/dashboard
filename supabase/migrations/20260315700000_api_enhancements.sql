-- ClawHQ Migration: API Enhancement tables

-- 7.10 Idempotency cache
CREATE TABLE IF NOT EXISTS public.idempotency_cache (
  key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status_code INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  PRIMARY KEY (key, user_id)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_cache(expires_at);

ALTER TABLE public.idempotency_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own idempotency' AND tablename = 'idempotency_cache') THEN
    CREATE POLICY "Users can manage own idempotency" ON public.idempotency_cache FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7.17 Threads
CREATE TABLE IF NOT EXISTS public.api_threads (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_threads_user ON public.api_threads(user_id);

ALTER TABLE public.api_threads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own threads' AND tablename = 'api_threads'
  ) THEN
    CREATE POLICY "Users can manage own threads"
      ON public.api_threads FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.api_thread_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES public.api_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT,
  attachments JSONB,
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thread_messages_thread ON public.api_thread_messages(thread_id);

-- RLS for thread messages (access via thread ownership check in API routes)
ALTER TABLE public.api_thread_messages ENABLE ROW LEVEL SECURITY;
-- Thread messages are accessed through the thread, which is user-scoped.
-- We allow access if the thread belongs to the user (checked in API routes).
-- For direct access, deny all — API routes use admin client.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'No direct access to thread messages' AND tablename = 'api_thread_messages') THEN
    CREATE POLICY "No direct access to thread messages" ON public.api_thread_messages FOR ALL USING (false);
  END IF;
END $$;

-- 7.11 Batches
CREATE TABLE IF NOT EXISTS public.api_batches (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'processing',
  total INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  results JSONB,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.api_batches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own batches' AND tablename = 'api_batches'
  ) THEN
    CREATE POLICY "Users can manage own batches"
      ON public.api_batches FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7.12 Predictions
CREATE TABLE IF NOT EXISTS public.api_predictions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'processing',
  request_body JSONB,
  response_body JSONB,
  webhook_url TEXT,
  webhook_delivered BOOLEAN DEFAULT false,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.api_predictions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own predictions' AND tablename = 'api_predictions'
  ) THEN
    CREATE POLICY "Users can manage own predictions"
      ON public.api_predictions FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7.2 Request ID tracking on analytics
ALTER TABLE public.agent_analytics ADD COLUMN IF NOT EXISTS request_id TEXT;
ALTER TABLE public.agent_analytics ADD COLUMN IF NOT EXISTS client_request_id TEXT;
