-- ClawHQ Database Setup: Tables + RLS + Mock Data
-- Run this in Supabase SQL Editor
-- Safe to re-run: drops existing tables first

-- ============================================
-- DROP EXISTING (in reverse dependency order)
-- ============================================

DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.user_api_keys CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.user_agents CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.models CASCADE;
DROP TABLE IF EXISTS public.available_models CASCADE;
DROP TABLE IF EXISTS public.vps_instances CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  xpay_subscription_id TEXT,
  UNIQUE(user_id)
);

CREATE TABLE public.vps_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  hostinger_vm_id BIGINT, -- Hostinger API virtual machine ID (for start/stop/restart via API)
  hostname TEXT,
  ip_address TEXT NOT NULL,
  ssh_user TEXT NOT NULL,
  ssh_password TEXT NOT NULL,
  ssh_port INTEGER DEFAULT 22,
  vps_provider TEXT DEFAULT 'hostinger',
  cpu_cores INTEGER,
  ram_gb INTEGER,
  storage_gb INTEGER,
  bandwidth_tb INTEGER,
  openclaw_dashboard_url TEXT,
  openclaw_password TEXT,
  openclaw_auth_token TEXT,
  dashboard_username TEXT,
  dashboard_password TEXT,
  status TEXT DEFAULT 'provisioning' CHECK (status IN ('running', 'stopped', 'restarting', 'provisioning', 'error')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.available_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  context_limit INTEGER NOT NULL,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  current_model TEXT NOT NULL DEFAULT 'kimi-k2.5',
  requested_model TEXT,
  change_effective_date TIMESTAMPTZ,
  context_limit INTEGER DEFAULT 128000,
  changes_this_month INTEGER DEFAULT 0,
  last_change_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  config_files JSONB NOT NULL DEFAULT '{}',
  price DECIMAL(10,2) DEFAULT 0,
  is_premium BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  deployed BOOLEAN DEFAULT false,
  deployed_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('whatsapp', 'telegram', 'discord', 'slack', 'signal', 'teams', 'webchat', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('connected', 'disconnected', 'pending')),
  configured_at TIMESTAMPTZ
);

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  base_url TEXT,
  configured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vps_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions: users read own
CREATE POLICY "Users can read own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- VPS: users read own
CREATE POLICY "Users can read own vps" ON public.vps_instances
  FOR SELECT USING (auth.uid() = user_id);

-- Available Models: anyone can read (public catalog)
CREATE POLICY "Anyone can read available models" ON public.available_models
  FOR SELECT USING (true);

-- Models: users read own
CREATE POLICY "Users can read own model" ON public.models
  FOR SELECT USING (auth.uid() = user_id);

-- Agents: everyone can read (marketplace)
CREATE POLICY "Anyone can read agents" ON public.agents
  FOR SELECT USING (true);

-- User Agents: users read own
CREATE POLICY "Users can read own agents" ON public.user_agents
  FOR SELECT USING (auth.uid() = user_id);

-- Channels: users read own
CREATE POLICY "Users can read own channels" ON public.channels
  FOR SELECT USING (auth.uid() = user_id);

-- Support Tickets: users read own
CREATE POLICY "Users can read own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Support Tickets: users can create
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ticket Messages: users read messages on own tickets
CREATE POLICY "Users can read own ticket messages" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_messages.ticket_id
      AND user_id = auth.uid()
    )
  );

-- Ticket Messages: users can create messages on own tickets
CREATE POLICY "Users can create messages on own tickets" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_messages.ticket_id
      AND user_id = auth.uid()
    )
  );

-- Payments: users read own
CREATE POLICY "Users can read own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- User API Keys: admin-only (service role), no user policies needed
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Chat Conversations: users read/create own
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own conversations" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat Messages: users read/create on own conversations
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- MOCK DATA
-- Replace YOUR_USER_UUID_HERE with your user ID
-- Find it: Supabase Dashboard > Authentication > Users
-- ============================================

-- Available Models (public catalog)
INSERT INTO public.available_models (name, display_name, provider, context_limit, description) VALUES
  ('kimi-k2.5', 'Kimi K2.5', 'ollama', 128000, 'High-performance open-source model with 128K context'),
  ('llama-3.3-70b', 'Llama 3.3 70B', 'ollama', 128000, 'Meta''s powerful 70B parameter model'),
  ('qwen-2.5-72b', 'Qwen 2.5 72B', 'ollama', 128000, 'Alibaba''s top-tier reasoning model'),
  ('deepseek-r1', 'DeepSeek R1', 'ollama', 64000, 'Advanced reasoning and coding model'),
  ('mistral-large', 'Mistral Large', 'ollama', 32000, 'Mistral''s flagship model');

DO $$
DECLARE
  test_user_id UUID := '47d5ba49-1f5b-4e19-86f2-513d405e81fd';
  agent1_id UUID;
  agent2_id UUID;
  ticket_id UUID;
BEGIN
  -- Subscription: Starter, monthly, active
  INSERT INTO public.subscriptions (user_id, plan, billing_cycle, price, status, started_at, expires_at)
  VALUES (test_user_id, 'starter', 'monthly', 59.00, 'active', now() - interval '15 days', now() + interval '15 days');

  -- VPS Instance: running, Tier 1 specs
  INSERT INTO public.vps_instances (user_id, hostname, ip_address, ssh_user, ssh_password, cpu_cores, ram_gb, storage_gb, bandwidth_tb, openclaw_dashboard_url, status)
  VALUES (test_user_id, 'claw-demo.duckdns.org', '203.0.113.42', 'root', 'encrypted_placeholder', 2, 8, 100, 8, 'https://claw-demo.duckdns.org:3000', 'running');

  -- Model: kimi-k2.5, 128K context
  INSERT INTO public.models (user_id, current_model, context_limit)
  VALUES (test_user_id, 'kimi-k2.5', 128000);

  -- Channels: 2 connected, 1 pending
  INSERT INTO public.channels (user_id, channel_type, status, configured_at) VALUES
    (test_user_id, 'whatsapp', 'connected', now() - interval '10 days'),
    (test_user_id, 'telegram', 'connected', now() - interval '5 days'),
    (test_user_id, 'discord', 'pending', NULL);

  -- Agents (marketplace)
  INSERT INTO public.agents (id, name, description, category, config_files, price, is_premium)
  VALUES (gen_random_uuid(), 'AI Customer Support', 'Handles customer queries with context-aware responses', 'support', '{"prompt": "You are a helpful customer support agent"}', 0, false)
  RETURNING id INTO agent1_id;

  INSERT INTO public.agents (id, name, description, category, config_files, price, is_premium)
  VALUES (gen_random_uuid(), 'Smart FAQ Bot', 'Auto-answers frequently asked questions from your knowledge base', 'knowledge', '{"prompt": "Answer questions based on the FAQ document"}', 19.99, true)
  RETURNING id INTO agent2_id;

  -- User purchased + deployed agent1
  INSERT INTO public.user_agents (user_id, agent_id, deployed, deployed_at)
  VALUES (test_user_id, agent1_id, true, now() - interval '3 days');

  -- Support ticket: open
  INSERT INTO public.support_tickets (id, user_id, subject, description, status, priority, created_at)
  VALUES (gen_random_uuid(), test_user_id, 'Cannot connect Discord channel', 'I followed the setup guide but Discord bot is not responding to messages.', 'open', 'medium', now() - interval '2 days')
  RETURNING id INTO ticket_id;

  -- Ticket messages
  INSERT INTO public.ticket_messages (ticket_id, sender_role, message, created_at) VALUES
    (ticket_id, 'customer', 'I followed the setup guide but Discord bot is not responding to messages. I have verified the bot token is correct.', now() - interval '2 days'),
    (ticket_id, 'admin', 'Hi! Let me check your Discord integration config. Can you confirm which server the bot was added to?', now() - interval '1 day');

  -- Payment history
  INSERT INTO public.payments (user_id, amount, description, status, created_at) VALUES
    (test_user_id, 59.00, 'Starter plan — Monthly subscription', 'paid', now() - interval '15 days');
END $$;
