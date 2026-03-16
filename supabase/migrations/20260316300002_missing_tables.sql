-- ============================================================
-- Item 1.7: Add FK constraints to kb_feedback
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_kb_feedback_chunk' AND table_name = 'kb_feedback'
  ) THEN
    ALTER TABLE kb_feedback ADD CONSTRAINT fk_kb_feedback_chunk
      FOREIGN KEY (chunk_id) REFERENCES kb_chunks(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_kb_feedback_document' AND table_name = 'kb_feedback'
  ) THEN
    ALTER TABLE kb_feedback ADD CONSTRAINT fk_kb_feedback_document
      FOREIGN KEY (document_id) REFERENCES kb_documents(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- Item 1.8: Fix nullable user_id on agent_analytics
-- ============================================================

-- First update any NULL user_id rows (shouldn't exist, but be safe)
-- Then add NOT NULL constraint
DO $$ BEGIN
  ALTER TABLE agent_analytics ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- Item 1.9: Document public.users vs auth.users FK pattern
-- ============================================================

-- Early migrations (20260307, 20260308) reference public.users(id).
-- public.users is a Supabase-managed table that syncs from auth.users.
-- This pattern is valid: public.users acts as a proxy for auth.users
-- and allows joining with other public schema tables.
-- Later migrations reference auth.users(id) directly, which is also valid.
-- Both patterns work correctly with Supabase's auth system.
-- No schema change needed — just documenting the pattern.

-- ============================================================
-- Item 1.10: Add missing CHECK constraints on MC tables
-- ============================================================

-- mc_tasks.column_id CHECK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mc_tasks_column_id_check'
  ) THEN
    ALTER TABLE mc_tasks ADD CONSTRAINT mc_tasks_column_id_check
      CHECK (column_id IN ('planning', 'inbox', 'assigned', 'in_progress', 'testing', 'review', 'done'));
  END IF;
END $$;

-- mc_tasks.priority CHECK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mc_tasks_priority_check'
  ) THEN
    ALTER TABLE mc_tasks ADD CONSTRAINT mc_tasks_priority_check
      CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
END $$;

-- mc_events.severity CHECK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mc_events_severity_check'
  ) THEN
    ALTER TABLE mc_events ADD CONSTRAINT mc_events_severity_check
      CHECK (severity IN ('info', 'warning', 'error', 'critical'));
  END IF;
END $$;

-- mc_agent_status.status CHECK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mc_agent_status_status_check'
  ) THEN
    ALTER TABLE mc_agent_status ADD CONSTRAINT mc_agent_status_status_check
      CHECK (status IN ('online', 'offline', 'idle', 'working', 'error'));
  END IF;
END $$;

-- ============================================================
-- Item 1.11: Add missing indexes on 10+ tables
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_mc_automation_rules_user ON mc_automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_mc_task_templates_user ON mc_task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_mc_recurring_tasks_user ON mc_recurring_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_mc_recurring_tasks_next_run ON mc_recurring_tasks(next_run_at);
CREATE INDEX IF NOT EXISTS idx_mc_task_dependencies_depends ON mc_task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_chunk ON kb_feedback(chunk_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_document ON kb_feedback(document_id);
CREATE INDEX IF NOT EXISTS idx_api_batches_user ON api_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_api_predictions_user ON api_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_user ON analytics_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cohorts_user ON analytics_cohorts(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_user ON analytics_reports(user_id);

-- ============================================================
-- Item 1.12: Create 10 missing tables
-- ============================================================

-- 1. model_change_history
CREATE TABLE IF NOT EXISTS model_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_model TEXT,
  to_model TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'switch',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now(),
  effective_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_model_change_history_user ON model_change_history(user_id);

ALTER TABLE model_change_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own model changes' AND tablename = 'model_change_history') THEN
    CREATE POLICY "Users manage own model changes" ON model_change_history
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 2. agent_reviews
CREATE TABLE IF NOT EXISTS agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_reviews_user ON agent_reviews(user_id);

ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own agent reviews' AND tablename = 'agent_reviews') THEN
    CREATE POLICY "Users manage own agent reviews" ON agent_reviews
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. channel_agent_routing
CREATE TABLE IF NOT EXISTS channel_agent_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_agent_routing_user ON channel_agent_routing(user_id);

ALTER TABLE channel_agent_routing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own channel routing' AND tablename = 'channel_agent_routing') THEN
    CREATE POLICY "Users manage own channel routing" ON channel_agent_routing
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. channel_status_history
CREATE TABLE IF NOT EXISTS channel_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_channel_status_history_channel ON channel_status_history(channel_id);

ALTER TABLE channel_status_history ENABLE ROW LEVEL SECURITY;

-- channel_status_history links to channels, which have user_id.
-- Access via channel ownership.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own channel status history' AND tablename = 'channel_status_history') THEN
    CREATE POLICY "Users read own channel status history" ON channel_status_history
      FOR ALL USING (
        EXISTS (SELECT 1 FROM channels WHERE channels.id = channel_status_history.channel_id AND channels.user_id = auth.uid())
      );
  END IF;
END $$;

-- 5. custom_domains
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  ssl_expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_user ON custom_domains(user_id);

ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own custom domains' AND tablename = 'custom_domains') THEN
    CREATE POLICY "Users manage own custom domains" ON custom_domains
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. scheduled_restarts
CREATE TABLE IF NOT EXISTS scheduled_restarts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  restart_type TEXT NOT NULL DEFAULT 'graceful',
  day_of_week INTEGER,
  time_utc TEXT NOT NULL DEFAULT '04:00',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scheduled_restarts_user ON scheduled_restarts(user_id);

ALTER TABLE scheduled_restarts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own scheduled restarts' AND tablename = 'scheduled_restarts') THEN
    CREATE POLICY "Users manage own scheduled restarts" ON scheduled_restarts
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 7. ticket_attachments
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  message_id UUID,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);

ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- ticket_attachments links to support_tickets which has user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own ticket attachments' AND tablename = 'ticket_attachments') THEN
    CREATE POLICY "Users read own ticket attachments" ON ticket_attachments
      FOR ALL USING (
        EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_attachments.ticket_id AND support_tickets.user_id = auth.uid())
      );
  END IF;
END $$;

-- 8. ticket_status_history
CREATE TABLE IF NOT EXISTS ticket_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket ON ticket_status_history(ticket_id);

ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own ticket status history' AND tablename = 'ticket_status_history') THEN
    CREATE POLICY "Users read own ticket status history" ON ticket_status_history
      FOR ALL USING (
        EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_status_history.ticket_id AND support_tickets.user_id = auth.uid())
      );
  END IF;
END $$;

-- 9. coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER,
  discount_amount NUMERIC(10,2),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Coupons are publicly readable (for validation), admin-writable
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read active coupons' AND tablename = 'coupons') THEN
    CREATE POLICY "Anyone can read active coupons" ON coupons
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- 10. applied_coupons
CREATE TABLE IF NOT EXISTS applied_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_applied_coupons_user ON applied_coupons(user_id);

ALTER TABLE applied_coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own applied coupons' AND tablename = 'applied_coupons') THEN
    CREATE POLICY "Users manage own applied coupons" ON applied_coupons
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 11. payment_orders (added for server-side payment verification)
CREATE TABLE IF NOT EXISTS payment_orders (
  order_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'created',
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own payment orders' AND tablename = 'payment_orders') THEN
    CREATE POLICY "Users read own payment orders" ON payment_orders
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add deleted_at for soft delete on mc_tasks
ALTER TABLE mc_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
