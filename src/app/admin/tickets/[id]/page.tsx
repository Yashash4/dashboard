import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase-admin";
import { AdminTicketThread } from "@/components/dashboard/admin-ticket-thread";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: ticket } = await admin
    .from("support_tickets")
    .select(
      "id, subject, description, status, priority, created_at, updated_at, user_id, users(name, email)"
    )
    .eq("id", id)
    .single();

  if (!ticket) {
    notFound();
  }

  const { data: messages } = await admin
    .from("ticket_messages")
    .select("id, sender_role, message, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  // Extract user info (Supabase returns array for joins)
  const user = Array.isArray(ticket.users)
    ? ticket.users[0]
    : ticket.users;

  return (
    <AdminTicketThread
      ticket={{
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        user_id: ticket.user_id,
        user_name: user?.name || null,
        user_email: user?.email || "Unknown",
      }}
      messages={messages || []}
    />
  );
}
