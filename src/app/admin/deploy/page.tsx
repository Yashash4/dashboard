import { createAdminClient } from "@/lib/supabase-admin";
import { AdminDeploy } from "@/components/dashboard/admin-deploy";

export default async function DeployPage() {
  const admin = createAdminClient();

  const { data: customers } = await admin
    .from("users")
    .select("id, name, email, vps_instances(id, status)")
    .eq("role", "customer")
    .order("name");

  return <AdminDeploy customers={customers || []} />;
}
