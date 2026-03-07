"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  Copy,
  ExternalLink,
  Check,
  ChevronsUpDown,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  vps_instances: { id: string; status: string }[] | null;
}

interface StepInfo {
  step: number;
  label: string;
  status: "pending" | "running" | "done" | "error";
  output?: string;
}

const STEP_LABELS = [
  "Create DNS record",
  "Open firewall ports",
  "Test SSH",
  "Prepare system",
  "Install OpenClaw",
  "Write gateway config",
  "Create systemd service",
  "Start gateway",
  "Generate SSL certificate",
  "Install Nginx",
  "Configure Nginx",
  "Verify",
];

export function AdminDeploy({ customers }: { customers: Customer[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [ip, setIp] = useState("");
  const [sshUser, setSshUser] = useState("root");
  const [sshPassword, setSshPassword] = useState("");
  const [sshPort, setSshPort] = useState("22");
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");

  const [provisioning, setProvisioning] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const prevStepsKeyRef = useRef<string>("");
  const stepsRef = useRef<StepInfo[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    dashboardUrl?: string;
    error?: string;
  } | null>(null);

  // Keep stepsRef in sync with state
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Prevent accidental navigation during provisioning
  useEffect(() => {
    if (!provisioning) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [provisioning]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Poll for job status — uses refs to avoid restarting interval on step changes
  useEffect(() => {
    if (!jobId || !provisioning) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/admin/provision?jobId=${jobId}&_t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const job = await res.json();

        if (job.steps) {
          const newSteps = STEP_LABELS.map((label, i) => {
            const serverStep = job.steps.find(
              (s: StepInfo) => s.step === i
            );
            return serverStep || { step: i, label, status: "pending" as const };
          });

          const newKey = JSON.stringify(
            newSteps.map((s: StepInfo) => `${s.step}:${s.status}`)
          );

          if (newKey !== prevStepsKeyRef.current) {
            // Log new changes using ref (doesn't cause re-render loop)
            const oldSteps = stepsRef.current;
            for (const ns of newSteps) {
              const old = oldSteps.find((o) => o.step === ns.step);
              if (!old || old.status !== ns.status) {
                if (ns.status === "running") {
                  addLog(`→ Step ${ns.step}: ${ns.label}`);
                } else if (ns.status === "done") {
                  const detail = ns.output ? ` — ${ns.output}` : "";
                  addLog(`✓ Step ${ns.step}: ${ns.label}${detail}`);
                } else if (ns.status === "error") {
                  const detail = ns.output ? ` — ${ns.output}` : "";
                  addLog(`✗ Step ${ns.step}: ${ns.label}${detail}`);
                }
              }
            }
            prevStepsKeyRef.current = newKey;
            setSteps(newSteps);
          }
        }

        if (job.status === "done" && job.result) {
          setProvisioning(false);

          if (job.result.success) {
            addLog(`✓ COMPLETE — Dashboard: ${job.result.dashboardUrl}`);
            setResult({
              success: true,
              dashboardUrl: job.result.dashboardUrl,
            });
            toast.success("VPS provisioned successfully");
          } else {
            addLog(`✗ FAILED — ${job.result.error}`);
            setResult({ success: false, error: job.result.error });
            toast.error(job.result.error || "Provisioning failed");
          }
        }
      } catch {
        // Network error, keep polling
      }
    };

    // Poll immediately on start, then every 2s
    poll();
    const interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [jobId, provisioning, addLog]);

  // On mount: check if there's an active job (resume after navigation)
  useEffect(() => {
    const checkActiveJob = async () => {
      try {
        const res = await fetch(
          `/api/admin/provision?_t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "running" && data.id) {
          // Restore steps from server
          const restoredSteps = STEP_LABELS.map((label, i) => {
            const serverStep = data.steps?.find(
              (s: StepInfo) => s.step === i
            );
            return serverStep || { step: i, label, status: "pending" as const };
          });

          // Reconstruct logs from completed/running steps
          const restoredLogs: string[] = [
            `[${new Date().toLocaleTimeString()}] → Reconnected to active provisioning job`,
          ];
          for (const s of restoredSteps) {
            if (s.status === "done") {
              const detail = s.output ? ` — ${s.output}` : "";
              restoredLogs.push(
                `[${new Date().toLocaleTimeString()}] ✓ Step ${s.step}: ${s.label}${detail}`
              );
            } else if (s.status === "running") {
              restoredLogs.push(
                `[${new Date().toLocaleTimeString()}] → Step ${s.step}: ${s.label}`
              );
            } else if (s.status === "error") {
              const detail = s.output ? ` — ${s.output}` : "";
              restoredLogs.push(
                `[${new Date().toLocaleTimeString()}] ✗ Step ${s.step}: ${s.label}${detail}`
              );
            }
          }

          setSteps(restoredSteps);
          stepsRef.current = restoredSteps;
          prevStepsKeyRef.current = JSON.stringify(
            restoredSteps.map((s: StepInfo) => `${s.step}:${s.status}`)
          );
          setLogs(restoredLogs);
          setJobId(data.id);
          setProvisioning(true);
          toast.info("Reconnected to active provisioning job");
        }
      } catch {
        // ignore
      }
    };
    checkActiveJob();
  }, []);

  const canSubmit =
    selectedCustomer && ip && sshUser && sshPassword && subdomain && email;

  const handleProvision = async () => {
    if (!canSubmit) return;

    setProvisioning(true);
    setResult(null);
    setLogs([`[${new Date().toLocaleTimeString()}] Starting provisioning...`]);
    prevStepsKeyRef.current = "";
    stepsRef.current = [];
    setSteps(
      STEP_LABELS.map((label, i) => ({
        step: i,
        label,
        status: "pending" as const,
      }))
    );

    try {
      const res = await fetch("/api/admin/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedCustomer,
          ip,
          sshUser,
          sshPassword,
          sshPort: parseInt(sshPort) || 22,
          subdomain: subdomain.toLowerCase().trim(),
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.jobId) {
          // There's already an active job, resume it
          setJobId(data.jobId);
          addLog("→ Reconnected to existing provisioning job");
        } else {
          setResult({ success: false, error: data.error || "Request failed" });
          toast.error(data.error || "Provisioning failed");
          setProvisioning(false);
        }
        return;
      }

      // Got job ID, start polling
      setJobId(data.jobId);
      addLog(`→ Job started: ${data.jobId.slice(0, 8)}...`);
    } catch (err) {
      setResult({ success: false, error: "Network error" });
      toast.error("Failed to connect to API");
      setProvisioning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const selectedCustomerData = customers.find(
    (c) => c.id === selectedCustomer
  );
  const hasVps =
    selectedCustomerData?.vps_instances &&
    selectedCustomerData.vps_instances.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Deploy</h1>
        <p className="text-muted-foreground">
          Provision a fresh VPS with OpenClaw for a customer.
        </p>
      </div>

      {/* Warning banner during provisioning */}
      {provisioning && (
        <div className="flex items-center gap-3 border border-yellow-600/30 bg-yellow-600/5 p-3">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
          <p className="text-sm text-yellow-500">
            Provisioning in progress. You can safely navigate away — progress will resume when you return.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Provision Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedCustomer
                      ? customers.find((c) => c.id === selectedCustomer)?.name ||
                        customers.find((c) => c.id === selectedCustomer)?.email
                      : "Search customer..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or email..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.name || ""} ${c.email}`}
                            onSelect={() => {
                              setSelectedCustomer(c.id);
                              setCustomerOpen(false);
                              setEmail(c.email);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomer === c.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <p className="text-sm">{c.name || "Unnamed"}</p>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {hasVps && (
                <p className="text-xs text-yellow-500">
                  This customer already has a VPS. Provisioning will overwrite
                  it.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>VPS IP Address</Label>
              <Input
                placeholder="72.61.232.87"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SSH User</Label>
                <Input
                  value={sshUser}
                  onChange={(e) => setSshUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>SSH Port</Label>
                <Input
                  value={sshPort}
                  onChange={(e) => setSshPort(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>SSH Password</Label>
              <Input
                type="password"
                placeholder="SSH root password"
                value={sshPassword}
                onChange={(e) => setSshPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Subdomain</Label>
              <div className="flex items-center gap-0">
                <Input
                  placeholder="yashash"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                  className="rounded-r-none border-r-0"
                />
                <div className="h-9 px-3 flex items-center border border-border bg-muted text-sm text-muted-foreground whitespace-nowrap">
                  .clawhq.tech
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                DNS record will be auto-created.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email (for SSL certificate)</Label>
              <Input
                type="email"
                placeholder="admin@clawhq.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleProvision}
              disabled={!canSubmit || provisioning}
            >
              {provisioning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-2 h-4 w-4" />
              )}
              {provisioning ? "Provisioning..." : "Provision VPS"}
            </Button>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Rocket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  Fill in the details and click Provision to start.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    {s.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    {s.status === "running" && (
                      <Loader2 className="h-4 w-4 text-yellow-500 animate-spin shrink-0" />
                    )}
                    {s.status === "error" && (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    {s.status === "pending" && (
                      <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm ${
                          s.status === "pending"
                            ? "text-muted-foreground/50"
                            : s.status === "error"
                            ? "text-red-400"
                            : ""
                        }`}
                      >
                        {s.label}
                      </span>
                      {s.status === "done" && s.output && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {s.output}
                        </p>
                      )}
                      {s.status === "error" && s.output && (
                        <p className="text-xs text-red-400/80 mt-0.5 truncate">
                          {s.output}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Result */}
                {result && result.success && (
                  <div className="mt-4 p-4 border border-green-600/30 bg-green-600/5 space-y-3">
                    <p className="text-sm font-semibold text-green-500">
                      Provisioning complete!
                    </p>

                    {result.dashboardUrl && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Dashboard URL
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 flex-1 truncate">
                            {result.dashboardUrl}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(result.dashboardUrl || "")
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={result.dashboardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Dashboard is accessible directly — no password required.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {result && !result.success && (
                  <div className="mt-4 p-4 border border-red-600/30 bg-red-600/5">
                    <p className="text-sm font-semibold text-red-500">
                      Provisioning failed
                    </p>
                    <p className="text-xs text-red-400/80 mt-1">
                      {result.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs Panel */}
      {logs.length > 0 && (
        <Card className="border-border">
          <CardHeader className="py-3">
            <CardTitle className="text-base font-mono">Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto bg-black/50 p-4 font-mono text-xs leading-relaxed">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.includes("✗")
                      ? "text-red-400"
                      : log.includes("✓")
                      ? "text-green-400"
                      : "text-muted-foreground"
                  }
                >
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
