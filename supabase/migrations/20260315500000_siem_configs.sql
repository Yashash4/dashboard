-- SIEM streaming configurations for audit log forwarding.
-- Each user can have up to 3 SIEM destinations.

CREATE TABLE IF NOT EXISTS siem_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('http', 'datadog', 'splunk', 's3')),
  destination_url TEXT NOT NULL,
  api_key TEXT,
  format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'cef')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_siem_configs_user ON siem_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_siem_configs_enabled ON siem_configs(user_id, enabled);

ALTER TABLE siem_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own siem configs' AND tablename = 'siem_configs') THEN
    CREATE POLICY "Users manage own siem configs" ON siem_configs
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Log alert rules table for log alerting engine
CREATE TABLE IF NOT EXISTS log_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Alert Rule',
  conditions JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_alert_rules_user ON log_alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_log_alert_rules_enabled ON log_alert_rules(user_id, enabled);

ALTER TABLE log_alert_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own alert rules' AND tablename = 'log_alert_rules') THEN
    CREATE POLICY "Users manage own alert rules" ON log_alert_rules
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Log alert history for recording triggered alerts
CREATE TABLE IF NOT EXISTS log_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES log_alert_rules(id) ON DELETE SET NULL,
  results JSONB NOT NULL DEFAULT '[]',
  log_sample JSONB,
  triggered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_alert_history_user ON log_alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_log_alert_history_triggered ON log_alert_history(triggered_at);

ALTER TABLE log_alert_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own alert history' AND tablename = 'log_alert_history') THEN
    CREATE POLICY "Users read own alert history" ON log_alert_history
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
