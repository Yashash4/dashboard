import Link from "next/link";
import { AlertTriangle, MessageSquare } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelManager } from "@/components/dashboard/channel-manager";

export default async function ChannelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let channels: any[] | null = null;
  let vps: any = null;

  try {
    const [channelsRes, vpsRes] = await Promise.all([
      supabase
        .from("channels")
        .select("id, channel_type, status, configured_at, health_status, last_health_check, error_message")
        .eq("user_id", user.id)
        .order("configured_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("vps_instances")
        .select("status")
        .eq("user_id", user.id)
        .single(),
    ]);
    channels = channelsRes.data;
    vps = vpsRes.data;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">We couldn&apos;t load your data. Please refresh the page.</p>
      </div>
    );
  }

  const vpsWarning = !vps || vps.status !== "running";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Channels</h1>
      <p className="text-muted-foreground mb-6">
        Connect your messaging platforms.
      </p>
      {vpsWarning && (
        <div className="mb-4 flex items-center gap-2 rounded-none border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-500">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Your server is not running. <Link href="/vps" className="underline font-medium">Start it</Link> to manage channels.</span>
        </div>
      )}
      {!channels || channels.length === 0 ? (
        <Card className="border-border mb-6">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                No Channels Connected
              </h2>
              <p className="text-muted-foreground mb-3 max-w-md mx-auto">
                Connect messaging platforms like WhatsApp, Telegram, Discord, or Slack to let your AI assistant handle conversations automatically.
              </p>
              <p className="text-xs text-muted-foreground">
                Choose a platform below to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <ChannelManager channels={channels || []} />
    </div>
  );
}
