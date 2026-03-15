import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:account_update`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { name } = body as { name?: string };

  if (!name?.trim() || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (name.trim().length > 100) {
    return NextResponse.json(
      { error: "Name must be 100 characters or less" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Update users table
  const { error: dbError } = await admin
    .from("users")
    .update({ name: name.trim() })
    .eq("id", user.id);

  if (dbError) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  // Update Supabase auth metadata
  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { name: name.trim() },
  });

  if (authError) {
    return NextResponse.json(
      { error: "Profile updated but metadata sync failed. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
