import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/** GET /api/v1/conversations/:id/messages — Get messages for a conversation (API key auth) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <api_key> header" },
      { status: 401 }
    );
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("clw_") || rawKey.length !== 36) {
    return NextResponse.json(
      { error: "Invalid API key format" },
      { status: 401 }
    );
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const admin = createAdminClient();

  const { data: apiKey, error: keyError } = await admin
    .from("api_keys")
    .select("id, user_id, status")
    .eq("key_hash", keyHash)
    .single();

  if (keyError || !apiKey || apiKey.status !== "active") {
    return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
  }

  // Plan check
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", apiKey.user_id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!["pro", "ultra", "enterprise"].includes(plan)) {
    return NextResponse.json(
      { error: "API access requires a Pro plan or higher" },
      { status: 403 }
    );
  }

  // Verify conversation belongs to user
  const { data: conversation } = await admin
    .from("chat_conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", apiKey.user_id)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Parse query params
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data: messages, error } = await admin
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  return NextResponse.json({
    messages: (messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    })),
  });
}
