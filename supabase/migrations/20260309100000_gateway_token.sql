-- Add gateway_token column to vps_instances for Docker token auth
ALTER TABLE vps_instances ADD COLUMN IF NOT EXISTS gateway_token TEXT;
