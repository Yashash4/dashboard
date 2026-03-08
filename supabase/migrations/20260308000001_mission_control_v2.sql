-- Mission Control v2: New columns + Comments + Reviews + Activities

-- New columns on mc_tasks
ALTER TABLE mc_tasks ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE mc_tasks ADD COLUMN IF NOT EXISTS actual_hours INTEGER;
ALTER TABLE mc_tasks ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE mc_tasks ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE mc_tasks ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE mc_tasks ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'system';
ALTER TABLE mc_tasks ALTER COLUMN column_id SET DEFAULT 'planning';

-- Migrate existing column_id values to new 7-column schema
-- Old 'inbox' becomes 'planning', old 'backlog' becomes 'inbox'
UPDATE mc_tasks SET column_id = 'planning' WHERE column_id = 'inbox';
UPDATE mc_tasks SET column_id = 'inbox' WHERE column_id = 'backlog';

-- Comments (threaded)
CREATE TABLE IF NOT EXISTS mc_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES mc_tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES mc_comments(id) ON DELETE SET NULL,
  mentions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE mc_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comments" ON mc_comments FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_mc_comments_task ON mc_comments(task_id, created_at);

-- Reviews (approval gate before Done)
CREATE TABLE IF NOT EXISTS mc_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES mc_tasks(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'needs_changes')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE mc_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reviews" ON mc_reviews FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_mc_reviews_task ON mc_reviews(task_id, created_at);

-- Task Activities (audit trail)
CREATE TABLE IF NOT EXISTS mc_task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES mc_tasks(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE mc_task_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own activities" ON mc_task_activities FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_mc_task_activities_task ON mc_task_activities(task_id, created_at DESC);
