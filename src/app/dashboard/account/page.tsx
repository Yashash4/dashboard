import { User } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { AccountSettings } from "@/components/dashboard/account-settings";
import { NotificationPreferences } from "@/components/dashboard/notification-preferences";
import { TimezoneSetting } from "@/components/dashboard/timezone-setting";
import { SecuritySection } from "@/components/dashboard/security-section";
import { DangerZone } from "@/components/dashboard/danger-zone";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  const [profileRes, channelsRes, agentsRes, ticketsRes] = await Promise.all([
    supabase
      .from("users")
      .select("name, email, role, created_at")
      .eq("id", authUser.id)
      .single(),
    supabase
      .from("channels")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id)
      .eq("status", "connected"),
    supabase
      .from("user_agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id)
      .eq("deployed", true),
    supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id)
      .in("status", ["open", "in_progress"]),
  ]);

  const profile = profileRes.data;

  if (!profile) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Account</h1>
        <p className="text-muted-foreground mb-6">Your account settings.</p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground">
                Unable to load your profile. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AccountSettings
        profile={profile}
        stats={{
          channels_connected: channelsRes.count || 0,
          agents_deployed: agentsRes.count || 0,
          open_tickets: ticketsRes.count || 0,
        }}
      />
      <NotificationPreferences />
      <TimezoneSetting />
      <SecuritySection createdAt={profile.created_at} />
      <DangerZone email={profile.email} />
    </div>
  );
}
