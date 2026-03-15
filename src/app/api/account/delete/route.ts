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
  // Phase 1: child tables (no FK dependencies on other user tables)
  await Promise.allSettled([
    admin.from("ticket_messages").delete().in(
      "ticket_id",
      (await admin.from("support_tickets").select("id").eq("user_id", userId)).data?.map((t) => t.id) || []
    ),
    admin.from("channel_credentials").delete().in(
      "channel_id",
      (await admin.from("channels").select("id").eq("user_id", userId)).data?.map((c) => c.id) || []
    ),
    admin.from("chat_messages").delete().in(
      "conversation_id",
      (await admin.from("chat_conversations").select("id").eq("user_id", userId)).data?.map((c) => c.id) || []
    ),
    admin.from("user_notifications").delete().eq("user_id", userId),
    admin.from("user_onboarding").delete().eq("user_id", userId),
  ]);

  // Phase 2: parent tables
  await Promise.allSettled([
    admin.from("ticket_attachments").delete().eq("user_id", userId),
    admin.from("chat_conversations").delete().eq("user_id", userId),
    admin.from("support_tickets").delete().eq("user_id", userId),
    admin.from("user_agents").delete().eq("user_id", userId),
    admin.from("channels").delete().eq("user_id", userId),
    admin.from("subscriptions").delete().eq("user_id", userId),
    admin.from("models").delete().eq("user_id", userId),
    admin.from("agent_analytics").delete().eq("user_id", userId),
  ]);

  // Phase 3: clean up Supabase Storage
  await Promise.allSettled([
    admin.storage.from("avatars").remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.gif`, `${userId}/avatar.webp`]),
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
