-- Daily analytics summary — one row per user per day
-- This is the ONLY analytics data in Supabase (for ClawHQ admin business metrics)
-- Detailed per-message analytics live on the user's VPS
CREATE TABLE IF NOT EXISTS analytics_daily_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own analytics summary" ON analytics_daily_summary
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can read all for business metrics
CREATE POLICY "Admin read all analytics summary" ON analytics_daily_summary
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );
