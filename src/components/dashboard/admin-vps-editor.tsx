"use client";

import { useState } from "react";
import { Server, Loader2, Save, Pencil, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vpsStatusConfig } from "@/lib/vps-status";

interface VpsInstance {
  id: string;
  ip_address: string | null;
  hostname: string | null;
  ssh_user: string | null;
  ssh_password: string | null;
  ssh_port: number | null;
  hostinger_vm_id: number | null;
  cpu_cores: number | null;
  ram_gb: number | null;
  storage_gb: number | null;
  bandwidth_tb: number | null;
  status: string;
}

interface Props {
  userId: string;
  vps: VpsInstance | null;
}

export function AdminVpsEditor({ userId, vps }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [ipAddress, setIpAddress] = useState(vps?.ip_address || "");
  const [hostname, setHostname] = useState(vps?.hostname || "");
  const [sshUser, setSshUser] = useState(vps?.ssh_user || "");
  const [sshPassword, setSshPassword] = useState(vps?.ssh_password || "");
  const [sshPort, setSshPort] = useState(vps?.ssh_port?.toString() || "22");
  const [vmId, setVmId] = useState(vps?.hostinger_vm_id?.toString() || "");
  const [cpuCores, setCpuCores] = useState(vps?.cpu_cores?.toString() || "");
  const [ramGb, setRamGb] = useState(vps?.ram_gb?.toString() || "");
  const [storageGb, setStorageGb] = useState(vps?.storage_gb?.toString() || "");
  const [bandwidthTb, setBandwidthTb] = useState(
    vps?.bandwidth_tb?.toString() || ""
  );

  const handleSave = async () => {
    if (!ipAddress.trim()) {
      toast.error("IP address is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/vps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip_address: ipAddress.trim(),
          hostname: hostname.trim() || null,
          ssh_user: sshUser.trim() || null,
          ssh_password: sshPassword || null,
          ssh_port: sshPort ? parseInt(sshPort) : 22,
          hostinger_vm_id: vmId ? parseInt(vmId) : null,
          cpu_cores: cpuCores ? parseInt(cpuCores) : null,
          ram_gb: ramGb ? parseInt(ramGb) : null,
          storage_gb: storageGb ? parseInt(storageGb) : null,
          bandwidth_tb: bandwidthTb ? parseInt(bandwidthTb) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update VPS");
        return;
      }

      toast.success("VPS details updated");
      setEditing(false);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIpAddress(vps?.ip_address || "");
    setHostname(vps?.hostname || "");
    setSshUser(vps?.ssh_user || "");
    setSshPassword(vps?.ssh_password || "");
    setSshPort(vps?.ssh_port?.toString() || "22");
    setVmId(vps?.hostinger_vm_id?.toString() || "");
    setCpuCores(vps?.cpu_cores?.toString() || "");
    setRamGb(vps?.ram_gb?.toString() || "");
    setStorageGb(vps?.storage_gb?.toString() || "");
    setBandwidthTb(vps?.bandwidth_tb?.toString() || "");
    setEditing(false);
  };

  const vpsConfig = vpsStatusConfig[vps?.status || "none"] || {
    label: "No VPS",
    className: "border-muted-foreground/30 text-muted-foreground",
  };

  // Read-only view
  if (!editing) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            VPS Instance
          </CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {vps ? (
            <>
              <Badge className={`${vpsConfig.className} text-xs`}>
                {vpsConfig.label}
              </Badge>
              {vps.ip_address && (
                <p className="text-sm font-mono">{vps.ip_address}</p>
              )}
              {vps.hostname && (
                <p className="text-xs text-muted-foreground">{vps.hostname}</p>
              )}
              {vps.cpu_cores && (
                <p className="text-xs text-muted-foreground">
                  {vps.cpu_cores} vCPU &middot; {vps.ram_gb}GB RAM &middot;{" "}
                  {vps.storage_gb}GB
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No VPS provisioned</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit view
  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-primary">
          Edit VPS Instance
        </CardTitle>
        <Server className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">IP Address</Label>
            <Input
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="1.2.3.4"
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hostname</Label>
            <Input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="user.clawhq.tech"
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">SSH User</Label>
            <Input
              value={sshUser}
              onChange={(e) => setSshUser(e.target.value)}
              placeholder="root"
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">SSH Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={sshPassword}
                onChange={(e) => setSshPassword(e.target.value)}
                className="h-8 text-sm font-mono pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">SSH Port</Label>
            <Input
              type="number"
              value={sshPort}
              onChange={(e) => setSshPort(e.target.value)}
              placeholder="22"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">VM ID</Label>
          <Input
            type="number"
            value={vmId}
            onChange={(e) => setVmId(e.target.value)}
            placeholder="Hostinger VM ID"
            className="h-8 text-sm font-mono"
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">CPU Cores</Label>
            <Input
              type="number"
              value={cpuCores}
              onChange={(e) => setCpuCores(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">RAM (GB)</Label>
            <Input
              type="number"
              value={ramGb}
              onChange={(e) => setRamGb(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Storage (GB)</Label>
            <Input
              type="number"
              value={storageGb}
              onChange={(e) => setStorageGb(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">BW (TB)</Label>
            <Input
              type="number"
              value={bandwidthTb}
              onChange={(e) => setBandwidthTb(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
