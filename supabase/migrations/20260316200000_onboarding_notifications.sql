-- Onboarding checklist tracking
CREATE TABLE IF NOT EXISTS user_onboarding (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_connected boolean DEFAULT false,
  agent_deployed boolean DEFAULT false,
  message_sent boolean DEFAULT false,
  store_visited boolean DEFAULT false,
  guide_dismissed boolean DEFAULT false,
  checklist_dismissed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own onboarding" ON user_onboarding FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON user_onboarding FOR UPDATE USING (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- ticket_reply, agent_error, vps_status, channel_disconnect
  title text NOT NULL,
  message text NOT NULL,
  href text, -- link to navigate to
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON user_notifications(user_id, read) WHERE read = false;

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON user_notifications FOR UPDATE USING (auth.uid() = user_id);
