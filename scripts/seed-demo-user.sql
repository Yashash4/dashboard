-- =============================================================================
-- ClawHQ Demo User Seed Script
-- =============================================================================
-- Creates a complete demo user with realistic data across all Supabase tables.
-- Safe to run multiple times — uses INSERT ON CONFLICT DO UPDATE (upsert).
--
-- Demo user: demo@clawhq.tech / Demo User / role: user
-- Fixed UUID: 00000000-0000-0000-0000-000000000001
-- =============================================================================

BEGIN;

-- Fixed UUIDs for referential integrity
DO $$ BEGIN
  -- Demo user
  PERFORM '00000000-0000-0000-0000-000000000001'::uuid;
END $$;

-- =============================================================================
-- 1. users — the demo user
-- =============================================================================
INSERT INTO users (id, name, email, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo User',
  'demo@clawhq.tech',
  'user',
  NOW() - INTERVAL '45 days'
)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  email      = EXCLUDED.email,
  role       = EXCLUDED.role;

-- =============================================================================
-- 2. vps_instances — a running VPS
-- =============================================================================
INSERT INTO vps_instances (user_id, ip_address, ssh_user, ssh_password, ssh_port, hostname, status, openclaw_dashboard_url, dashboard_username, dashboard_password, openclaw_auth_token, gateway_token)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '72.61.232.87',
  'root',
  'demo_ssh_pass_not_real',
  22,
  'demo.clawhq.tech',
  'running',
  'https://demo.clawhq.tech',
  'admin',
  'demo123',
  NULL,
  NULL
)
ON CONFLICT (user_id) DO UPDATE SET
  ip_address              = EXCLUDED.ip_address,
  ssh_user                = EXCLUDED.ssh_user,
  ssh_password            = EXCLUDED.ssh_password,
  ssh_port                = EXCLUDED.ssh_port,
  hostname                = EXCLUDED.hostname,
  status                  = EXCLUDED.status,
  openclaw_dashboard_url  = EXCLUDED.openclaw_dashboard_url,
  dashboard_username      = EXCLUDED.dashboard_username,
  dashboard_password      = EXCLUDED.dashboard_password;

-- =============================================================================
-- 3. subscriptions — Pro plan, active
-- =============================================================================
INSERT INTO subscriptions (user_id, plan, status, billing_cycle, price, expires_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'pro',
  'active',
  'monthly',
  59,
  NOW() + INTERVAL '30 days'
)
ON CONFLICT (user_id) DO UPDATE SET
  plan          = EXCLUDED.plan,
  status        = EXCLUDED.status,
  billing_cycle = EXCLUDED.billing_cycle,
  price         = EXCLUDED.price,
  expires_at    = EXCLUDED.expires_at;

-- =============================================================================
-- 4. channels — 7 channels with various statuses
-- =============================================================================
-- Delete existing channels for the demo user first (no natural unique constraint)
DELETE FROM channels WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO channels (id, user_id, channel_type, status, configured_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'whatsapp',  'connected', NOW() - INTERVAL '30 days'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'telegram',  'connected', NOW() - INTERVAL '28 days'),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'discord',   'connected', NOW() - INTERVAL '25 days'),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'slack',     'connected', NOW() - INTERVAL '20 days'),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'teams',     'connected', NOW() - INTERVAL '15 days'),
  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'signal',    'pending',   NULL),
  ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'webchat',   'connected', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO UPDATE SET
  channel_type  = EXCLUDED.channel_type,
  status        = EXCLUDED.status,
  configured_at = EXCLUDED.configured_at;

-- =============================================================================
-- 5. agents (store catalog) + user_agents (user's deployed agents)
-- =============================================================================
-- Ensure the 5 agent catalog entries exist
INSERT INTO agents (id, name, description, category, is_free, is_active, is_available) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Support',  'Customer support assistant that handles inquiries and resolves issues',  'support',   true, true, true),
  ('a0000000-0000-0000-0000-000000000002', 'Research', 'Research assistant for gathering and synthesizing information',          'research',  true, true, true),
  ('a0000000-0000-0000-0000-000000000003', 'Sales',    'Sales assistant that qualifies leads and manages outreach',             'sales',     true, true, true),
  ('a0000000-0000-0000-0000-000000000004', 'Writer',   'Content writer that drafts articles, emails, and marketing copy',       'content',   true, true, true),
  ('a0000000-0000-0000-0000-000000000005', 'Data',     'Data analysis agent for processing and visualizing datasets',           'analytics', true, true, true)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  category    = EXCLUDED.category;

-- User's agent library — all 5 deployed
DELETE FROM user_agents WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO user_agents (id, user_id, agent_id, deployed, deployed_at) VALUES
  ('ua000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '40 days'),
  ('ua000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', true, NOW() - INTERVAL '38 days'),
  ('ua000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', true, NOW() - INTERVAL '35 days'),
  ('ua000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', true, NOW() - INTERVAL '30 days'),
  ('ua000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', true, NOW() - INTERVAL '25 days');

-- =============================================================================
-- 6. support_tickets — 3 tickets (1 open, 2 resolved)
-- =============================================================================
DELETE FROM support_tickets WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO support_tickets (id, user_id, subject, description, priority, category, status, created_at, resolved_at) VALUES
  ('t0000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'WebSocket connection drops after 30 minutes',
   'The WebSocket connection to my OpenClaw instance drops approximately every 30 minutes. I have confirmed that the nginx proxy_read_timeout is set to 86400. Could there be another timeout setting causing this?',
   'high', 'technical', 'open',
   NOW() - INTERVAL '2 days', NULL),

  ('t0000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'How to configure custom model endpoints',
   'I would like to point my OpenClaw instance to a self-hosted LLM endpoint instead of the default OpenAI API. What configuration changes are needed?',
   'medium', 'technical', 'resolved',
   NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),

  ('t0000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Billing cycle clarification',
   'My subscription renews on the 15th but I signed up on the 10th. Can you clarify how the billing cycle is calculated and when the next charge will occur?',
   'low', 'billing', 'resolved',
   NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days');

-- =============================================================================
-- 7. ticket_messages — replies for each ticket
-- =============================================================================
DELETE FROM ticket_messages WHERE ticket_id IN (
  't0000000-0000-0000-0000-000000000001',
  't0000000-0000-0000-0000-000000000002',
  't0000000-0000-0000-0000-000000000003'
);

INSERT INTO ticket_messages (ticket_id, sender_role, message, created_at) VALUES
  -- Ticket 1 (open) — initial + staff reply
  ('t0000000-0000-0000-0000-000000000001', 'customer',
   'The WebSocket connection to my OpenClaw instance drops approximately every 30 minutes. I have confirmed that the nginx proxy_read_timeout is set to 86400. Could there be another timeout setting causing this?',
   NOW() - INTERVAL '2 days'),
  ('t0000000-0000-0000-0000-000000000001', 'staff',
   'Thank you for the detailed report. We are investigating your nginx configuration. In the meantime, could you check if your load balancer or CDN has its own idle timeout? Cloudflare, for example, has a 100-second WebSocket idle timeout on free plans.',
   NOW() - INTERVAL '1 day'),
  ('t0000000-0000-0000-0000-000000000001', 'customer',
   'Good catch — I am using Cloudflare on the Free plan. I will look into upgrading or implementing a ping/pong keep-alive. Will report back.',
   NOW() - INTERVAL '12 hours'),

  -- Ticket 2 (resolved)
  ('t0000000-0000-0000-0000-000000000002', 'customer',
   'I would like to point my OpenClaw instance to a self-hosted LLM endpoint instead of the default OpenAI API. What configuration changes are needed?',
   NOW() - INTERVAL '15 days'),
  ('t0000000-0000-0000-0000-000000000002', 'staff',
   'You can configure a custom base URL in your API keys settings. Go to your dashboard, navigate to API Keys, and set the provider to "custom" with your endpoint URL. The system will route all model calls through your endpoint.',
   NOW() - INTERVAL '14 days' + INTERVAL '2 hours'),
  ('t0000000-0000-0000-0000-000000000002', 'customer',
   'That worked perfectly. Thank you for the quick response!',
   NOW() - INTERVAL '14 days' + INTERVAL '4 hours'),

  -- Ticket 3 (resolved)
  ('t0000000-0000-0000-0000-000000000003', 'customer',
   'My subscription renews on the 15th but I signed up on the 10th. Can you clarify how the billing cycle is calculated?',
   NOW() - INTERVAL '30 days'),
  ('t0000000-0000-0000-0000-000000000003', 'staff',
   'Your billing cycle starts from your first successful payment date. Since your initial payment was processed on the 15th (after the trial period), all subsequent charges will occur on the 15th of each month. Your next charge will be on the 15th of next month.',
   NOW() - INTERVAL '29 days');

-- =============================================================================
-- 8. audit_logs — 10 recent audit entries
-- =============================================================================
DELETE FROM audit_logs WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, category, actor_type, details, ip_address, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'user_login',           'user',         '00000000-0000-0000-0000-000000000001', 'auth',     'user',   '{"method": "password"}',                            '192.168.1.100', NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000001', 'agent_deployed',       'agent',        'a0000000-0000-0000-0000-000000000001', 'agent',    'user',   '{"agent_name": "Support"}',                         '192.168.1.100', NOW() - INTERVAL '3 hours'),
  ('00000000-0000-0000-0000-000000000001', 'channel_connected',    'channel',      'c0000000-0000-0000-0000-000000000004', 'channel',  'user',   '{"channel_type": "slack"}',                         '192.168.1.100', NOW() - INTERVAL '6 hours'),
  ('00000000-0000-0000-0000-000000000001', 'api_key_created',      'api_key',      'ak000000-0000-0000-0000-000000000001', 'api_key',  'user',   '{"name": "Production API", "prefix": "clw_a1b2c3"}','192.168.1.100', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'model_changed',        'model',        NULL,                                   'model',    'user',   '{"from": "gpt-4o", "to": "claude-3.5-sonnet"}',    '192.168.1.100', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', 'vps_restarted',        'vps',          '00000000-0000-0000-0000-000000000001', 'vps',      'user',   '{"reason": "manual"}',                              '192.168.1.100', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001', 'password_changed',     'user',         '00000000-0000-0000-0000-000000000001', 'auth',     'user',   '{}',                                                '192.168.1.100', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001', 'ticket_created',       'ticket',       't0000000-0000-0000-0000-000000000001', 'support',  'user',   '{"subject": "WebSocket connection drops"}',         '192.168.1.100', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', 'agent_deployed',       'agent',        'a0000000-0000-0000-0000-000000000005', 'agent',    'user',   '{"agent_name": "Data"}',                            '192.168.1.100', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000001', 'subscription_upgraded','subscription', '00000000-0000-0000-0000-000000000001', 'billing',  'user',   '{"from": "starter", "to": "pro"}',                 '192.168.1.100', NOW() - INTERVAL '40 days');

-- =============================================================================
-- 9. api_keys — 3 API keys
-- =============================================================================
DELETE FROM api_keys WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, usage_count, last_used_at, status, rate_limit_per_min, created_at) VALUES
  ('ak000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Production API',
   'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
   'clw_a1b2c3d4',
   1847, NOW() - INTERVAL '15 minutes', 'active', 60,
   NOW() - INTERVAL '40 days'),

  ('ak000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Staging Environment',
   'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
   'clw_e5f6g7h8',
   523, NOW() - INTERVAL '2 hours', 'active', 120,
   NOW() - INTERVAL '30 days'),

  ('ak000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Legacy Key (revoked)',
   'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
   'clw_z9y8x7w6',
   92, NOW() - INTERVAL '20 days', 'revoked', 30,
   NOW() - INTERVAL '44 days');

-- =============================================================================
-- 10. agent_analytics — message/error data for the past week
-- =============================================================================
DELETE FROM agent_analytics WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO agent_analytics (user_id, agent_id, metric_type, response_time_ms, api_key_id, metadata, created_at) VALUES
  -- Support agent — heavy usage
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'message', 1250, 'ak000000-0000-0000-0000-000000000001', '{}', NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'message', 980,  'ak000000-0000-0000-0000-000000000001', '{}', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'message', 1100, 'ak000000-0000-0000-0000-000000000001', '{}', NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'error',   NULL, 'ak000000-0000-0000-0000-000000000001', '{"error": "model timeout"}', NOW() - INTERVAL '3 hours'),

  -- Research agent
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'message', 2300, 'ak000000-0000-0000-0000-000000000001', '{}', NOW() - INTERVAL '4 hours'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'message', 1800, 'ak000000-0000-0000-0000-000000000002', '{}', NOW() - INTERVAL '1 day'),

  -- Sales agent
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'message', 900,  'ak000000-0000-0000-0000-000000000001', '{}', NOW() - INTERVAL '6 hours'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'message', 1050, 'ak000000-0000-0000-0000-000000000002', '{}', NOW() - INTERVAL '2 days'),

  -- Writer agent
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'message', 3200, NULL, '{}', NOW() - INTERVAL '8 hours'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'error',   NULL, NULL, '{"error": "context length exceeded"}', NOW() - INTERVAL '1 day'),

  -- Data agent
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'message', 1500, 'ak000000-0000-0000-0000-000000000002', '{}', NOW() - INTERVAL '12 hours'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'rag_eval', NULL, NULL, '{"groundedness": 0.87, "supported": 13, "total": 15}', NOW() - INTERVAL '1 day');

-- =============================================================================
-- 11. mc_tasks — 8 tasks across different columns
-- =============================================================================
DELETE FROM mc_tasks WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO mc_tasks (id, user_id, title, description, column_id, priority, assigned_agent_id, created_by, due_date, estimated_hours, actual_hours, position, acceptance_criteria, outcome, metadata, created_at, updated_at, completed_at) VALUES
  -- Planning (2 tasks)
  ('mt000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Design FAQ knowledge base structure',
   'Create a structured knowledge base from existing support tickets to reduce repeat questions. Should cover billing, technical setup, and channel configuration topics.',
   'planning', 'medium', NULL, 'user',
   (NOW() + INTERVAL '14 days')::date, 8, NULL, 0,
   'KB structure documented with at least 20 FAQ entries categorized by topic',
   NULL, '{"tags": ["knowledge-base", "support"]}',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL),

  ('mt000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Evaluate multi-language support options',
   'Research and evaluate options for adding multi-language support to the Support agent. Priority languages: Spanish, French, German.',
   'planning', 'low', NULL, 'user',
   (NOW() + INTERVAL '30 days')::date, 4, NULL, 1,
   'Comparison document with at least 3 approaches and cost estimates',
   NULL, '{"tags": ["i18n", "research"]}',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL),

  -- In Progress (2 tasks)
  ('mt000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Optimize Support agent response latency',
   'Current average response time is 1.2s. Target is under 800ms. Investigate prompt optimization and caching strategies.',
   'in_progress', 'high', 'a0000000-0000-0000-0000-000000000001', 'user',
   (NOW() + INTERVAL '5 days')::date, 6, 3, 0,
   'P95 response time under 800ms measured over 24-hour window',
   NULL, '{"tags": ["performance", "support"], "subtasks": [{"id": "st1", "title": "Profile current prompts", "completed": true}, {"id": "st2", "title": "Implement response cache", "completed": false}]}',
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 hours', NULL),

  ('mt000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   'Build sales lead qualification workflow',
   'Create an automated workflow where the Sales agent qualifies inbound leads based on company size, industry, and budget before routing to the human sales team.',
   'in_progress', 'high', 'a0000000-0000-0000-0000-000000000003', 'user',
   (NOW() + INTERVAL '7 days')::date, 12, 5, 1,
   'Workflow processes at least 50 leads/day with 90% accuracy on qualification score',
   NULL, '{"tags": ["sales", "automation"]}',
   NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 hours', NULL),

  -- Review (2 tasks)
  ('mt000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000001',
   'Weekly analytics report generator',
   'Research agent compiles weekly usage analytics into a structured report with charts and recommendations.',
   'review', 'medium', 'a0000000-0000-0000-0000-000000000002', 'user',
   (NOW() + INTERVAL '2 days')::date, 5, 5, 0,
   'Report covers all 5 agents with accuracy above 95% on usage metrics',
   NULL, '{"tags": ["analytics", "reporting"]}',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 hours', NULL),

  ('mt000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000001',
   'Content calendar automation',
   'Writer agent generates a 30-day content calendar with blog post outlines based on trending topics in the AI/SaaS space.',
   'review', 'low', 'a0000000-0000-0000-0000-000000000004', 'user',
   (NOW() + INTERVAL '3 days')::date, 4, 4, 1,
   'Calendar includes 12 blog post outlines with SEO keywords',
   NULL, '{"tags": ["content", "marketing"]}',
   NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day', NULL),

  -- Done (2 tasks)
  ('mt000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000001',
   'Set up Discord channel integration',
   'Configure and deploy the Discord channel with proper bot permissions and message routing.',
   'done', 'high', NULL, 'user',
   (NOW() - INTERVAL '5 days')::date, 2, 1.5, 0,
   'Discord bot responds to messages in designated channels within 2 seconds',
   'Successfully deployed. Bot is active in 3 channels with average response time of 1.1s.',
   '{"tags": ["channels", "discord"]}',
   NOW() - INTERVAL '12 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

  ('mt000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000001',
   'Data pipeline for customer churn analysis',
   'Data agent processes customer interaction logs and generates churn risk scores for the past 90 days.',
   'done', 'critical', 'a0000000-0000-0000-0000-000000000005', 'user',
   (NOW() - INTERVAL '3 days')::date, 8, 7, 1,
   'Churn model achieves AUC above 0.80 on validation set',
   'Model achieved AUC of 0.84. Identified 12 high-risk accounts. Report delivered to stakeholders.',
   '{"tags": ["data", "analytics", "churn"]}',
   NOW() - INTERVAL '14 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- =============================================================================
-- 12. mc_agent_status — 5 agent statuses
-- =============================================================================
DELETE FROM mc_agent_status WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO mc_agent_status (user_id, agent_id, status, current_task_id, capacity_used, performance_score, last_activity_at, metadata, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'working', 'mt000000-0000-0000-0000-000000000003', 0.75, 92,
   NOW() - INTERVAL '5 minutes',
   '{"version": "1.2.0", "deployed_tools": ["ticket_search", "knowledge_lookup", "email_reply"]}',
   NOW() - INTERVAL '5 minutes'),

  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'idle', NULL, 0.10, 88,
   NOW() - INTERVAL '2 hours',
   '{"version": "1.1.0", "deployed_tools": ["web_search", "document_reader", "summarizer"]}',
   NOW() - INTERVAL '2 hours'),

  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',
   'working', 'mt000000-0000-0000-0000-000000000004', 0.60, 85,
   NOW() - INTERVAL '15 minutes',
   '{"version": "1.0.5", "deployed_tools": ["crm_lookup", "email_sender", "lead_scorer"]}',
   NOW() - INTERVAL '15 minutes'),

  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004',
   'idle', NULL, 0.05, 90,
   NOW() - INTERVAL '6 hours',
   '{"version": "1.3.0", "deployed_tools": ["text_generator", "seo_analyzer", "grammar_check"]}',
   NOW() - INTERVAL '6 hours'),

  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005',
   'online', NULL, 0.20, 94,
   NOW() - INTERVAL '30 minutes',
   '{"version": "2.0.0", "deployed_tools": ["sql_query", "chart_generator", "csv_parser", "data_cleaner"]}',
   NOW() - INTERVAL '30 minutes');

-- =============================================================================
-- 13. mc_events — 10 recent events
-- =============================================================================
DELETE FROM mc_events WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO mc_events (user_id, event_type, severity, agent_id, task_id, session_id, message, payload, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'session_start', 'info',
   'a0000000-0000-0000-0000-000000000001', 'mt000000-0000-0000-0000-000000000003', NULL,
   'Support agent started working on response latency optimization',
   '{"trigger": "manual"}',
   NOW() - INTERVAL '2 hours'),

  ('00000000-0000-0000-0000-000000000001', 'tool_invocation', 'info',
   'a0000000-0000-0000-0000-000000000001', 'mt000000-0000-0000-0000-000000000003', NULL,
   'Support agent invoked ticket_search tool',
   '{"tool": "ticket_search", "duration_ms": 245}',
   NOW() - INTERVAL '1 hour' - INTERVAL '45 minutes'),

  ('00000000-0000-0000-0000-000000000001', 'agent_state_change', 'info',
   'a0000000-0000-0000-0000-000000000003', NULL, NULL,
   'Sales agent changed status from idle to working',
   '{"old_status": "idle", "new_status": "working"}',
   NOW() - INTERVAL '1 hour' - INTERVAL '30 minutes'),

  ('00000000-0000-0000-0000-000000000001', 'error', 'error',
   'a0000000-0000-0000-0000-000000000004', NULL, NULL,
   'Writer agent encountered context length limit during content generation',
   '{"error_code": "context_length_exceeded", "max_tokens": 128000, "requested_tokens": 135420}',
   NOW() - INTERVAL '1 hour'),

  ('00000000-0000-0000-0000-000000000001', 'task_complete', 'success',
   'a0000000-0000-0000-0000-000000000005', 'mt000000-0000-0000-0000-000000000008', NULL,
   'Data agent completed churn analysis pipeline with AUC 0.84',
   '{"auc": 0.84, "high_risk_accounts": 12, "processing_time_s": 342}',
   NOW() - INTERVAL '5 days'),

  ('00000000-0000-0000-0000-000000000001', 'webhook', 'info',
   NULL, NULL, NULL,
   'Incoming webhook received from Slack integration',
   '{"source": "slack", "event_type": "message.received", "channel": "#support"}',
   NOW() - INTERVAL '30 minutes'),

  ('00000000-0000-0000-0000-000000000001', 'session_end', 'info',
   'a0000000-0000-0000-0000-000000000002', 'mt000000-0000-0000-0000-000000000005', NULL,
   'Research agent completed analytics report compilation',
   '{"duration_ms": 18500, "tokens_used": 24300}',
   NOW() - INTERVAL '6 hours'),

  ('00000000-0000-0000-0000-000000000001', 'agent_state_change', 'warning',
   'a0000000-0000-0000-0000-000000000004', NULL, NULL,
   'Writer agent changed status from working to idle after error',
   '{"old_status": "working", "new_status": "idle", "reason": "error_recovery"}',
   NOW() - INTERVAL '55 minutes'),

  ('00000000-0000-0000-0000-000000000001', 'tool_invocation', 'info',
   'a0000000-0000-0000-0000-000000000005', NULL, NULL,
   'Data agent invoked sql_query tool for churn metrics',
   '{"tool": "sql_query", "duration_ms": 1820, "rows_returned": 4500}',
   NOW() - INTERVAL '5 days' - INTERVAL '2 hours'),

  ('00000000-0000-0000-0000-000000000001', 'session_start', 'info',
   'a0000000-0000-0000-0000-000000000003', 'mt000000-0000-0000-0000-000000000004', NULL,
   'Sales agent started lead qualification workflow session',
   '{"trigger": "automation_rule", "leads_queued": 23}',
   NOW() - INTERVAL '4 hours');

-- =============================================================================
-- 14. mc_automation_rules — 2 rules
-- =============================================================================
DELETE FROM mc_automation_rules WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO mc_automation_rules (user_id, name, trigger_type, trigger_value, action_type, action_value, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Auto-assign critical tasks to Support agent',
   'task_priority_changes', 'critical',
   'assign_agent', 'a0000000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '20 days'),

  ('00000000-0000-0000-0000-000000000001',
   'Move completed tasks to Done column',
   'task_status_changed', 'completed',
   'move_to_column', 'done',
   NOW() - INTERVAL '18 days');

-- =============================================================================
-- 15. mc_sessions — 5 sessions
-- =============================================================================
DELETE FROM mc_sessions WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO mc_sessions (id, user_id, agent_id, task_id, started_at, ended_at, duration_ms, tokens_input, tokens_output, success, error_message, trace_data) VALUES
  -- Support agent — active session (no end time)
  ('ms000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'mt000000-0000-0000-0000-000000000003',
   NOW() - INTERVAL '2 hours', NULL, NULL,
   15200, 8400, true, NULL,
   '{"steps": [{"timestamp": "' || (NOW() - INTERVAL '2 hours')::text || '", "action": "analyze_prompts", "result": "identified 3 optimization opportunities", "duration_ms": 4500}, {"timestamp": "' || (NOW() - INTERVAL '1 hour')::text || '", "action": "implement_cache", "result": "in progress", "duration_ms": 12000}]}'),

  -- Research agent — completed session
  ('ms000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002',
   'mt000000-0000-0000-0000-000000000005',
   NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours', 7200000,
   24300, 18700, true, NULL,
   '{"steps": [{"timestamp": "' || (NOW() - INTERVAL '8 hours')::text || '", "action": "gather_metrics", "result": "collected usage data for 5 agents", "duration_ms": 3200}, {"timestamp": "' || (NOW() - INTERVAL '7 hours')::text || '", "action": "generate_charts", "result": "created 8 visualization charts", "duration_ms": 5400}, {"timestamp": "' || (NOW() - INTERVAL '6 hours')::text || '", "action": "compile_report", "result": "report generated successfully", "duration_ms": 2100}]}'),

  -- Sales agent — active session
  ('ms000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000003',
   'mt000000-0000-0000-0000-000000000004',
   NOW() - INTERVAL '4 hours', NULL, NULL,
   9800, 6200, true, NULL,
   '{"steps": [{"timestamp": "' || (NOW() - INTERVAL '4 hours')::text || '", "action": "fetch_leads", "result": "loaded 23 unqualified leads", "duration_ms": 1800}, {"timestamp": "' || (NOW() - INTERVAL '3 hours')::text || '", "action": "score_leads", "result": "qualified 18 out of 23 leads", "duration_ms": 8500}]}'),

  -- Writer agent — failed session
  ('ms000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000004',
   'mt000000-0000-0000-0000-000000000006',
   NOW() - INTERVAL '1 hour' - INTERVAL '30 minutes', NOW() - INTERVAL '1 hour', 1800000,
   42000, 0, false, 'Context length exceeded: requested 135420 tokens but limit is 128000',
   '{"steps": [{"timestamp": "' || (NOW() - INTERVAL '1 hour' - INTERVAL '30 minutes')::text || '", "action": "load_trending_topics", "result": "fetched 45 trending topics", "duration_ms": 2200}, {"timestamp": "' || (NOW() - INTERVAL '1 hour' - INTERVAL '15 minutes')::text || '", "action": "generate_calendar", "result": "error: context length exceeded", "duration_ms": 8900}]}'),

  -- Data agent — completed session
  ('ms000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000005',
   'mt000000-0000-0000-0000-000000000008',
   NOW() - INTERVAL '5 days' - INTERVAL '6 hours', NOW() - INTERVAL '5 days', 21600000,
   52000, 31000, true, NULL,
   '{"steps": [{"timestamp": "' || (NOW() - INTERVAL '5 days' - INTERVAL '6 hours')::text || '", "action": "extract_interaction_logs", "result": "processed 45000 interaction records", "duration_ms": 18200}, {"timestamp": "' || (NOW() - INTERVAL '5 days' - INTERVAL '3 hours')::text || '", "action": "train_churn_model", "result": "model trained with AUC 0.84", "duration_ms": 342000}, {"timestamp": "' || (NOW() - INTERVAL '5 days')::text || '", "action": "generate_report", "result": "identified 12 high-risk accounts", "duration_ms": 4800}]}');

COMMIT;

-- =============================================================================
-- Verification: Count rows for the demo user
-- =============================================================================
SELECT 'users'              AS tbl, COUNT(*) FROM users              WHERE id      = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'vps_instances',            COUNT(*) FROM vps_instances       WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'subscriptions',            COUNT(*) FROM subscriptions       WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'channels',                 COUNT(*) FROM channels            WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'user_agents',              COUNT(*) FROM user_agents         WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'support_tickets',          COUNT(*) FROM support_tickets     WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'ticket_messages',          COUNT(*) FROM ticket_messages     WHERE ticket_id IN (SELECT id FROM support_tickets WHERE user_id = '00000000-0000-0000-0000-000000000001')
UNION ALL
SELECT 'audit_logs',               COUNT(*) FROM audit_logs          WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'api_keys',                 COUNT(*) FROM api_keys            WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'agent_analytics',          COUNT(*) FROM agent_analytics     WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'mc_tasks',                 COUNT(*) FROM mc_tasks            WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'mc_agent_status',          COUNT(*) FROM mc_agent_status     WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'mc_events',                COUNT(*) FROM mc_events           WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'mc_automation_rules',      COUNT(*) FROM mc_automation_rules WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'mc_sessions',              COUNT(*) FROM mc_sessions         WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY tbl;
