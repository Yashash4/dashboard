"use client";

import { useState } from "react";
import {
  Power,
  CalendarClock,
  AlertTriangle,
  Loader2,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIMES = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

interface ScheduleData {
  id: string;
  restart_type: string;
  day_of_week: number;
  time_utc: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function VPSMaintenance() {
  const queryClient = useQueryClient();
  const [rebootLoading, setRebootLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newDay, setNewDay] = useState("0"); // Sunday
  const [newTime, setNewTime] = useState("04:00");

  // MED_40: Fetch real schedule from API instead of mock data
  const { data: schedule, isLoading: scheduleLoading } = useQuery<ScheduleData | null>({
    queryKey: ["vps-schedule"],
    queryFn: async () => {
      const res = await fetch("/api/vps/scheduled-restart");
      if (!res.ok) return null;
      const data = await res.json();
      return data.schedule ?? null;
    },
    staleTime: 30_000,
  });

  const handleReboot = async () => {
    setRebootLoading(true);
    try {
      const res = await fetch("/api/vps/reboot", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to reboot VPS");
        return;
      }

      toast.success("VPS reboot initiated. It will be back online in 1-2 minutes.");
      queryClient.invalidateQueries({ queryKey: ["vps-status"] });
    } catch {
      toast.error("Failed to reboot VPS");
    } finally {
      setRebootLoading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: { restart_type: string; day_of_week: number; time_utc: string }) => {
      const res = await fetch("/api/vps/scheduled-restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save schedule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vps-schedule"] });
      setEditOpen(false);
      toast.success("Restart schedule saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vps/scheduled-restart", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove schedule");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vps-schedule"] });
      toast.success("Restart schedule removed");
    },
    onError: () => {
      toast.error("Failed to remove schedule");
    },
  });

  const handleSaveSchedule = () => {
    saveMutation.mutate({
      restart_type: "openclaw",
      day_of_week: parseInt(newDay),
      time_utc: newTime,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Full VPS Reboot */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Power className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Full VPS Reboot
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Performs a full system reboot. All services will be temporarily
            unavailable for 1-2 minutes. Use this if OpenClaw restart isn&apos;t
            resolving issues.
          </p>
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <span className="text-xs text-yellow-400">
              All channels and services will go offline during reboot
            </span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={rebootLoading}
              >
                {rebootLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Power className="mr-2 h-4 w-4" />
                )}
                Reboot VPS
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reboot VPS?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will perform a full system reboot. All services including
                  OpenClaw, connected channels, and the gateway will be
                  temporarily offline for 1-2 minutes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReboot}>
                  Reboot Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Scheduled Maintenance */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weekly Auto-Restart
            </CardTitle>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (schedule) {
                    setNewDay(String(schedule.day_of_week));
                    setNewTime(schedule.time_utc);
                  }
                }}
              >
                {schedule ? "Edit" : "Set Up"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Auto-Restart</DialogTitle>
                <DialogDescription>
                  Set a weekly automatic restart to keep your VPS running smoothly.
                  OpenClaw will be restarted at the configured time.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Day</label>
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Time (UTC)</label>
                  <Select value={newTime} onValueChange={setNewTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSchedule} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {scheduleLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : !schedule ? (
            <div className="text-center py-6 text-muted-foreground">
              <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No scheduled restart</p>
              <p className="text-xs mt-1">
                Set a weekly restart to keep things running smoothly
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium">{DAYS[schedule.day_of_week]}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {schedule.time_utc} UTC
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    schedule.enabled
                      ? "bg-green-500/15 text-green-400 border-green-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {schedule.enabled ? "Active" : "Paused"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  aria-label="Remove schedule"
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
