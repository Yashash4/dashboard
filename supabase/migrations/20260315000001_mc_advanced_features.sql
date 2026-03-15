-- Task Dependencies
CREATE TABLE IF NOT EXISTS mc_task_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES mc_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES mc_tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

ALTER TABLE mc_task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own task deps" ON mc_task_dependencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM mc_tasks WHERE mc_tasks.id = mc_task_dependencies.task_id AND mc_tasks.user_id = auth.uid())
  );

-- Automation Rules
CREATE TABLE IF NOT EXISTS mc_automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_value TEXT,
  action_type TEXT NOT NULL,
  action_value TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mc_automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rules" ON mc_automation_rules
  FOR ALL USING (auth.uid() = user_id);

-- Task Templates
CREATE TABLE IF NOT EXISTS mc_task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  default_agent_id UUID,
  subtasks JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  estimated_hours NUMERIC,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mc_task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON mc_task_templates
  FOR ALL USING (auth.uid() = user_id);

-- Recurring Tasks
CREATE TABLE IF NOT EXISTS mc_recurring_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES mc_task_templates(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL,
  schedule_value TEXT NOT NULL,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mc_recurring_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recurring" ON mc_recurring_tasks
  FOR ALL USING (auth.uid() = user_id);
