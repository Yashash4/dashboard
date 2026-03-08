-- ClawHQ Migration: API Keys — Pro Feature #3
-- Real API key generation, SHA-256 hashed, with authenticated proxy endpoint

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  usage_count INT DEFAULT 0,
  rate_limit_per_min INT DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- O(1) lookup by hash for key validation
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- Track which API key generated which analytics event
ALTER TABLE public.agent_analytics
  ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL;

-- RLS: users can see their own keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own api keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
