"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface NotificationPrefs {
  ticket_replies: { dashboard: boolean; email: boolean };
  vps_alerts: { dashboard: boolean; email: boolean };
  agent_errors: { dashboard: boolean; email: boolean };
  channel_disconnects: { dashboard: boolean; email: boolean };
  weekly_summary: { dashboard: boolean; email: boolean };
}

const DEFAULT_PREFS: NotificationPrefs = {
  ticket_replies: { dashboard: true, email: true },
  vps_alerts: { dashboard: true, email: true },
  agent_errors: { dashboard: true, email: true },
  channel_disconnects: { dashboard: true, email: true },
  weekly_summary: { dashboard: true, email: true },
};

const NOTIFICATION_TYPES: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "ticket_replies", label: "Ticket Replies", description: "When someone replies to your support ticket" },
  { key: "vps_alerts", label: "VPS Alerts", description: "VPS status changes and resource warnings" },
  { key: "agent_errors", label: "Agent Errors", description: "When a deployed agent encounters an error" },
  { key: "channel_disconnects", label: "Channel Disconnects", description: "When a messaging channel disconnects" },
  { key: "weekly_summary", label: "Weekly Summary", description: "Weekly overview of your account activity" },
];

export function NotificationPreferences() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery<NotificationPrefs>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/account/preferences");
      if (!res.ok) throw new Error("Failed to fetch preferences");
      const json = await res.json();
      return json.preferences || DEFAULT_PREFS;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setPrefs(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newPrefs: NotificationPrefs) => {
      const res = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: newPrefs }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save preferences");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Notification preferences saved");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleToggle = (
    key: keyof NotificationPrefs,
    channel: "dashboard" | "email",
    value: boolean
  ) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [channel]: channel === "dashboard" ? true : value, // dashboard always on
      },
    }));
    setHasChanges(true);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
          </div>
          {hasChanges && (
            <Button
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(prefs)}
            >
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[1fr,80px,80px] gap-4 pb-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Type</span>
              <span className="text-sm font-medium text-muted-foreground text-center">Dashboard</span>
              <span className="text-sm font-medium text-muted-foreground text-center">Email</span>
            </div>

            {NOTIFICATION_TYPES.map(({ key, label, description }) => (
              <div
                key={key}
                className="grid grid-cols-[1fr,80px,80px] gap-4 py-3 border-b border-border last:border-0"
              >
                <div>
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {description}
                  </p>
                </div>
                <div className="flex justify-center items-center">
                  <Switch
                    checked={prefs[key].dashboard}
                    disabled
                    aria-label={`${label} dashboard notification`}
                  />
                </div>
                <div className="flex justify-center items-center">
                  <Switch
                    checked={prefs[key].email}
                    onCheckedChange={(val) => handleToggle(key, "email", val)}
                    aria-label={`${label} email notification`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
