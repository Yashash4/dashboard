import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 1 per hour
  const rl = rateLimit(`${user.id}:account_delete`, 1, 3_600_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { password } = body as { password?: string };

  if (!password) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 }
    );
  }

  // Verify password
  const { createClient: createAnonClient } = await import("@supabase/supabase-js");
  const verifyClient = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { error: signInError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (signInError) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 400 }
    );
  }
  await verifyClient.auth.signOut();

  const admin = createAdminClient();
  const userId = user.id;

  // Delete user data — order matters for FK constraints
  // 2.32: Comprehensive cleanup of all user-related tables

  // Gather IDs needed for child table cleanup
  const [ticketRes, channelRes, conversationRes, webhookRes, mcTaskRes] = await Promise.all([
    admin.from("support_tickets").select("id").eq("user_id", userId),
    admin.from("channels").select("id").eq("user_id", userId),
    admin.from("chat_conversations").select("id").eq("user_id", userId),
    admin.from("webhooks").select("id").eq("user_id", userId),
    admin.from("mc_tasks").select("id").eq("user_id", userId),
  ]);

  const ticketIds = ticketRes.data?.map((t) => t.id) || [];
  const channelIds = channelRes.data?.map((c) => c.id) || [];
  const conversationIds = conversationRes.data?.map((c) => c.id) || [];
  const webhookIds = webhookRes.data?.map((w) => w.id) || [];
  const mcTaskIds = mcTaskRes.data?.map((t) => t.id) || [];

  // Phase 1: deep child tables (FK dependencies on other user tables)
  await Promise.allSettled([
    // Ticket children
    ...(ticketIds.length > 0
      ? [
          admin.from("ticket_messages").delete().in("ticket_id", ticketIds),
          admin.from("ticket_attachments").delete().in("ticket_id", ticketIds),
        ]
      : []),
    // Channel children
    ...(channelIds.length > 0
      ? [admin.from("channel_credentials").delete().in("channel_id", channelIds)]
      : []),
    // Chat children
    ...(conversationIds.length > 0
      ? [admin.from("chat_messages").delete().in("conversation_id", conversationIds)]
      : []),
    // Webhook children
    ...(webhookIds.length > 0
      ? [admin.from("webhook_deliveries").delete().in("webhook_id", webhookIds)]
      : []),
    // MC task children
    ...(mcTaskIds.length > 0
      ? [
          admin.from("mc_task_dependencies").delete().in("task_id", mcTaskIds),
          admin.from("mc_reviews").delete().in("task_id", mcTaskIds),
          admin.from("mc_comments").delete().in("task_id", mcTaskIds),
          admin.from("mc_activities").delete().in("task_id", mcTaskIds),
        ]
      : []),
    // Direct user_id children
    admin.from("user_notifications").delete().eq("user_id", userId),
    admin.from("user_onboarding").delete().eq("user_id", userId),
  ]);

  // Phase 2: parent tables with user_id FK
  await Promise.allSettled([
    admin.from("chat_conversations").delete().eq("user_id", userId),
    admin.from("support_tickets").delete().eq("user_id", userId),
    admin.from("user_agents").delete().eq("user_id", userId),
    admin.from("channels").delete().eq("user_id", userId),
    admin.from("subscriptions").delete().eq("user_id", userId),
    admin.from("models").delete().eq("user_id", userId),
    admin.from("agent_analytics").delete().eq("user_id", userId),
    admin.from("vps_instances").delete().eq("user_id", userId),
    admin.from("api_keys").delete().eq("user_id", userId),
    admin.from("webhooks").delete().eq("user_id", userId),
    admin.from("model_change_history").delete().eq("user_id", userId),
    admin.from("auto_responses").delete().eq("user_id", userId),
    admin.from("business_hours").delete().eq("user_id", userId),
    admin.from("custom_domains").delete().eq("user_id", userId),
    admin.from("scheduled_restarts").delete().eq("user_id", userId),
    admin.from("analytics_daily_summary").delete().eq("user_id", userId),
    admin.from("payments").delete().eq("user_id", userId),
    admin.from("payment_orders").delete().eq("user_id", userId),
    // Mission Control tables
    admin.from("mc_tasks").delete().eq("user_id", userId),
    admin.from("mc_task_templates").delete().eq("user_id", userId),
    admin.from("mc_recurring_tasks").delete().eq("user_id", userId),
    admin.from("mc_automation_rules").delete().eq("user_id", userId),
    admin.from("mc_agent_status").delete().eq("user_id", userId),
    admin.from("mc_events").delete().eq("user_id", userId),
  ]);

  // Phase 3: clean up Supabase Storage
  await Promise.allSettled([
    admin.storage.from("avatars").remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.gif`, `${userId}/avatar.webp`]),
    // Clean up ticket attachment files
    ...(ticketIds.length > 0
      ? ticketIds.map((id) =>
          admin.storage.from("ticket-attachments").list(id).then(async ({ data: files }) => {
            if (files && files.length > 0) {
              await admin.storage.from("ticket-attachments").remove(files.map((f) => `${id}/${f.name}`));
            }
          })
        )
      : []),
  ]);

  // Delete the users table entry
  await admin.from("users").delete().eq("id", userId);

  // Delete the auth user
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);

  if (deleteAuthError) {
    return NextResponse.json(
      { error: "Account data deleted but auth cleanup failed. Contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
