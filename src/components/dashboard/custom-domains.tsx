"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface CustomDomain {
  id: string;
  domain: string;
  status: "pending" | "verified" | "error";
  ssl_status: "pending" | "provisioning" | "active" | "error";
  created_at: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Clock },
  verified: { label: "Verified", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: CheckCircle2 },
  error: { label: "Error", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle },
};

const SSL_CONFIG = {
  pending: { label: "SSL Pending", color: "bg-muted text-muted-foreground border-border" },
  provisioning: { label: "SSL Provisioning", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  active: { label: "SSL Active", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  error: { label: "SSL Error", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export function CustomDomains() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{
    domains: CustomDomain[];
    vps_ip: string | null;
  }>({
    queryKey: ["custom-domains"],
    queryFn: async () => {
      const res = await fetch("/api/domains");
      if (!res.ok) throw new Error("Failed to fetch domains");
      return res.json();
    },
  });

  const domains = data?.domains || [];
  const vpsIp = data?.vps_ip;

  const addMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-domains"] });
      setNewDomain("");
      setShowForm(false);
      toast.success("Domain added. Verify DNS to complete setup.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/domains?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-domains"] });
      toast.success("Domain removed");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleVerify = async (domainId: string) => {
    setVerifyingId(domainId);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain_id: domainId }),
      });
      const result = await res.json();
      if (result.verified) {
        toast.success("DNS verified! SSL certificate is being provisioned.");
      } else {
        toast.error(result.error || "DNS verification failed");
      }
      queryClient.invalidateQueries({ queryKey: ["custom-domains"] });
    } catch {
      toast.error("Verification request failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAdd = () => {
    if (!newDomain.trim()) return;
    addMutation.mutate(newDomain.trim());
  };

  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-destructive mb-2">Failed to load domains</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Custom Domains
            </CardTitle>
            {!showForm && domains.length < 3 && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Add domain form */}
          {showForm && (
            <div className="mb-6 p-4 border border-border bg-muted/30">
              <label className="text-sm font-medium mb-2 block">
                Domain Name
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="app.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                />
                <Button
                  onClick={handleAdd}
                  disabled={!newDomain.trim() || addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setNewDomain("");
                  }}
                >
                  Cancel
                </Button>
              </div>
              {vpsIp && (
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Before verifying, add an A record in your DNS provider
                    pointing your domain to <code className="font-mono font-medium text-foreground">{vpsIp}</code>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Domain list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : domains.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No custom domains configured</p>
              <p className="text-xs mt-1">
                Add up to 3 custom domains to use with your VPS
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((d) => {
                const statusCfg = STATUS_CONFIG[d.status];
                const sslCfg = SSL_CONFIG[d.ssl_status];
                const StatusIcon = statusCfg.icon;

                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 border border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono truncate">{d.domain}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${statusCfg.color}`}
                          >
                            <StatusIcon className="h-2.5 w-2.5 mr-1" />
                            {statusCfg.label}
                          </Badge>
                          {d.status === "verified" && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${sslCfg.color}`}
                            >
                              <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                              {sslCfg.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.status !== "verified" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleVerify(d.id)}
                          disabled={verifyingId === d.id}
                        >
                          {verifyingId === d.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Search className="h-3.5 w-3.5 mr-1" />
                          )}
                          Verify DNS
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label="Remove domain"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Domain?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove <strong>{d.domain}</strong> from
                              your account. Traffic to this domain will no longer
                              be routed to your VPS.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(d.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DNS Instructions panel */}
          {domains.length > 0 && vpsIp && (
            <div className="mt-4 p-3 border border-border bg-muted/20">
              <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                DNS Configuration
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Add an <strong>A record</strong> in your DNS provider for each
                  domain:
                </p>
                <div className="font-mono bg-background p-2 border border-border mt-1">
                  <p>Type: A</p>
                  <p>Name: @ (or subdomain)</p>
                  <p>Value: {vpsIp}</p>
                  <p>TTL: 300 (or Auto)</p>
                </div>
                <p className="mt-2">
                  DNS propagation can take up to 48 hours, but typically
                  completes within minutes.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
