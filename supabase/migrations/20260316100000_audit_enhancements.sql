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
