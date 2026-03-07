import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyPayment } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider, orderId, paymentId, signature, metadata } = body as {
    provider?: PaymentProvider;
    orderId?: string;
    paymentId?: string;
    signature?: string;
    metadata?: Record<string, any>;
  };

  if (!provider || !orderId || !paymentId) {
    return NextResponse.json(
      { error: "Missing required payment data" },
      { status: 400 }
    );
  }

  // Verify payment with provider
  const result = verifyPayment({
    provider,
    orderId,
    paymentId,
    signature,
    metadata: metadata || {},
  });

  if (!result.verified) {
    return NextResponse.json(
      { error: result.error || "Payment verification failed" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const meta = metadata || {};

  try {
    // Record payment
    await admin.from("payments").insert({
      user_id: user.id,
      amount: meta.amount || 0,
      description: getDescription(meta),
      status: "paid",
    });

    // Fulfill based on payment type
    await fulfill(admin, user.id, meta);

    return NextResponse.json({ success: true, verified: true });
  } catch (err: any) {
    console.error("[payments/verify] Fulfillment error:", err);
    return NextResponse.json(
      { error: "Payment verified but fulfillment failed. Contact support." },
      { status: 500 }
    );
  }
}

async function fulfill(admin: any, userId: string, meta: Record<string, any>) {
  switch (meta.payment_type) {
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
        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: meta.plan,
            billing_cycle: meta.billing_cycle || "monthly",
            price: meta.amount || 0,
            status: "active",
            started_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
      break;
    }
  }
}

function getDescription(meta: Record<string, any>): string {
  switch (meta.payment_type) {
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
