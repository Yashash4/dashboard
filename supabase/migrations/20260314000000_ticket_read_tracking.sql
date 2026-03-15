-- Add read tracking for support tickets
-- user_read_at tracks when the customer last viewed the ticket thread
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_read_at timestamptz;

-- Allow customers to update user_read_at on their own tickets
-- (RLS policies may already restrict to user_id = auth.uid())
