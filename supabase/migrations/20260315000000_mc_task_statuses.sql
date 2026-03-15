-- Mission Control: Configurable task statuses (columns)
CREATE TABLE IF NOT EXISTS mc_task_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#666666',
  sort_order INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mc_task_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own statuses" ON mc_task_statuses
  FOR ALL USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_mc_task_statuses_user ON mc_task_statuses(user_id, sort_order);
