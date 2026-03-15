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
