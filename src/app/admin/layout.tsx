import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("id", authUser.id)
    .single();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  // 2.21: Defense-in-depth MFA check — require AAL2 if TOTP is enrolled
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  const headersList = await headers();
  const currentPath = headersList.get("x-next-pathname") || "";

  if (
    aal &&
    aal.nextLevel === "aal2" &&
    aal.currentLevel !== "aal2" &&
    !currentPath.startsWith("/admin/verify-2fa")
  ) {
    redirect("/admin/verify-2fa");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
