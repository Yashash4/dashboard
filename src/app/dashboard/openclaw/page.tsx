import { Globe, ExternalLink } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { hasAccess } from "@/lib/tier";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { OpenClawCredentialsBanner } from "@/components/dashboard/openclaw-credentials-banner";
import { OpenClawEmbed } from "@/components/dashboard/openclaw-embed";
import { decryptField } from "@/lib/credential-utils";

export default async function OpenClawPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  if (subError && subError.code !== "PGRST116") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load your subscription. Please refresh the page.</p>
      </div>
    );
  }

  const plan = (subscription?.plan as string) || "starter";

  if (!hasAccess(plan, "pro")) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">OpenClaw Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Access your OpenClaw dashboard.
        </p>
        <UpgradePrompt requiredPlan="pro" />
      </div>
    );
  }

  const admin = createAdminClient();
  let vps: {
    openclaw_dashboard_url: string | null;
    dashboard_username: string | null;
    dashboard_password: string | null;
  } | null = null;
  try {
    const { data } = await admin
      .from("vps_instances")
      .select("openclaw_dashboard_url, dashboard_username, dashboard_password")
      .eq("user_id", user.id)
      .single();
    vps = data;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load your VPS data. Please refresh the page.</p>
      </div>
    );
  }

  const dashboardUrl = vps?.openclaw_dashboard_url?.replace(/\/$/, "");

  if (!dashboardUrl) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">OpenClaw Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Access your OpenClaw dashboard.
        </p>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                OpenClaw dashboard not configured yet
              </h2>
              <p className="text-muted-foreground text-sm">
                Your OpenClaw instance will be available here once your VPS is
                provisioned.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div>
          <h1 className="text-lg font-bold">OpenClaw Dashboard</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
            Open in new tab
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
      {vps?.dashboard_username && vps?.dashboard_password && (
        <OpenClawCredentialsBanner
          username={vps.dashboard_username}
          password={decryptField(vps.dashboard_password)}
        />
      )}
      <OpenClawEmbed
        dashboardUrl={dashboardUrl}
        embedKey={vps?.dashboard_password ? decryptField(vps.dashboard_password) : ""}
      />
    </div>
  );
}
