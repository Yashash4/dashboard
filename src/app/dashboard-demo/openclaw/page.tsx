"use client";

import { Globe, ExternalLink, Key, Copy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DemoOpenClawPage() {
  const dashboardUrl = "https://demo.clawhq.tech";

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div>
          <h1 className="text-lg font-bold">OpenClaw Dashboard</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
            Open in new tab
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      {/* Credentials Banner */}
      <div className="px-6 py-2 border-b border-border bg-muted/50 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Key className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Username:</span>
          <code className="font-mono text-xs bg-background px-1.5 py-0.5 border border-border">admin</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Password:</span>
          <code className="font-mono text-xs bg-background px-1.5 py-0.5 border border-border">{"********"}</code>
        </div>
      </div>

      {/* Embed Placeholder */}
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">OpenClaw Dashboard</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            Your OpenClaw dashboard would be embedded here, providing direct access to your
            AI gateway configuration, model management, and API settings.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              Pro Feature
            </Badge>
            <span className="text-xs text-muted-foreground">
              {dashboardUrl}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
