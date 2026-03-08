-- ClawHQ Migration: API Keys fixes from senior review
-- 1. Atomic usage_count increment RPC (fixes race condition)

CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.api_keys
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
