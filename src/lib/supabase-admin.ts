import { createClient } from "@supabase/supabase-js";

// Service role client for server-side admin operations.
// Bypasses RLS — only use in API routes after verifying user auth.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
