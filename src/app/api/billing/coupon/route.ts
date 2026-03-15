import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:coupon`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { code } = body as { code?: string };

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "Coupon code is required" },
      { status: 400 }
    );
  }

  const trimmed = code.trim();

  if (trimmed.length < 4 || trimmed.length > 20) {
    return NextResponse.json(
      { error: "Coupon code must be 4-20 characters" },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return NextResponse.json(
      { error: "Coupon code must be alphanumeric" },
      { status: 400 }
    );
  }

  // Placeholder: no coupon system built yet
  return NextResponse.json(
    { error: "Invalid or expired coupon code" },
    { status: 400 }
  );
}
