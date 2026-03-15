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

  const rl = rateLimit(`${user.id}:avatar_upload`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const admin = createAdminClient();
  const contentType = request.headers.get("content-type") || "";

  // Emoji avatar
  if (contentType.includes("application/json")) {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    if (!body.emoji || typeof body.emoji !== "string") {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    await admin
      .from("users")
      .update({
        avatar_emoji: body.emoji,
        avatar_url: null,
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true, avatar_emoji: body.emoji });
  }

  // File upload
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}/avatar.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  // Delete old avatar if exists
  await admin.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.gif`, `${user.id}/avatar.webp`]);

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from("avatars")
    .getPublicUrl(fileName);

  const avatarUrl = urlData.publicUrl;

  // Update user record
  await admin
    .from("users")
    .update({
      avatar_url: avatarUrl,
      avatar_emoji: null,
    })
    .eq("id", user.id);

  return NextResponse.json({ success: true, avatar_url: avatarUrl });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:avatar_delete`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const admin = createAdminClient();

  // Remove from storage
  await admin.storage.from("avatars").remove([
    `${user.id}/avatar.jpg`,
    `${user.id}/avatar.png`,
    `${user.id}/avatar.gif`,
    `${user.id}/avatar.webp`,
  ]);

  // Clear from user record
  await admin
    .from("users")
    .update({ avatar_url: null, avatar_emoji: null })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
