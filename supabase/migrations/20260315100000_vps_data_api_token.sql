-- Add data API auth token column to vps_instances
ALTER TABLE vps_instances ADD COLUMN IF NOT EXISTS data_api_token TEXT;
