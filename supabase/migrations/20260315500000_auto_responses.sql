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
