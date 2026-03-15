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
