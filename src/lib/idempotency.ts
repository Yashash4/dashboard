import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Check idempotency cache. Returns cached response if exists, null otherwise.
 */
export async function checkIdempotency(
  userId: string,
  key: string
): Promise<{ statusCode: number; body: Record<string, unknown> } | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("idempotency_cache")
    .select("status_code, response_body")
    .eq("key", key)
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (data) {
    return { statusCode: data.status_code, body: data.response_body as Record<string, unknown> };
  }

  return null;
}

/**
 * Store response in idempotency cache (24-hour TTL).
 */
export async function storeIdempotency(
  userId: string,
  key: string,
  statusCode: number,
  body: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();

  await admin
    .from("idempotency_cache")
    .upsert({
      key,
      user_id: userId,
      status_code: statusCode,
      response_body: body,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .then(() => {}, () => {});
}
