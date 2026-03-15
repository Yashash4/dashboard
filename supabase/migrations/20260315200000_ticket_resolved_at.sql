-- Add resolved_at timestamp for auto-delete tracking
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill: set resolved_at for already-resolved tickets
UPDATE support_tickets SET resolved_at = updated_at WHERE status = 'resolved' AND resolved_at IS NULL;
