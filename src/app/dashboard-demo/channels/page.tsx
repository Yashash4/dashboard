"use client";

import {
  MessageSquare,
  Plus,
  Check,
  Clock,
  Unplug,
  Send,
  Hash,
  Phone,
  Globe,
  Users,
  Radio,
  MessageCircle,
  HelpCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CHANNEL_TYPES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  telegram: { label: "Telegram", icon: Send },
  discord: { label: "Discord", icon: Hash },
  slack: { label: "Slack", icon: MessageCircle },
  teams: { label: "Teams", icon: Users },
  webchat: { label: "Webchat", icon: Globe },
  whatsapp: { label: "WhatsApp", icon: Phone },
  signal: { label: "Signal", icon: Radio },
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  connected: {
    label: "Connected",
    className: "bg-green-600 text-white border-green-600",
    icon: Check,
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-600 text-white border-yellow-600",
    icon: Clock,
  },
  disconnected: {
    label: "Disconnected",
    className: "bg-secondary text-secondary-foreground border-secondary",
    icon: Unplug,
  },
};

const DEMO_CHANNELS = [
  { id: "ch-1", channel_type: "whatsapp", status: "connected", configured_at: "2026-02-10T00:00:00Z", health_status: "healthy", last_health_check: "2026-03-22T09:55:00Z", error_message: null },
  { id: "ch-2", channel_type: "telegram", status: "connected", configured_at: "2026-02-12T00:00:00Z", health_status: "healthy", last_health_check: "2026-03-22T09:55:00Z", error_message: null },
  { id: "ch-3", channel_type: "discord", status: "connected", configured_at: "2026-02-15T00:00:00Z", health_status: "healthy", last_health_check: "2026-03-22T09:55:00Z", error_message: null },
  { id: "ch-4", channel_type: "slack", status: "connected", configured_at: "2026-02-18T00:00:00Z", health_status: "healthy", last_health_check: "2026-03-22T09:55:00Z", error_message: null },
  { id: "ch-5", channel_type: "teams", status: "connected", configured_at: "2026-02-20T00:00:00Z", health_status: "healthy", last_health_check: "2026-03-22T09:55:00Z", error_message: null },
  { id: "ch-6", channel_type: "webchat", status: "connected", configured_at: "2026-03-01T00:00:00Z", health_status: "healthy", last_health_check: "2026-03-22T09:55:00Z", error_message: null },
];

export default function DemoChannelsPage() {
  const connectedCount = DEMO_CHANNELS.filter((c) => c.status === "connected").length;
  const connectedTypes = DEMO_CHANNELS.filter((c) => c.status === "connected").map((c) => c.channel_type);
  const availableSetup = ["signal"].filter((t) => !connectedTypes.includes(t));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Channels</h1>
      <p className="text-muted-foreground mb-6">
        Connect your messaging platforms.
      </p>

      <div className="space-y-6">
        {/* Summary */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">My Channels</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Connected:{" "}
                <strong className="text-foreground">{connectedCount}</strong>
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Check Health
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Channel Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_CHANNELS.map((channel, index) => {
            const config = CHANNEL_TYPES[channel.channel_type];
            const status = STATUS_CONFIG[channel.status] || STATUS_CONFIG.disconnected;
            const Icon = config?.icon || MessageSquare;
            const StatusIcon = status.icon;

            return (
              <Card
                key={channel.id}
                className={`border-border transition-colors ${
                  channel.status === "connected"
                    ? "border-green-600/30 bg-green-600/5"
                    : channel.status === "pending"
                      ? "border-yellow-600/30 bg-yellow-600/5"
                      : ""
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">
                        {config?.label || channel.channel_type}
                      </h3>
                      {index === 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        aria-label="Move channel up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === DEMO_CHANNELS.length - 1}
                        aria-label="Move channel down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Badge className={`${status.className} text-xs ml-1`}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Health indicator */}
                  {channel.health_status && channel.health_status !== "unknown" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          channel.health_status === "healthy"
                            ? "bg-green-500"
                            : channel.health_status === "degraded"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <span className="text-xs text-muted-foreground capitalize">
                        {channel.health_status}
                      </span>
                    </div>
                  )}

                  {channel.configured_at && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Connected{" "}
                      {new Date(channel.configured_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  )}

                  {channel.last_health_check && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Last checked{" "}
                      {new Date(channel.last_health_check).toLocaleTimeString(
                        "en-US",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  )}

                  {/* Disconnect button for connected channels */}
                  {channel.status === "connected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      disabled
                    >
                      <Unplug className="mr-2 h-3 w-3" />
                      Disconnect
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Channels requiring manual setup */}
        {availableSetup.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Requires Setup</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableSetup.map((type) => {
                  const config = CHANNEL_TYPES[type];
                  const Icon = config?.icon || MessageSquare;

                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{config?.label || type}</p>
                          <p className="text-xs text-muted-foreground">
                            Signal requires phone number registration on your server. Contact support to set it up.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                      >
                        Request Setup
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
