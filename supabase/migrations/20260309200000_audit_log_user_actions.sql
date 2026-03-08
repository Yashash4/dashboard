-- ClawHQ Migration: Extend audit_logs for user actions (Pro Feature #4)
-- Currently admin-only (admin_id). Add user_id, category, actor_type.

-- Add user_id column (nullable — admin actions won't have it)
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add category for filtering (auth, vps, agent, model, api_key, billing, account, knowledge_base)
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Add actor_type to distinguish user/admin/system actions
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'user';

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id, created_at DESC);

-- RLS policy: users can read their own audit logs (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own audit logs' AND tablename = 'audit_logs'
  ) THEN
    CREATE POLICY "Users can read own audit logs"
      ON public.audit_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;
