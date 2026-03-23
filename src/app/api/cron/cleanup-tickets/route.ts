import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// GET /api/cron/cleanup-tickets — auto-delete resolved tickets after 48 hours
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // ST_MED_04: Only check resolved_at to avoid deleting recently-resolved tickets.
    // The old OR condition with updated_at could delete tickets that were resolved
    // moments ago but had an old updated_at timestamp.
    // Fall back to updated_at only if resolved_at is null (legacy tickets).
    const { data: oldTickets, error: fetchError } = await supabase
      .from("support_tickets")
      .select("id, resolved_at")
      .eq("status", "resolved")
      .not("resolved_at", "is", null)
      .lt("resolved_at", cutoff);

    if (fetchError) throw fetchError;
    if (!oldTickets || oldTickets.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    const ticketIds = oldTickets.map((t) => t.id);

    // Delete attachments from Supabase Storage
    const { data: attachments } = await supabase
      .from("ticket_attachments")
      .select("storage_path")
      .in("ticket_id", ticketIds);

    if (attachments && attachments.length > 0) {
      const paths = attachments.map((a) => a.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from("ticket-attachments").remove(paths);
      }
      await supabase
        .from("ticket_attachments")
        .delete()
        .in("ticket_id", ticketIds);
    }

    // Delete messages (foreign key)
    await supabase
      .from("ticket_messages")
      .delete()
      .in("ticket_id", ticketIds);

    // Delete tickets
    const { error: deleteError } = await supabase
      .from("support_tickets")
      .delete()
      .in("id", ticketIds);

    if (deleteError) throw deleteError;

    return NextResponse.json({ deleted: ticketIds.length });
  } catch {
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
