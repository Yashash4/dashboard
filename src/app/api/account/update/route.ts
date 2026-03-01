import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body as { name?: string };

  if (!name?.trim() || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
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
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { name: name.trim() },
  });

  return NextResponse.json({ success: true });
}
