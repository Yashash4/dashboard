import { createClient } from "@/lib/supabase-server";
import { TicketList } from "@/components/dashboard/ticket-list";

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  const PAGE_SIZE = 20;

  const { data: tickets, error, count } = await supabase
    .from("support_tickets")
    .select("id, subject, status, priority, category, created_at, user_read_at, ticket_messages(sender_role, created_at)", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load your tickets. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <TicketList
      tickets={tickets || []}
      totalCount={count || 0}
      pageSize={PAGE_SIZE}
    />
  );
}
