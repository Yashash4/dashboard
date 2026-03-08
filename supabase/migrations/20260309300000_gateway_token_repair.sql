-- Repair: gateway_token column was tracked but not applied
ALTER TABLE vps_instances ADD COLUMN IF NOT EXISTS gateway_token TEXT;
