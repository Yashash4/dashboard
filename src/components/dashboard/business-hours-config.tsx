"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai",
  "Australia/Sydney", "Pacific/Auckland",
];

interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
}

export function BusinessHoursConfig() {
  const queryClient = useQueryClient();
  const [timezone, setTimezone] = useState("UTC");
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
    monday: { start: "09:00", end: "17:00", enabled: true },
    tuesday: { start: "09:00", end: "17:00", enabled: true },
    wednesday: { start: "09:00", end: "17:00", enabled: true },
    thursday: { start: "09:00", end: "17:00", enabled: true },
    friday: { start: "09:00", end: "17:00", enabled: true },
    saturday: { start: "09:00", end: "17:00", enabled: false },
    sunday: { start: "09:00", end: "17:00", enabled: false },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const res = await fetch("/api/business-hours");
      if (!res.ok) return { businessHours: [] };
      return res.json();
    },
  });

  // Load existing config
  useEffect(() => {
    const hours = data?.businessHours;
    if (hours && hours.length > 0) {
      const global = hours.find((h: any) => !h.channel_type) || hours[0];
      if (global) {
        setTimezone(global.timezone || "UTC");
        const newSchedule: Record<string, DaySchedule> = {};
        for (const day of DAYS) {
          newSchedule[day.key] = {
            start: global[`${day.key}_start`] || "09:00",
            end: global[`${day.key}_end`] || "17:00",
            enabled: global[`${day.key}_enabled`] !== false,
          };
        }
        setSchedule(newSchedule);
      }
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/business-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone, schedule }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
      toast.success("Business hours saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // Determine if currently open (using configured timezone)
  const nowInTz = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = dayNames[nowInTz.getDay()];
  const currentTime = `${String(nowInTz.getHours()).padStart(2, "0")}:${String(nowInTz.getMinutes()).padStart(2, "0")}`;
  const todaySchedule = schedule[currentDay];
  const isOpen = todaySchedule?.enabled && currentTime >= todaySchedule.start && currentTime <= todaySchedule.end;

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Business Hours</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${isOpen ? "text-green-400" : "text-yellow-400"}`}>
              Currently {isOpen ? "OPEN" : "CLOSED"}
            </span>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timezone */}
          <div>
            <label className="text-xs font-medium mb-1 block">Timezone</label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day grid */}
          <div className="space-y-2">
            {DAYS.map((day) => {
              const s = schedule[day.key];
              return (
                <div key={day.key} className="flex items-center gap-3">
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={(v) => updateDay(day.key, "enabled", v)}
                  />
                  <span className="text-sm font-medium w-10">{day.label}</span>
                  <Input
                    type="time"
                    value={s.start}
                    onChange={(e) => updateDay(day.key, "start", e.target.value)}
                    disabled={!s.enabled}
                    className="w-32 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={s.end}
                    onChange={(e) => updateDay(day.key, "end", e.target.value)}
                    disabled={!s.enabled}
                    className="w-32 text-xs"
                  />
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            When business hours are set and an &quot;Away&quot; auto-response is configured,
            messages received outside these hours will get the away message automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
