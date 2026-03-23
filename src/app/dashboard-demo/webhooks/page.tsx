"use client";

import { useState } from "react";
import {
  Webhook,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEMO_WEBHOOKS = [
  {
    id: "1",
    url: "https://api.example.com/webhooks/clawhq",
    description: "Production webhook",
    events: ["message.received", "message.sent", "agent.error"],
    enabled: true,
    last_triggered_at: "2026-03-22T14:30:00Z",
    last_status: "success" as const,
    last_status_code: 200,
    failure_count: 0,
    created_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "2",
    url: "https://hooks.slack.com/services/T0123/B456/abc",
    description: "Slack notifications",
    events: ["agent.error", "agent.deploy"],
    enabled: true,
    last_triggered_at: "2026-03-22T12:15:00Z",
    last_status: "success" as const,
    last_status_code: 200,
    failure_count: 1,
    created_at: "2026-03-05T08:30:00Z",
  },
  {
    id: "3",
    url: "https://analytics.internal.co/ingest",
    description: "Analytics pipeline",
    events: ["message.received", "session.start", "session.end"],
    enabled: false,
    last_triggered_at: "2026-03-20T09:00:00Z",
    last_status: "failed" as const,
    last_status_code: 503,
    failure_count: 5,
    created_at: "2026-03-10T14:00:00Z",
  },
];

const DEMO_DELIVERIES = [
  { id: "d1", event_type: "message.received", status_code: 200, latency_ms: 145, success: true, retry_count: 0, created_at: "2026-03-22T14:30:00Z" },
  { id: "d2", event_type: "message.sent", status_code: 200, latency_ms: 89, success: true, retry_count: 0, created_at: "2026-03-22T14:30:01Z" },
  { id: "d3", event_type: "agent.error", status_code: 200, latency_ms: 234, success: true, retry_count: 0, created_at: "2026-03-22T12:15:00Z" },
  { id: "d4", event_type: "message.received", status_code: 503, latency_ms: 5002, success: false, retry_count: 3, created_at: "2026-03-20T09:00:00Z" },
];

const ALL_EVENTS = [
  "message.received",
  "message.sent",
  "agent.deploy",
  "agent.error",
  "session.start",
  "session.end",
  "model.change",
];

export default function WebhooksDemoPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Webhooks</h1>
      <p className="text-muted-foreground mb-6">
        Get notified when events happen in your instance.
      </p>

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="pt-4 pb-3 px-4">
              <span className="text-xs text-muted-foreground">Total Endpoints</span>
              <p className="text-xl font-bold font-mono">{DEMO_WEBHOOKS.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4 pb-3 px-4">
              <span className="text-xs text-muted-foreground">Active</span>
              <p className="text-xl font-bold font-mono text-green-500">
                {DEMO_WEBHOOKS.filter((w) => w.enabled).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4 pb-3 px-4">
              <span className="text-xs text-muted-foreground">Total Failures</span>
              <p className="text-xl font-bold font-mono text-red-400">
                {DEMO_WEBHOOKS.reduce((s, w) => s + w.failure_count, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add webhook button */}
        <div className="flex justify-end">
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>

        {/* Webhook list */}
        <div className="space-y-3">
          {DEMO_WEBHOOKS.map((wh) => (
            <Card key={wh.id} className="border-border">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Webhook className={`h-4 w-4 ${wh.enabled ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{wh.url}</code>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            wh.enabled
                              ? "bg-green-500/15 text-green-400 border-green-500/30"
                              : "bg-red-500/15 text-red-400 border-red-500/30"
                          }`}
                        >
                          {wh.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      {wh.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{wh.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {wh.last_status === "success" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                      <span>{wh.last_status_code}</span>
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === wh.id ? null : wh.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expanded === wh.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Subscribed events */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {wh.events.map((ev) => (
                    <Badge key={ev} variant="outline" className="text-[10px] font-mono">
                      {ev}
                    </Badge>
                  ))}
                </div>

                {/* Expanded: recent deliveries */}
                {expanded === wh.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Deliveries</p>
                    <div className="space-y-2">
                      {DEMO_DELIVERIES.slice(0, 3).map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {d.success ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-400" />
                            )}
                            <span className="font-mono">{d.event_type}</span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{d.status_code}</span>
                            <span>{d.latency_ms}ms</span>
                            {d.retry_count > 0 && <span className="text-yellow-400">{d.retry_count} retries</span>}
                            <span>{new Date(d.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available events reference */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((ev) => (
                <Badge key={ev} variant="outline" className="text-[10px] font-mono">
                  <Zap className="h-2.5 w-2.5 mr-1" />
                  {ev}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
