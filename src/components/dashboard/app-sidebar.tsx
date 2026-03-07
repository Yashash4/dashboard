"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Brain,
  Bot,
  MessageSquare,
  MessageCircle,
  ShoppingBag,
  Globe,
  HelpCircle,
  CreditCard,
  User as UserIcon,
  BarChart3,
  Users,
  Rocket,
  Ticket,
  ScrollText,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import { createClient } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const customerNav = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "VPS", href: "/vps", icon: Server },
  { title: "Models", href: "/models", icon: Brain },
  { title: "Agents", href: "/agents", icon: Bot },
  { title: "Store", href: "/store", icon: ShoppingBag },
  { title: "Chat", href: "/chat", icon: MessageCircle },
  { title: "Channels", href: "/channels", icon: MessageSquare },
  { title: "OpenClaw", href: "/openclaw", icon: Globe },
  { title: "Support", href: "/support", icon: HelpCircle },
  { title: "Billing", href: "/billing", icon: CreditCard },
  { title: "Account", href: "/account", icon: UserIcon },
];

const adminNav = [
  { title: "Stats", href: "/admin", icon: BarChart3 },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Deploy", href: "/admin/deploy", icon: Rocket },
  { title: "Tickets", href: "/admin/tickets", icon: Ticket },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { title: "Security", href: "/admin/security", icon: ShieldCheck },
];

interface AppSidebarProps {
  user: {
    name: string | null;
    email: string;
    role: string;
  };
  plan?: string;
}

export function AppSidebar({ user, plan = "starter" }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold font-mono">
                C
              </span>
            </div>
            <span className="text-sidebar-foreground text-base font-semibold tracking-widest font-mono uppercase">
              ClawHQ
            </span>
          </Link>
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 ${
              plan === "pro"
                ? "bg-primary/15 text-primary border border-primary/30"
                : plan === "enterprise"
                  ? "bg-yellow-500/15 text-yellow-500 border border-yellow-500/30"
                  : "bg-sidebar-foreground/10 text-sidebar-foreground/60 border border-sidebar-foreground/20"
            }`}
          >
            {plan}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user.role === "admin" && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">
              {user.name || "User"}
            </p>
            <p className="text-xs truncate text-sidebar-foreground/60">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
