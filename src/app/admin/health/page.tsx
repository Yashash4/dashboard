import { createAdminClient } from "@/lib/supabase-admin";
import { AdminBulkHealth } from "@/components/dashboard/admin-bulk-health";

export const dynamic = "force-dynamic";

export default async function BulkHealthPage() {
  const admin = createAdminClient();

  const { data: instances } = await admin
    .from("vps_instances")
    .select("user_id, hostname, ip_address, status, ssh_user, ssh_port, users!inner(name, email)")
    .order("status", { ascending: true });

  return <AdminBulkHealth instances={instances || []} />;
}
