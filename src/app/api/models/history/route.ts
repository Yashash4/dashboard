import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:model_history`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from("model_change_history")
      .select("id, from_model, to_model, changed_at, effective_at, status")
      .eq("user_id", user.id)
      .order("changed_at", { ascending: false })
      .limit(20);

    if (error) {
      // Table may not exist yet — return empty array
      return NextResponse.json({ history: [] });
    }

    return NextResponse.json({ history: data || [] });
  } catch {
    return NextResponse.json({ history: [] });
  }
}
