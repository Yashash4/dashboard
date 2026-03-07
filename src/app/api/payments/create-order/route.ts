import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createOrder } from "@/lib/payments";
import type { PaymentType } from "@/lib/payments/types";
import { rateLimit } from "@/lib/rate-limit";

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

  const body = await request.json();
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

  // Get user info for prefill
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("email, name")
    .eq("id", user.id)
    .single();

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

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[payments/create-order]", err);
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
