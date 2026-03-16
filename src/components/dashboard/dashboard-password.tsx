"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Eye, EyeOff, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordData {
  username: string;
  password: string;
  hostname: string | null;
}

export function DashboardPassword() {
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<PasswordData | null>({
    queryKey: ["dashboard-password"],
    queryFn: async () => {
      const res = await fetch("/api/vps/password");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  // Sync current password from query data
  const username = data?.username ?? null;
  const displayPassword = currentPassword ?? data?.password ?? null;
  const hostname = data?.hostname ?? null;

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!newPassword || newPassword.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (newPassword.includes("!")) {
      newErrors.password = "Password cannot contain the ! character";
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirm = "Passwords do not match";
    } else if (!confirmPassword && newPassword) {
      newErrors.confirm = "Please confirm your password";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const res = await fetch("/api/vps/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const resData = await res.json();

      if (!res.ok) {
        toast.error(resData.error || "Failed to update password");
        return;
      }

      setCurrentPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Dashboard password updated");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Dashboard Password
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!username && !displayPassword) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Dashboard Password
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Dashboard credentials not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Dashboard Password
        </CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Login credentials for your OpenClaw dashboard
          {hostname ? ` at ${hostname}` : ""}.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs">Username</Label>
          <Input value={username || ""} readOnly className="font-mono text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Current Password</Label>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              value={displayPassword || ""}
              readOnly
              className="font-mono text-sm pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">New Password</Label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setErrors((prev) => { const { password, ...rest } = prev; return rest; }); }}
              className={`text-sm pr-10 ${errors.password ? "border-destructive" : ""}`}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Confirm Password</Label>
          <Input
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => { const { confirm, ...rest } = prev; return rest; }); }}
            className={`text-sm ${errors.confirm ? "border-destructive" : ""}`}
          />
          {errors.confirm && (
            <p className="text-xs text-destructive">{errors.confirm}</p>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={!newPassword || newPassword.length < 8 || !confirmPassword || saving}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1" />
          )}
          Update Password
        </Button>
      </CardContent>
    </Card>
  );
}
