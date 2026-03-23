import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createOrder, resolveProvider } from "@/lib/payments";
import type { PaymentType } from "@/lib/payments/types";
import { rateLimit } from "@/lib/rate-limit";
import { PLAN_PRICES } from "@/lib/payments/plans";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:payment_create`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { amount, paymentType, metadata } = body as {
    amount?: number;
    paymentType?: PaymentType;
    metadata?: Record<string, any>;
  };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (!paymentType) {
    return NextResponse.json(
      { error: "paymentType is required" },
      { status: 400 }
    );
  }

  // Validate amount matches server-side plan pricing for subscriptions
  if (paymentType === "subscription_new" || paymentType === "subscription_upgrade") {
    const plan = (metadata as Record<string, any>)?.plan as string | undefined;
    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Invalid or missing plan" }, { status: 400 });
    }
    const prices = PLAN_PRICES[plan];
    const billingCycle = (metadata as Record<string, any>)?.billing_cycle as string | undefined;
    const expectedAmount = billingCycle === "annual" ? prices.annual : prices.monthly;
    if (amount !== expectedAmount) {
      return NextResponse.json(
        { error: "Amount does not match plan pricing" },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();

  // Get user info for prefill + audit trail
  const { data: profile } = await admin
    .from("users")
    .select("email, name")
    .eq("id", user.id)
    .single();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { region, currency } = resolveProvider(request);

  try {
    const result = await createOrder(
      {
        userId: user.id,
        amount,
        paymentType,
        metadata: metadata || {},
        userEmail: profile?.email || user.email,
        userName: profile?.name || undefined,
      },
      request
    );

    // Store order with full audit context
    await admin.from("payment_orders").insert({
      order_id: result.orderId,
      user_id: user.id,
      provider: result.provider,
      amount,
      currency: result.currency,
      payment_type: paymentType,
      metadata: metadata || {},
      status: "created",
      ip_address: ip,
      region,
      user_email: profile?.email || user.email,
      user_name: profile?.name || null,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("create-order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
