"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "US Eastern (ET)" },
  { value: "America/Chicago", label: "US Central (CT)" },
  { value: "America/Denver", label: "US Mountain (MT)" },
  { value: "America/Los_Angeles", label: "US Pacific (PT)" },
  { value: "America/Anchorage", label: "US Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "US Hawaii (HST)" },
  { value: "America/Toronto", label: "Canada Eastern" },
  { value: "America/Sao_Paulo", label: "Brazil (BRT)" },
  { value: "Europe/London", label: "UK (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Europe/Berlin", label: "Germany (CET)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Seoul", label: "Korea (KST)" },
  { value: "Australia/Sydney", label: "Australia Eastern (AEST)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
];

function detectBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = TIMEZONES.find((t) => t.value === tz);
    return match ? tz : "UTC";
  } catch {
    return "UTC";
  }
}

export function TimezoneSetting() {
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  const [savedTz, setSavedTz] = useState("UTC");

  useEffect(() => {
    const detected = detectBrowserTimezone();
    setTimezone(detected);
    setSavedTz(detected);
  }, []);

  const currentTime = useMemo(() => {
    try {
      return new Date().toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "--:--:--";
    }
  }, [timezone]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save timezone");
        return;
      }
      toast.success("Timezone saved");
      setSavedTz(timezone);
    } catch {
      toast.error("Failed to save timezone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Timezone</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Your Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="max-w-sm" id="timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          Current time: <span className="font-medium text-foreground">{currentTime}</span>
        </p>

        {timezone !== savedTz && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
