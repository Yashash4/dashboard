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
-- ClawHQ Migration: Multi-model per agent with fallback chain

ALTER TABLE public.user_agents
  ADD COLUMN IF NOT EXISTS primary_model TEXT,
  ADD COLUMN IF NOT EXISTS fallback_model TEXT;

-- primary_model and fallback_model are both nullable.
-- If null, the agent uses the VPS default model.
-- ClawHQ Migration: Auto-responses and business hours

CREATE TABLE IF NOT EXISTS public.auto_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT, -- null = all channels
  type TEXT NOT NULL CHECK (type IN ('greeting', 'away', 'faq')),
  trigger_keyword TEXT, -- for FAQ type
  response_text TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_responses_user ON public.auto_responses(user_id);

ALTER TABLE public.auto_responses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own auto responses' AND tablename = 'auto_responses'
  ) THEN
    CREATE POLICY "Users can manage own auto responses"
      ON public.auto_responses FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT, -- null = all channels
  timezone TEXT NOT NULL DEFAULT 'UTC',
  monday_start TIME, monday_end TIME, monday_enabled BOOLEAN DEFAULT true,
  tuesday_start TIME, tuesday_end TIME, tuesday_enabled BOOLEAN DEFAULT true,
  wednesday_start TIME, wednesday_end TIME, wednesday_enabled BOOLEAN DEFAULT true,
  thursday_start TIME, thursday_end TIME, thursday_enabled BOOLEAN DEFAULT true,
  friday_start TIME, friday_end TIME, friday_enabled BOOLEAN DEFAULT true,
  saturday_start TIME, saturday_end TIME, saturday_enabled BOOLEAN DEFAULT false,
  sunday_start TIME, sunday_end TIME, sunday_enabled BOOLEAN DEFAULT false
);

-- Use coalesce-based unique index to handle NULL channel_type correctly
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_hours_user_channel
  ON public.business_hours (user_id, COALESCE(channel_type, '__all__'));

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own business hours' AND tablename = 'business_hours'
  ) THEN
    CREATE POLICY "Users can manage own business hours"
      ON public.business_hours FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;
-- ClawHQ Migration: Webhook enhancements (8 features)

-- 6.3 Event filtering per webhook
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS filter_conditions JSONB;

-- 6.4 Configurable retry policy
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS retry_max_attempts INTEGER DEFAULT 3 CHECK (retry_max_attempts BETWEEN 1 AND 10);
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS retry_interval_seconds INTEGER DEFAULT 30 CHECK (retry_interval_seconds > 0 AND retry_interval_seconds <= 900);

-- 6.5 Payload transformations
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS transformation TEXT;

-- 6.6 Pause/Resume
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;

-- 6.7 Event versioning
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS event_version TEXT DEFAULT 'v1';

-- 6.1 Event replay flag on deliveries
ALTER TABLE public.webhook_deliveries ADD COLUMN IF NOT EXISTS is_replay BOOLEAN DEFAULT false;
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
-- ClawHQ Migration: Logs Enhancement tables

-- 9.1 Saved log views
CREATE TABLE IF NOT EXISTS public.log_saved_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}', -- { search, level, lines }
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.log_saved_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own log views' AND tablename = 'log_saved_views') THEN
    CREATE POLICY "Users can manage own log views" ON public.log_saved_views FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 9.3 Log alerting rules
CREATE TABLE IF NOT EXISTS public.log_alert_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('keyword_count', 'level_count', 'pattern_match', 'absence')),
  condition_config JSONB NOT NULL DEFAULT '{}',
  notification_channel TEXT NOT NULL DEFAULT 'webhook', -- 'webhook' | 'email'
  notification_target TEXT, -- webhook URL or email
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.log_alert_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own log alerts' AND tablename = 'log_alert_rules') THEN
    CREATE POLICY "Users can manage own log alerts" ON public.log_alert_rules FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 9.7 Log forwarding config
CREATE TABLE IF NOT EXISTS public.log_forwarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_url TEXT NOT NULL,
  format TEXT DEFAULT 'json', -- 'json' | 'syslog'
  is_enabled BOOLEAN DEFAULT true,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.log_forwarding ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own log forwarding' AND tablename = 'log_forwarding') THEN
    CREATE POLICY "Users can manage own log forwarding" ON public.log_forwarding FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
-- ClawHQ Migration: Analytics Enhancement tables

-- 10.4 CSAT ratings
CREATE TABLE IF NOT EXISTS public.csat_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID,
  agent_id TEXT,
  channel_type TEXT DEFAULT 'webchat',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csat_user ON public.csat_ratings(user_id);
ALTER TABLE public.csat_ratings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own csat' AND tablename = 'csat_ratings') THEN
    CREATE POLICY "Users can manage own csat" ON public.csat_ratings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 10.6 Custom dashboards
CREATE TABLE IF NOT EXISTS public.analytics_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Dashboard',
  layout JSONB NOT NULL DEFAULT '[]', -- react-grid-layout items
  widgets JSONB NOT NULL DEFAULT '[]', -- widget configs
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own dashboards' AND tablename = 'analytics_dashboards') THEN
    CREATE POLICY "Users can manage own dashboards" ON public.analytics_dashboards FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 10.7 Behavioral cohorts
CREATE TABLE IF NOT EXISTS public.analytics_cohorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analytics_cohorts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own cohorts' AND tablename = 'analytics_cohorts') THEN
    CREATE POLICY "Users can manage own cohorts" ON public.analytics_cohorts FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 10.13 Scheduled reports
CREATE TABLE IF NOT EXISTS public.analytics_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT DEFAULT 'csv', -- 'csv' | 'json' | 'pdf'
  schedule TEXT DEFAULT 'weekly', -- 'daily' | 'weekly' | 'monthly'
  email TEXT,
  is_enabled BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own reports' AND tablename = 'analytics_reports') THEN
    CREATE POLICY "Users can manage own reports" ON public.analytics_reports FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
-- ClawHQ Migration: Audit Enhancement tables

-- 11.2 Tamper-proof hash chain
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entry_hash TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS previous_hash TEXT;

-- 11.1 SIEM streaming config
CREATE TABLE IF NOT EXISTS public.siem_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('http', 'datadog', 'splunk', 's3')),
  destination_url TEXT NOT NULL,
  api_key TEXT, -- encrypted
  format TEXT DEFAULT 'json', -- 'json' | 'cef'
  is_enabled BOOLEAN DEFAULT true,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.siem_configs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own siem config' AND tablename = 'siem_configs') THEN
    CREATE POLICY "Users can manage own siem config" ON public.siem_configs FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 11.6 Retention policy
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS audit_retention_days INTEGER DEFAULT 90;

-- 11.9 Date range filter index
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at);
