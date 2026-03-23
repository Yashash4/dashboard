"use client";

import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  ArrowUp,
  ArrowDown,
  PlugZap,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ChannelSetupWizard } from "@/components/dashboard/channel-setup-wizard";
import { ChannelStatusHistory } from "@/components/dashboard/channel-status-history";

interface Channel {
  id: string;
  channel_type: string;
  status: string;
  configured_at: string | null;
  health_status?: string | null;
  last_health_check?: string | null;
  error_message?: string | null;
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

const CHANNEL_ORDER_KEY = "clawhq-channel-order";

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

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function loadSavedOrder(): string[] {
  try {
    const saved = localStorage.getItem(CHANNEL_ORDER_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
}

function saveOrder(ids: string[]) {
  try {
    localStorage.setItem(CHANNEL_ORDER_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function sortChannels(channels: Channel[]): Channel[] {
  const savedOrder = loadSavedOrder();
  if (savedOrder.length === 0) return channels;

  const orderMap = new Map(savedOrder.map((id, idx) => [id, idx]));
  return [...channels].sort((a, b) => {
    const aIdx = orderMap.get(a.id) ?? 9999;
    const bIdx = orderMap.get(b.id) ?? 9999;
    if (aIdx !== bIdx) return aIdx - bIdx;
    // Fallback: configured_at desc
    const aTime = a.configured_at ? new Date(a.configured_at).getTime() : 0;
    const bTime = b.configured_at ? new Date(b.configured_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function ChannelManager({
  channels: initialChannels,
}: {
  channels: Channel[];
}) {
  const router = useRouter();
  const [channels, setChannels] = useState(() => sortChannels(initialChannels));
  const [connectType, setConnectType] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnectChannel, setDisconnectChannel] = useState<Channel | null>(
    null
  );
  const [disconnecting, setDisconnecting] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [reconnectingId, setReconnectingId] = useState<string | null>(null);
  const [reconnectFailedId, setReconnectFailedId] = useState<string | null>(null);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});

  // 7.5: Fetch last message timestamps for each channel
  // Stable dependency: only re-run when the set of connected channel IDs changes
  const connectedChannelIds = channels
    .filter((c) => c.status === "connected")
    .map((c) => c.id)
    .sort()
    .join(",");

  const fetchLastMessages = useCallback(async () => {
    const connected = channels.filter((c) => c.status === "connected");
    if (connected.length === 0) return;

    const results: Record<string, string> = {};
    await Promise.all(
      connected.map(async (ch) => {
        try {
          const res = await fetch(`/api/channels/${ch.id}/messages`);
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              results[ch.id] = data.messages[0].created_at;
            }
          }
        } catch {
          // ignore individual failures
        }
      })
    );
    setLastMessages(results);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedChannelIds]);

  useEffect(() => {
    fetchLastMessages();
  }, [fetchLastMessages]);

  // 7.7: Channel ordering
  const moveChannel = (index: number, direction: "up" | "down") => {
    setChannels((prev) => {
      const next = [...prev];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
      saveOrder(next.map((c) => c.id));
      return next;
    });
  };

  // 7.6: Reconnect handler
  const handleReconnect = async (channel: Channel) => {
    setReconnectingId(channel.id);
    setReconnectFailedId(null);
    try {
      // Fetch existing credentials for this channel before reconnecting
      let credentials: Record<string, string> = {};
      try {
        const credRes = await fetch(`/api/channels/${channel.id}/credentials`);
        if (credRes.ok) {
          const credData = await credRes.json();
          credentials = credData.credentials || {};
        }
      } catch {
        // If credentials fetch fails, continue with empty — webchat doesn't need them
      }

      const res = await fetch("/api/channels/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_type: channel.channel_type,
          credentials,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReconnectFailedId(channel.id);
        toast.error(data.error || "Reconnect failed");
        return;
      }

      setChannels((prev) =>
        prev.map((c) =>
          c.id === channel.id
            ? {
                ...c,
                status: "connected",
                configured_at: new Date().toISOString(),
              }
            : c
        )
      );
      toast.success(
        `${CHANNEL_TYPES[channel.channel_type]?.label || channel.channel_type} reconnected`
      );
    } catch {
      setReconnectFailedId(channel.id);
      toast.error("Reconnect failed");
    } finally {
      setReconnectingId(null);
    }
  };

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/channels/health", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Health check failed");
        return;
      }
      // Update local channel state with health results
      const resultMap = new Map(
        (data.results || []).map((r: any) => [r.id, r])
      );
      setChannels((prev) =>
        prev.map((ch) => {
          const result = resultMap.get(ch.id) as any;
          if (result) {
            return {
              ...ch,
              health_status: result.health_status,
              last_health_check: new Date().toISOString(),
              error_message: result.error_message,
            };
          }
          return ch;
        })
      );
      toast.success("Health check complete");
    } catch {
      toast.error("Health check failed");
    } finally {
      setCheckingHealth(false);
    }
  };

  const connectedCount = channels.filter(
    (c) => c.status === "connected"
  ).length;
  const connectedTypes = channels
    .filter((c) => c.status === "connected")
    .map((c) => c.channel_type);
  const availableSelfConfig = SELF_CONFIGURABLE.filter(
    (t) => !connectedTypes.includes(t)
  );
  const availableSetup = REQUIRES_SETUP.filter(
    (t) => !connectedTypes.includes(t)
  );

  const handleConnect = async (creds: Record<string, string>) => {
    if (!connectType) return;
    const config = CHANNEL_TYPES[connectType];

    // Validate all required fields
    if (config.fields.length > 0) {
      const missing = config.fields.filter((f) => !creds[f.key]?.trim());
      if (missing.length > 0) {
        toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
        return;
      }
      // Basic token format validation
      for (const field of config.fields) {
        const val = creds[field.key]?.trim();
        if (val && val.length < 10) {
          toast.error(`${field.label} seems too short. Please check the value.`);
          return;
        }
      }
    }

    setConnecting(true);
    try {
      const res = await fetch("/api/channels/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_type: connectType,
          credentials: config.fields.length > 0 ? creds : {},
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

      // Clear reconnect failed state if it was for this type
      setReconnectFailedId(null);

      toast.success(`${config.label} connected successfully`);
      setConnectType(null);
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
        prev.map((c) =>
          c.id === disconnectChannel.id
            ? { ...c, status: "disconnected" }
            : c
        )
      );
      toast.success(
        `${CHANNEL_TYPES[disconnectChannel.channel_type]?.label || disconnectChannel.channel_type} disconnected. You can reconnect it anytime.`
      );
    } catch {
      toast.error("Failed to disconnect channel");
    } finally {
      setDisconnecting(false);
      setDisconnectChannel(null);
    }
  };

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
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Connected:{" "}
                <strong className="text-foreground">{connectedCount}</strong>
              </span>
              {connectedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleHealthCheck}
                  disabled={checkingHealth}
                >
                  <RefreshCw
                    className={`mr-2 h-3 w-3 ${checkingHealth ? "animate-spin" : ""}`}
                  />
                  {checkingHealth ? "Checking..." : "Check Health"}
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Channel Cards */}
      {channels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel, index) => {
            const config = CHANNEL_TYPES[channel.channel_type];
            const status = STATUS_CONFIG[channel.status] || STATUS_CONFIG.disconnected;
            const Icon = config?.icon || MessageSquare;
            const StatusIcon = status.icon;
            const isDisconnected = channel.status !== "connected";
            const isReconnecting = reconnectingId === channel.id;
            const reconnectFailed = reconnectFailedId === channel.id;
            const lastMsgTime = lastMessages[channel.id];

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
                      {/* 7.7: Primary badge for first channel */}
                      {index === 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* 7.7: Ordering buttons */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 min-h-[44px] min-w-[44px]"
                        disabled={index === 0}
                        onClick={() => moveChannel(index, "up")}
                        aria-label={`Move ${config?.label || channel.channel_type} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 min-h-[44px] min-w-[44px]"
                        disabled={index === channels.length - 1}
                        onClick={() => moveChannel(index, "down")}
                        aria-label={`Move ${config?.label || channel.channel_type} down`}
                      >
                        <ArrowDown className="h-4 w-4" />
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
                      {channel.error_message && (
                        <span className="text-xs text-red-400 ml-1">
                          — {channel.error_message}
                        </span>
                      )}
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

                  {/* 7.5: Last message preview */}
                  {lastMsgTime && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Last message: {getRelativeTime(lastMsgTime)}
                    </p>
                  )}

                  {!channel.configured_at && channel.status === "pending" && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Setup in progress
                    </p>
                  )}

                  {/* 7.1: Status History (expandable) */}
                  <ChannelStatusHistory
                    channelType={channel.channel_type}
                    status={channel.status}
                    configuredAt={channel.configured_at}
                    healthStatus={channel.health_status}
                    lastHealthCheck={channel.last_health_check}
                    errorMessage={channel.error_message}
                  />

                  {/* 7.6: Reconnect button for disconnected channels */}
                  {isDisconnected && !reconnectFailed && (
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => handleReconnect(channel)}
                      disabled={isReconnecting}
                    >
                      {isReconnecting ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <PlugZap className="mr-2 h-3 w-3" />
                      )}
                      {isReconnecting ? "Reconnecting..." : "Reconnect"}
                    </Button>
                  )}

                  {/* 7.6: Update Credentials button when reconnect fails */}
                  {isDisconnected && reconnectFailed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3 border-yellow-600/50 text-yellow-500 hover:text-yellow-400"
                      onClick={() => setConnectType(channel.channel_type)}
                    >
                      <KeyRound className="mr-2 h-3 w-3" />
                      Update Credentials
                    </Button>
                  )}

                  {/* Disconnect button for connected channels */}
                  {!isDisconnected && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => setDisconnectChannel(channel)}
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
                      onClick={() => router.push("/support/new")}
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

      {/* Connect Wizard */}
      {connectType && CHANNEL_TYPES[connectType] && (
        <ChannelSetupWizard
          channelType={connectType}
          channelLabel={CHANNEL_TYPES[connectType].label}
          fields={CHANNEL_TYPES[connectType].fields}
          open={!!connectType}
          onOpenChange={(open) => {
            if (!open) setConnectType(null);
          }}
          onConnect={handleConnect}
          connecting={connecting}
        />
      )}

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
