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

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  // Fetch ticket (RLS ensures user can only see their own)
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, subject, status, priority, created_at, updated_at, satisfaction_rating, category")
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

  // Mark ticket as read by user (non-blocking)
  const { createAdminClient } = await import("@/lib/supabase-admin");
  const admin = createAdminClient();
  admin
    .from("support_tickets")
    .update({ user_read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .then(() => {}, () => {});

  return <TicketThread ticket={ticket} messages={messages || []} />;
}
