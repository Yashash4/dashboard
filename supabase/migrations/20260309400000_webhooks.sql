-- ClawHQ Migration: Webhooks table (Pro Feature #5)

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  last_triggered_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IS NULL OR last_status IN ('success', 'failed')),
  last_status_code INT,
  failure_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);

-- RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own webhooks' AND tablename = 'webhooks'
  ) THEN
    CREATE POLICY "Users can manage own webhooks"
      ON public.webhooks FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
