import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyPayment } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import type { PaymentProvider } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`${ip}:payment_verify`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { provider, orderId, paymentId, signature } = body as {
    provider?: PaymentProvider;
    orderId?: string;
    paymentId?: string;
    signature?: string;
  };

  if (!provider || !orderId || !paymentId) {
    return NextResponse.json(
      { error: "Missing required payment data" },
      { status: 400 }
    );
  }

  // Verify payment signature with Razorpay
  const result = verifyPayment({
    provider,
    orderId,
    paymentId,
    signature,
    metadata: {},
  });

  if (!result.verified) {
    return NextResponse.json(
      { error: result.error || "Payment verification failed" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Look up the order server-side — never trust client metadata
  const { data: order } = await admin
    .from("payment_orders")
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) {
    return NextResponse.json(
      { error: "Order not found or does not belong to this user" },
      { status: 400 }
    );
  }

  const meta: Record<string, any> = order.metadata || {};
  const serverAmount = order.amount || 0;
  const serverPaymentType = order.payment_type;

  // Get user profile for audit
  const { data: profile } = await admin
    .from("users")
    .select("email, name")
    .eq("id", user.id)
    .single();

  try {
    // Record payment with FULL audit trail
    await admin.from("payments").insert({
      user_id: user.id,
      amount: serverAmount,
      description: getDescription(serverPaymentType, meta),
      status: "paid",
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature,
      currency: order.currency || "USD",
      payment_type: serverPaymentType,
      billing_cycle: meta.billing_cycle || null,
      plan: meta.plan || null,
      user_email: profile?.email || user.email,
      user_name: profile?.name || null,
      ip_address: ip,
      region: order.region || "international",
      provider: "razorpay",
      metadata: {
        order_created_at: order.created_at,
        verified_at: new Date().toISOString(),
      },
    });

    // Mark order as fulfilled
    await admin
      .from("payment_orders")
      .update({
        status: "fulfilled",
        payment_id: paymentId,
        fulfilled_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    // Fulfill based on server-side payment type
    await fulfill(admin, user.id, serverPaymentType, meta, serverAmount);

    return NextResponse.json({ success: true, verified: true });
  } catch (err: any) {
    console.error("Payment fulfillment error:", err);
    return NextResponse.json(
      { error: "Payment verified but fulfillment failed. Contact support." },
      { status: 500 }
    );
  }
}

async function fulfill(
  admin: any,
  userId: string,
  paymentType: string,
  meta: Record<string, any>,
  amount: number
) {
  switch (paymentType) {
    case "agent_purchase": {
      if (meta.agent_id) {
        await admin.from("user_agents").insert({
          user_id: userId,
          agent_id: meta.agent_id,
          deployed: false,
        });
      }
      break;
    }

    case "subscription_new":
    case "subscription_upgrade": {
      if (meta.plan) {
        const now = new Date();
        const billingCycle = meta.billing_cycle || "monthly";
        const expiresAt = new Date(now);
        if (billingCycle === "annual") {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: meta.plan,
            billing_cycle: billingCycle,
            price: amount,
            status: "active",
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Reset model change counter on new/renewed subscription
        await admin
          .from("models")
          .update({ changes_this_month: 0 })
          .eq("user_id", userId);
      }
      break;
    }
  }
}

function getDescription(
  paymentType: string,
  meta: Record<string, any>
): string {
  switch (paymentType) {
    case "agent_purchase":
      return `Agent: ${meta.agent_name || "Premium Agent"}`;
    case "subscription_new":
      return `Subscription: ${meta.plan || "Pro"} Plan`;
    case "subscription_upgrade":
      return `Upgrade to ${meta.plan || "Pro"} Plan`;
    default:
      return "ClawHQ Payment";
  }
}
