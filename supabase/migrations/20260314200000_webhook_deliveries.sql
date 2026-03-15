-- ClawHQ Migration: Webhook delivery logs and stats

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status_code INT,
  response_body TEXT,
  latency_ms INT,
  success BOOLEAN NOT NULL DEFAULT false,
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_user_id ON public.webhook_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON public.webhook_deliveries(next_retry_at)
  WHERE success = false AND retry_count < 3 AND next_retry_at IS NOT NULL;

-- RLS
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own webhook deliveries' AND tablename = 'webhook_deliveries'
  ) THEN
    CREATE POLICY "Users can view own webhook deliveries"
      ON public.webhook_deliveries FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Stats RPC: returns delivery stats per webhook for the last 7 days
CREATE OR REPLACE FUNCTION get_webhook_delivery_stats(p_user_id UUID)
RETURNS TABLE (
  webhook_id UUID,
  total_deliveries BIGINT,
  successful_deliveries BIGINT,
  failed_deliveries BIGINT,
  avg_latency_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.webhook_id,
    COUNT(*)::BIGINT AS total_deliveries,
    COUNT(*) FILTER (WHERE wd.success = true)::BIGINT AS successful_deliveries,
    COUNT(*) FILTER (WHERE wd.success = false)::BIGINT AS failed_deliveries,
    ROUND(AVG(wd.latency_ms)::NUMERIC, 0) AS avg_latency_ms,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE wd.success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
    END AS success_rate
  FROM public.webhook_deliveries wd
  WHERE wd.user_id = p_user_id
    AND wd.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY wd.webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
