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
