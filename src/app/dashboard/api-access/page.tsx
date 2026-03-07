import { Key } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { Card, CardContent } from "@/components/ui/card";

export default async function ApiAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = (subscription?.plan as string) || "starter";

  if (!hasAccess(plan, "pro")) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">API Access</h1>
        <p className="text-muted-foreground mb-6">
          Direct API access to your OpenClaw instance.
        </p>
        <UpgradePrompt requiredPlan="pro" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">API Access</h1>
      <p className="text-muted-foreground mb-6">
        Direct API access to your OpenClaw instance.
      </p>
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">API Access</h2>
            <p className="text-muted-foreground">
              API key management, endpoint docs, and usage tracking — coming
              soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
