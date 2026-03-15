-- Conversation intents table for tracking per-message intent classification.
-- Used by analytics paths (10.2) and top intents (10.10).

CREATE TABLE IF NOT EXISTS conversation_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  message_index INTEGER NOT NULL DEFAULT 0,
  intent TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_intents_user ON conversation_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_intents_conv ON conversation_intents(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_intents_created ON conversation_intents(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_intents_unique
  ON conversation_intents(conversation_id, message_index);

ALTER TABLE conversation_intents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own intents' AND tablename = 'conversation_intents') THEN
    CREATE POLICY "Users manage own intents" ON conversation_intents
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
