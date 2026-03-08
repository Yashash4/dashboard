import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { logAudit, getClientIp } from "@/lib/audit-log";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const plan = (sub?.plan as string) || "starter";
  if (!hasAccess(plan, "pro")) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  // Verify ownership
  const { data: doc } = await admin
    .from("kb_documents")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  // Delete storage file if exists
  if (doc.storage_path) {
    await admin.storage
      .from("knowledge-base")
      .remove([doc.storage_path]);
  }

  // Delete chunks (cascade will handle this, but be explicit)
  await admin.from("kb_chunks").delete().eq("document_id", id);

  // Delete document
  const { error } = await admin.from("kb_documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }

  logAudit({
    userId: user.id,
    action: "kb_document_deleted",
    entityType: "kb_document",
    entityId: id,
    category: "knowledge_base",
    ip: getClientIp(request),
  });

  return NextResponse.json({ success: true });
}
