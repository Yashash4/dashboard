import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { hasAccess } from "@/lib/tier";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function EventsPage() {
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
      <h1 className="text-2xl font-bold mb-1">Live Events</h1>
      <p className="text-muted-foreground mb-6">
        Real-time activity stream from your AI agents.
      </p>
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Live Event Feed</h2>
            <p className="text-muted-foreground">
              Real-time event streaming — coming in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
