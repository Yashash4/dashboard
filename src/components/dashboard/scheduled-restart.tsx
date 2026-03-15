"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  CalendarClock,
  Trash2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RestartSchedule {
  id: string;
  restart_type: "openclaw" | "full_vps";
  day_of_week: number;
  time_utc: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const RESTART_TYPES = [
  { value: "openclaw", label: "OpenClaw Only" },
  { value: "full_vps", label: "Full VPS" },
];

export function ScheduledRestart() {
  const queryClient = useQueryClient();
  const [restartType, setRestartType] = useState<string>("openclaw");
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [timeUtc, setTimeUtc] = useState<string>("04:00");
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<{
    schedule: RestartSchedule | null;
  }>({
    queryKey: ["scheduled-restart"],
    queryFn: async () => {
      const res = await fetch("/api/vps/scheduled-restart");
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    },
  });

  const schedule = data?.schedule || null;

  // Sync form state when schedule loads
  useEffect(() => {
    if (schedule) {
      setRestartType(schedule.restart_type);
      setDayOfWeek(schedule.day_of_week);
      setTimeUtc(schedule.time_utc);
      setHasChanges(false);
    }
  }, [schedule]);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      restart_type: string;
      day_of_week: number;
      time_utc: string;
    }) => {
      const res = await fetch("/api/vps/scheduled-restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save schedule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-restart"] });
      setHasChanges(false);
      toast.success("Restart schedule saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vps/scheduled-restart", {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove schedule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-restart"] });
      setRestartType("openclaw");
      setDayOfWeek(0);
      setTimeUtc("04:00");
      setHasChanges(false);
      toast.success("Restart schedule removed");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      restart_type: restartType,
      day_of_week: dayOfWeek,
      time_utc: timeUtc,
    });
  };

  const markChanged = () => setHasChanges(true);

  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-destructive mb-2">
            Failed to load restart schedule
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Scheduled Restart
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 bg-muted/30 animate-pulse" />
            <div className="h-10 bg-muted/30 animate-pulse" />
            <div className="h-10 bg-muted/30 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current schedule indicator */}
            {schedule && !hasChanges && (
              <div className="flex items-center gap-2 p-3 border border-border bg-muted/20">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>
                    {RESTART_TYPES.find((t) => t.value === schedule.restart_type)?.label}
                  </strong>{" "}
                  restart every{" "}
                  <strong>
                    {DAYS.find((d) => d.value === schedule.day_of_week)?.label}
                  </strong>{" "}
                  at <strong>{schedule.time_utc} UTC</strong>
                </span>
              </div>
            )}

            {!schedule && !hasChanges && (
              <div className="py-4 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No scheduled restart</p>
                <p className="text-xs mt-1">
                  Configure a weekly restart to keep your VPS running smoothly
                </p>
              </div>
            )}

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Restart Type
                </label>
                <select
                  value={restartType}
                  onChange={(e) => {
                    setRestartType(e.target.value);
                    markChanged();
                  }}
                  className="flex h-9 w-full border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {RESTART_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Day of Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => {
                    setDayOfWeek(Number(e.target.value));
                    markChanged();
                  }}
                  className="flex h-9 w-full border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Time (UTC)
                </label>
                <Input
                  type="time"
                  value={timeUtc}
                  onChange={(e) => {
                    setTimeUtc(e.target.value);
                    markChanged();
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  24-hour format in UTC. Choose off-peak hours for minimal
                  disruption.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Schedule
              </Button>
              {schedule && (
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Remove Schedule
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
