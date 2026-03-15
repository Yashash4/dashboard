-- ClawHQ Migration: Multi-model per agent with fallback chain

ALTER TABLE public.user_agents
  ADD COLUMN IF NOT EXISTS primary_model TEXT,
  ADD COLUMN IF NOT EXISTS fallback_model TEXT;

-- primary_model and fallback_model are both nullable.
-- If null, the agent uses the VPS default model.
