"use client";

import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { UserProvider } from "@/lib/user-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const DEMO_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Demo User",
  email: "demo@clawhq.tech",
  role: "user",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";

  return (
    <UserProvider
      value={{
        user: DEMO_USER,
        plan,
      }}
    >
      <SidebarProvider>
        <AppSidebar user={DEMO_USER} plan={plan} basePath="/dashboard-demo" queryString={`?plan=${plan}`} />
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
