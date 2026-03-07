import { FileText } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { Card, CardContent } from "@/components/ui/card";

export default async function LogsPage() {
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
        <h1 className="text-2xl font-bold mb-1">Logs Explorer</h1>
        <p className="text-muted-foreground mb-6">
          Search and filter your VPS logs in real-time.
        </p>
        <UpgradePrompt requiredPlan="pro" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Logs Explorer</h1>
      <p className="text-muted-foreground mb-6">
        Search and filter your VPS logs in real-time.
      </p>
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Logs Explorer</h2>
            <p className="text-muted-foreground">
              Real-time log streaming, search, and filtering — coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
