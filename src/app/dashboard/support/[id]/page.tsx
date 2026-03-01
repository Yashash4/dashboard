import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase-server";
import { TicketThread } from "@/components/dashboard/ticket-thread";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch ticket (RLS ensures user can only see their own)
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, subject, status, priority, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ticket) {
    notFound();
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id, sender_role, message, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  return <TicketThread ticket={ticket} messages={messages || []} />;
}
