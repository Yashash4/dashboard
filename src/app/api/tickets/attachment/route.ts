import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`${user.id}:ticket_attachment`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const ticketId = formData.get("ticket_id") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Supported: images, PDF, TXT, CSV, MD, DOC" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify ticket belongs to user
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Check attachment count (max 5 per ticket)
  const { count } = await admin
    .from("ticket_attachments")
    .select("id", { count: "exact", head: true })
    .eq("ticket_id", ticketId);

  if ((count || 0) >= 5) {
    return NextResponse.json(
      { error: "Maximum 5 attachments per ticket" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "bin";
  const fileName = `${ticketId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("ticket-attachments")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // 2.33: Generate signed URL with 1-hour expiry instead of public URL
  const { data: signedUrlData, error: signError } = await admin.storage
    .from("ticket-attachments")
    .createSignedUrl(fileName, 3600); // 1 hour expiry

  if (signError || !signedUrlData?.signedUrl) {
    // Cleanup uploaded file on signed URL error
    await admin.storage.from("ticket-attachments").remove([fileName]);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  // Record in DB — store storage_path for re-generating signed URLs later
  const { data: attachment, error: dbError } = await admin
    .from("ticket_attachments")
    .insert({
      ticket_id: ticketId,
      user_id: user.id,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: fileName,
      url: signedUrlData.signedUrl,
    })
    .select("id, file_name, file_size, file_type, url")
    .single();

  if (dbError || !attachment) {
    // Cleanup uploaded file on DB error
    await admin.storage.from("ticket-attachments").remove([fileName]);
    return NextResponse.json({ error: "Failed to save attachment" }, { status: 500 });
  }

  return NextResponse.json({ attachment });
}
