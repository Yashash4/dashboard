-- ClawHQ: Webhook helper RPC for atomic failure count increment

CREATE OR REPLACE FUNCTION increment_webhook_failure(p_webhook_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.webhooks
  SET failure_count = failure_count + 1
  WHERE id = p_webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
