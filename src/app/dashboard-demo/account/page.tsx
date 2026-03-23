"use client";

import { useState } from "react";
import {
  User,
  Lock,
  Calendar,
  Shield,
  MessageSquare,
  Bot,
  Globe,
  Bell,
  Clock,
  Key,
  Camera,
  LogOut,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const profile = {
  name: "Demo User",
  email: "demo@clawhq.tech",
  role: "user",
  created_at: "2026-01-15T00:00:00Z",
};

const stats = {
  channels_connected: 5,
  agents_deployed: 4,
  open_tickets: 1,
};

const NOTIFICATION_TYPES = [
  { key: "ticket_replies", label: "Ticket Replies", description: "When someone replies to your support ticket", dashboard: true, email: true },
  { key: "vps_alerts", label: "VPS Alerts", description: "VPS status changes and resource warnings", dashboard: true, email: true },
  { key: "agent_errors", label: "Agent Errors", description: "When a deployed agent encounters an error", dashboard: true, email: true },
  { key: "channel_disconnects", label: "Channel Disconnects", description: "When a messaging channel disconnects", dashboard: true, email: true },
  { key: "weekly_summary", label: "Weekly Summary", description: "Weekly overview of your account activity", dashboard: true, email: false },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "US Eastern (ET)" },
  { value: "America/Los_Angeles", label: "US Pacific (PT)" },
  { value: "Europe/London", label: "UK (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Australia/Sydney", label: "Australia Eastern (AEST)" },
];

export default function DemoAccountPage() {
  const [name, setName] = useState(profile.name);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 border border-border flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <button
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                disabled
              >
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge variant="outline" className="mt-1 capitalize">{profile.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Button variant="outline" size="sm" disabled>
                  Save
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} readOnly disabled />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Channels:</span>
              <span className="font-medium">{stats.channels_connected}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Agents:</span>
              <span className="font-medium">{stats.agents_deployed}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Open Tickets:</span>
              <span className="font-medium">{stats.open_tickets}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 items-center text-xs text-muted-foreground">
              <div />
              <div className="text-center">Dashboard</div>
              <div className="text-center">Email</div>
            </div>
            {NOTIFICATION_TYPES.map((pref) => (
              <div key={pref.key} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <div className="flex justify-center">
                  <Switch checked={pref.dashboard} disabled />
                </div>
                <div className="flex justify-center">
                  <Switch checked={pref.email} disabled />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Timezone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Password Last Changed
              </p>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                Never changed
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Account Created
              </p>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <Button variant="outline" size="sm" disabled>
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out All Devices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled className="border-destructive/30 text-destructive hover:bg-destructive/10">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
