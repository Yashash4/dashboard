import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  if (!hasAccess(subscription?.plan || "starter", "ultra")) {
    redirect("/billing?upgrade=ultra");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Sessions</h1>
      <p className="text-muted-foreground mb-6">
        Track agent sessions, token usage, and costs.
      </p>
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Session Tracker</h2>
            <p className="text-muted-foreground">
              Session tracking with token & cost analysis — coming in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
