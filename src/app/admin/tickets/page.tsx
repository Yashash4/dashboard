import { createAdminClient } from "@/lib/supabase-admin";
import { AdminTickets } from "@/components/dashboard/admin-tickets";

export default async function AdminTicketsPage() {
  const admin = createAdminClient();

  const { data: tickets } = await admin
    .from("support_tickets")
    .select(
      "id, subject, status, priority, created_at, updated_at, user_id, users(name, email)"
    )
    .order("created_at", { ascending: false });

  return <AdminTickets tickets={tickets || []} />;
}
