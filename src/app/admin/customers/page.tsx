import { createAdminClient } from "@/lib/supabase-admin";
import { AdminCustomers } from "@/components/dashboard/admin-customers";

export default async function CustomersPage() {
  const admin = createAdminClient();

  const { data: customers } = await admin
    .from("users")
    .select(
      "id, name, email, created_at, subscriptions(plan, status), vps_instances(status, ip_address)"
    )
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  return <AdminCustomers customers={customers || []} />;
}
