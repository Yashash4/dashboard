-- Mission Control tables for ClawHQ Ultra tier

-- Task board (Kanban)
CREATE TABLE IF NOT EXISTS public.mc_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  column_id TEXT NOT NULL DEFAULT 'inbox',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  acceptance_criteria TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mc_tasks_user_column ON public.mc_tasks(user_id, column_id, position);
CREATE INDEX IF NOT EXISTS idx_mc_tasks_agent ON public.mc_tasks(assigned_agent_id);

-- Event feed
CREATE TABLE IF NOT EXISTS public.mc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.mc_tasks(id) ON DELETE SET NULL,
  session_id UUID,
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_events_user_created ON public.mc_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_events_type ON public.mc_events(event_type, created_at DESC);

-- Agent status snapshots
CREATE TABLE IF NOT EXISTS public.mc_agent_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  current_task_id UUID REFERENCES public.mc_tasks(id) ON DELETE SET NULL,
  capacity_used DECIMAL(5,2) DEFAULT 0.0,
  performance_score DECIMAL(5,2),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_mc_agent_status_status ON public.mc_agent_status(status, updated_at DESC);

-- Sessions with token tracking
CREATE TABLE IF NOT EXISTS public.mc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.mc_tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0.0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  trace_data JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_mc_sessions_user ON public.mc_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_sessions_agent ON public.mc_sessions(agent_id, started_at DESC);

-- Add foreign key from mc_events to mc_sessions (after mc_sessions is created)
ALTER TABLE public.mc_events
  ADD CONSTRAINT fk_mc_events_session
  FOREIGN KEY (session_id) REFERENCES public.mc_sessions(id) ON DELETE SET NULL;

-- Row Level Security
ALTER TABLE public.mc_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.mc_tasks FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.mc_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own events" ON public.mc_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.mc_events FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.mc_agent_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own agent status" ON public.mc_agent_status FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.mc_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.mc_sessions FOR ALL USING (auth.uid() = user_id);
