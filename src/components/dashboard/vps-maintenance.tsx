"use client";

import { useState } from "react";
import {
  Power,
  CalendarClock,
  Plus,
  Trash2,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

interface ScheduledRestart {
  id: string;
  day: string;
  time: string;
  enabled: boolean;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIMES = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

// Mock scheduled restarts
const INITIAL_SCHEDULES: ScheduledRestart[] = [
  { id: "1", day: "Sunday", time: "04:00", enabled: true },
];

export function VPSMaintenance() {
  const queryClient = useQueryClient();
  const [rebootLoading, setRebootLoading] = useState(false);
  const [schedules, setSchedules] = useState<ScheduledRestart[]>(INITIAL_SCHEDULES);
  const [addOpen, setAddOpen] = useState(false);
  const [newDay, setNewDay] = useState("Sunday");
  const [newTime, setNewTime] = useState("04:00");

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

  const handleAddSchedule = () => {
    const id = Math.random().toString(36).slice(2, 8);
    setSchedules((prev) => [...prev, { id, day: newDay, time: newTime, enabled: true }]);
    setAddOpen(false);
    toast.success("Scheduled restart added");
  };

  const handleRemoveSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success("Scheduled restart removed");
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
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
              Scheduled Restarts
            </CardTitle>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Auto-Restart</DialogTitle>
                <DialogDescription>
                  Set a weekly automatic restart to keep your VPS running
                  smoothly.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Day
                  </label>
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Time (UTC)
                  </label>
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
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSchedule}>Add Schedule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No scheduled restarts</p>
              <p className="text-xs mt-1">
                Add a weekly restart to keep things running smoothly
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleSchedule(schedule.id)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        schedule.enabled ? "bg-green-500" : "bg-muted-foreground/30"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{schedule.day}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {schedule.time} UTC
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
                      onClick={() => handleRemoveSchedule(schedule.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
