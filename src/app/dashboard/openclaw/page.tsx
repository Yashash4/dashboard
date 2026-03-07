import { Globe, ExternalLink, KeyRound } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OpenClawCredentialsBanner } from "@/components/dashboard/openclaw-credentials-banner";

export default async function OpenClawPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("openclaw_dashboard_url, openclaw_auth_token, dashboard_username, dashboard_password")
    .eq("user_id", user.id)
    .single();

  const baseUrl = vps?.openclaw_dashboard_url?.replace(/\/$/, "");
  const token = vps?.openclaw_auth_token;
  const dashboardUrl = baseUrl && token ? `${baseUrl}/#token=${token}` : baseUrl;

  if (!baseUrl) {
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
      {vps.dashboard_username && vps.dashboard_password && (
        <OpenClawCredentialsBanner
          username={vps.dashboard_username}
          password={vps.dashboard_password}
        />
      )}
      <iframe
        src={dashboardUrl}
        className="flex-1 w-full border-0"
        allow="clipboard-read; clipboard-write; storage-access"
        title="OpenClaw Dashboard"
      />
    </div>
  );
}
