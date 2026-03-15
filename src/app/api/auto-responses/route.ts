import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { rateLimit } from "@/lib/rate-limit";

const MAX_AUTO_RESPONSES = 20;

/** GET /api/auto-responses — List user's auto-responses */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const rl = rateLimit(`${user.id}:auto_resp_list`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { data, error } = await admin
    .from("auto_responses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch auto-responses" }, { status: 500 });
  }

  return NextResponse.json({ autoResponses: data || [] });
}

/** POST /api/auto-responses — Create auto-response */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const rl = rateLimit(`${user.id}:auto_resp_create`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { type, channel_type, trigger_keyword, response_text } = body as {
    type?: string;
    channel_type?: string | null;
    trigger_keyword?: string;
    response_text?: string;
  };

  if (!type || !["greeting", "away", "faq"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (!response_text?.trim()) {
    return NextResponse.json({ error: "Response text is required" }, { status: 400 });
  }

  if (type === "faq" && !trigger_keyword?.trim()) {
    return NextResponse.json({ error: "FAQ requires a trigger keyword" }, { status: 400 });
  }

  // Enforce limit
  const { count } = await admin
    .from("auto_responses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count || 0) >= MAX_AUTO_RESPONSES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_AUTO_RESPONSES} auto-responses allowed` },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .from("auto_responses")
    .insert({
      user_id: user.id,
      type,
      channel_type: channel_type || null,
      trigger_keyword: type === "faq" ? trigger_keyword?.trim() : null,
      response_text: response_text.trim(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create auto-response" }, { status: 500 });
  }

  return NextResponse.json({ autoResponse: data });
}

/** PATCH /api/auto-responses — Update auto-response */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const rl = rateLimit(`${user.id}:auto_resp_update`, 20, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { id, is_enabled, response_text, trigger_keyword } = body as {
    id?: string;
    is_enabled?: boolean;
    response_text?: string;
    trigger_keyword?: string;
  };

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (is_enabled !== undefined) updates.is_enabled = is_enabled;
  if (response_text !== undefined) updates.response_text = response_text.trim();
  if (trigger_keyword !== undefined) updates.trigger_keyword = trigger_keyword.trim();

  const { error } = await admin
    .from("auto_responses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** DELETE /api/auto-responses — Delete auto-response */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  if (!hasAccess((sub?.plan as string) || "starter", "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const rl = rateLimit(`${user.id}:auto_resp_delete`, 10, 60_000);
  if (!rl.success)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await admin
    .from("auto_responses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
