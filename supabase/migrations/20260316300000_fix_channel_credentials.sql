-- Fix channel_credentials: add user_id column and RLS policies
-- The table was created without user_id, making RLS impossible.

ALTER TABLE public.channel_credentials
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_channel_credentials_user ON public.channel_credentials(user_id);

-- RLS SELECT policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own channel credentials' AND tablename = 'channel_credentials') THEN
    CREATE POLICY "Users can read own channel credentials" ON public.channel_credentials
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS ALL policy (insert, update, delete)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own channel credentials' AND tablename = 'channel_credentials') THEN
    CREATE POLICY "Users can manage own channel credentials" ON public.channel_credentials
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
