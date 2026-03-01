"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Check,
  Clock,
  Loader2,
  Unplug,
  Send,
  Hash,
  Phone,
  Globe,
  Users,
  Radio,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Channel {
  id: string;
  channel_type: string;
  status: string;
  configured_at: string | null;
}

interface ChannelTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  requiresSetup?: boolean;
  setupNote?: string;
}

// Channels with correct OpenClaw credential fields
const CHANNEL_TYPES: Record<string, ChannelTypeConfig> = {
  telegram: {
    label: "Telegram",
    icon: Send,
    fields: [
      {
        key: "bot_token",
        label: "Bot Token",
        placeholder: "Token from @BotFather (e.g. 123456:ABC-DEF...)",
        type: "password",
      },
    ],
  },
  discord: {
    label: "Discord",
    icon: Hash,
    fields: [
      {
        key: "bot_token",
        label: "Bot Token",
        placeholder: "Bot token from Discord Developer Portal",
        type: "password",
      },
    ],
  },
  slack: {
    label: "Slack",
    icon: MessageCircle,
    fields: [
      {
        key: "app_token",
        label: "App Token",
        placeholder: "App-level token (xapp-...)",
        type: "password",
      },
      {
        key: "bot_token",
        label: "Bot Token",
        placeholder: "Bot user OAuth token (xoxb-...)",
        type: "password",
      },
    ],
  },
  teams: {
    label: "Teams",
    icon: Users,
    fields: [
      {
        key: "app_id",
        label: "App ID",
        placeholder: "Azure Bot Resource App ID",
      },
      {
        key: "app_password",
        label: "App Password",
        placeholder: "Azure Bot Resource App Password",
        type: "password",
      },
      {
        key: "tenant_id",
        label: "Tenant ID",
        placeholder: "Azure AD Tenant ID",
      },
    ],
  },
  webchat: {
    label: "Webchat",
    icon: Globe,
    fields: [],
  },
  whatsapp: {
    label: "WhatsApp",
    icon: Phone,
    fields: [],
    requiresSetup: true,
    setupNote:
      "WhatsApp requires QR code pairing on your server. Contact support to set it up.",
  },
  signal: {
    label: "Signal",
    icon: Radio,
    fields: [],
    requiresSetup: true,
    setupNote:
      "Signal requires phone number registration on your server. Contact support to set it up.",
  },
};

// Channels that customers can self-configure
const SELF_CONFIGURABLE = ["telegram", "discord", "slack", "teams", "webchat"];
// Channels that require admin/manual setup
const REQUIRES_SETUP = ["whatsapp", "signal"];

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
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

export function ChannelManager({
  channels: initialChannels,
}: {
  channels: Channel[];
}) {
  const router = useRouter();
  const [channels, setChannels] = useState(initialChannels);
  const [connectType, setConnectType] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [disconnectChannel, setDisconnectChannel] = useState<Channel | null>(
    null
  );
  const [disconnecting, setDisconnecting] = useState(false);

  const connectedCount = channels.filter(
    (c) => c.status === "connected"
  ).length;
  const connectedTypes = channels.map((c) => c.channel_type);
  const availableSelfConfig = SELF_CONFIGURABLE.filter(
    (t) => !connectedTypes.includes(t)
  );
  const availableSetup = REQUIRES_SETUP.filter(
    (t) => !connectedTypes.includes(t)
  );

  const handleConnect = async () => {
    if (!connectType) return;
    const config = CHANNEL_TYPES[connectType];

    // Validate all required fields
    if (config.fields.length > 0) {
      const missing = config.fields.filter((f) => !credentials[f.key]?.trim());
      if (missing.length > 0) {
        toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
        return;
      }
    }

    setConnecting(true);
    try {
      const res = await fetch("/api/channels/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_type: connectType,
          credentials: config.fields.length > 0 ? credentials : {},
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to connect channel");
        return;
      }

      // Add or update channel in local state
      const existingIdx = channels.findIndex(
        (c) => c.channel_type === connectType
      );
      if (existingIdx >= 0) {
        setChannels((prev) =>
          prev.map((c, i) =>
            i === existingIdx
              ? {
                  ...c,
                  id: data.channel_id || c.id,
                  status: "connected",
                  configured_at: new Date().toISOString(),
                }
              : c
          )
        );
      } else {
        setChannels((prev) => [
          {
            id: data.channel_id,
            channel_type: connectType,
            status: "connected",
            configured_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      toast.success(`${config.label} connected successfully`);
      setConnectType(null);
      setCredentials({});
    } catch {
      toast.error("Failed to connect channel");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectChannel) return;
    setDisconnecting(true);

    try {
      const res = await fetch("/api/channels/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: disconnectChannel.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to disconnect channel");
        return;
      }

      setChannels((prev) =>
        prev.filter((c) => c.id !== disconnectChannel.id)
      );
      toast.success(
        `${CHANNEL_TYPES[disconnectChannel.channel_type]?.label || disconnectChannel.channel_type} disconnected`
      );
    } catch {
      toast.error("Failed to disconnect channel");
    } finally {
      setDisconnecting(false);
      setDisconnectChannel(null);
    }
  };

  const connectConfig = connectType ? CHANNEL_TYPES[connectType] : null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {channels.length > 0 && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">My Channels</CardTitle>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                Connected:{" "}
                <strong className="text-foreground">{connectedCount}</strong>
              </span>
              <span>&middot;</span>
              <span>
                Total:{" "}
                <strong className="text-foreground">{channels.length}</strong>
              </span>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Connected Channel Cards */}
      {channels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => {
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
                    </div>
                    <Badge className={`${status.className} text-xs`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {channel.configured_at && (
                    <p className="text-xs text-muted-foreground mb-4">
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

                  {!channel.configured_at && channel.status === "pending" && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Setup in progress
                    </p>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setDisconnectChannel(channel)}
                  >
                    <Unplug className="mr-2 h-3 w-3" />
                    Disconnect
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connect New Channel (self-configurable) */}
      {availableSelfConfig.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Connect Channel</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {availableSelfConfig.map((type) => {
                const config = CHANNEL_TYPES[type];
                const Icon = config.icon;

                return (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => {
                      setConnectType(type);
                      setCredentials({});
                    }}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm">{config.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channels requiring manual setup (WhatsApp, Signal) */}
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
                const Icon = config.icon;

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.setupNote}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/dashboard/support/new")}
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

      {/* Connect Dialog */}
      <Dialog
        open={!!connectType}
        onOpenChange={(open) => {
          if (!open) {
            setConnectType(null);
            setCredentials({});
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {connectConfig?.label}</DialogTitle>
            <DialogDescription>
              {connectConfig && connectConfig.fields.length > 0
                ? `Enter your ${connectConfig.label} credentials to connect this channel.`
                : `Connect ${connectConfig?.label} to your instance. No credentials needed.`}
            </DialogDescription>
          </DialogHeader>

          {connectConfig && connectConfig.fields.length > 0 && (
            <div className="space-y-4 py-2">
              {connectConfig.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={credentials[field.key] || ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConnectType(null);
                setCredentials({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation */}
      <AlertDialog
        open={!!disconnectChannel}
        onOpenChange={(open) => !open && setDisconnectChannel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect{" "}
              {disconnectChannel
                ? CHANNEL_TYPES[disconnectChannel.channel_type]?.label ||
                  disconnectChannel.channel_type
                : ""}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will disable the channel on your instance. You can reconnect
              it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
