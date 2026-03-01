import { MessageSquare } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelManager } from "@/components/dashboard/channel-manager";

export default async function ChannelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: channels } = await supabase
    .from("channels")
    .select("id, channel_type, status, configured_at")
    .eq("user_id", user.id)
    .order("configured_at", { ascending: false, nullsFirst: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Channels</h1>
      <p className="text-muted-foreground mb-6">
        Connect your messaging platforms.
      </p>
      {!channels || channels.length === 0 ? (
        <Card className="border-border mb-6">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                No Channels Connected
              </h2>
              <p className="text-muted-foreground">
                Connect a messaging platform below to start receiving messages.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <ChannelManager channels={channels || []} />
    </div>
  );
}
