-- ClawHQ Migration: Tasks #43, #45, #46, #48

-- Task #43: Agent Analytics
CREATE TABLE IF NOT EXISTS public.agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_lookup ON public.agent_analytics(user_id, agent_id, created_at DESC);

-- Task #45: Channel Health columns
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'unknown';
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Task #46: Encrypted Credentials
CREATE TABLE IF NOT EXISTS public.channel_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task #48: Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- RLS Policies
ALTER TABLE public.agent_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own analytics" ON public.agent_analytics FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.channel_credentials ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
