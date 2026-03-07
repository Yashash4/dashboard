import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { NavigationProgress } from "@/components/dashboard/navigation-progress";
import { UserProvider } from "@/lib/user-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
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

  // Parallel fetch — cuts ~400ms vs sequential
  const [{ data: user }, { data: subscription }] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, role")
      .eq("id", authUser.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", authUser.id)
      .single(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const plan = (subscription?.plan as string) || "starter";

  return (
    <UserProvider
      value={{
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        plan,
      }}
    >
      <NavigationProgress />
      <SidebarProvider>
        <AppSidebar user={user} plan={plan} />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b border-border px-6">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
