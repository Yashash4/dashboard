import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  // Auth: admin only
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { plan, status, billing_cycle, price, expires_at } = body as {
    plan?: string;
    status?: string;
    billing_cycle?: string;
    price?: number;
    expires_at?: string | null;
  };

  if (!plan || !status || !billing_cycle || price === undefined) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const validPlans = ["starter", "pro", "enterprise"];
  const validStatuses = ["active", "cancelled", "expired", "pending"];
  const validCycles = ["monthly", "annual"];

  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!validCycles.includes(billing_cycle)) {
    return NextResponse.json(
      { error: "Invalid billing cycle" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify target user exists
  const { data: targetUser } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Upsert subscription
  const subscriptionData = {
    user_id: userId,
    plan,
    status,
    billing_cycle,
    price,
    expires_at: expires_at || null,
  };

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const { error } = await admin
      .from("subscriptions")
      .update(subscriptionData)
      .eq("user_id", userId);

    if (error) {
      console.error("[admin/subscription] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }
  } else {
    const { error } = await admin.from("subscriptions").insert(subscriptionData);

    if (error) {
      console.error("[admin/subscription] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
