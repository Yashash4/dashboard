import { createClient } from "@/lib/supabase-server";
import { TicketList } from "@/components/dashboard/ticket-list";

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, status, priority, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <TicketList tickets={tickets || []} />;
}
