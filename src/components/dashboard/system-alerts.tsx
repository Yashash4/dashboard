"use client";

import Link from "next/link";
import { AlertTriangle, Info, XCircle } from "lucide-react";

interface SystemAlertsProps {
  vpsStatus: string;
  channelsConnected: number;
  agentsDeployed: number;
}

interface Alert {
  type: "error" | "warning" | "info";
  message: string;
  href: string;
  linkText: string;
}

export function SystemAlerts({ vpsStatus, channelsConnected, agentsDeployed }: SystemAlertsProps) {
  const alerts: Alert[] = [];

  if (vpsStatus === "stopped" || vpsStatus === "error") {
    alerts.push({
      type: "error",
      message: vpsStatus === "error" ? "Your VPS encountered an error." : "Your VPS is stopped — your agents are offline.",
      href: "/vps",
      linkText: "Start VPS",
    });
  }

  if (channelsConnected === 0) {
    alerts.push({
      type: "info",
      message: "No channels connected — connect one to start receiving messages.",
      href: "/channels",
      linkText: "Connect Channel",
    });
  }

  if (agentsDeployed === 0) {
    alerts.push({
      type: "info",
      message: "No agents deployed — deploy one to start handling conversations.",
      href: "/agents",
      linkText: "Deploy Agent",
    });
  }

  if (alerts.length === 0) return null;

  const styles = {
    error: { border: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-500", Icon: XCircle },
    warning: { border: "border-yellow-500/30", bg: "bg-yellow-500/10", text: "text-yellow-500", Icon: AlertTriangle },
    info: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", Icon: Info },
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const s = styles[alert.type];
        return (
          <div key={i} className={`flex items-center justify-between gap-3 border ${s.border} ${s.bg} p-3 text-sm`}>
            <div className="flex items-center gap-2 min-w-0">
              <s.Icon className={`h-4 w-4 shrink-0 ${s.text}`} />
              <span className={s.text}>{alert.message}</span>
            </div>
            <Link href={alert.href} className={`shrink-0 text-xs font-medium underline ${s.text}`}>
              {alert.linkText}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
