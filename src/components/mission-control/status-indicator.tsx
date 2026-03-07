"use client";

import { Circle } from "lucide-react";
import type { MCAgentStatusType } from "@/types/mission-control";

const STATUS_CONFIG: Record<
  MCAgentStatusType,
  { color: string; label: string; animate?: string }
> = {
  online: { color: "text-green-500 fill-green-500", label: "Online", animate: "animate-pulse" },
  working: { color: "text-blue-500 fill-blue-500", label: "Working", animate: "animate-pulse" },
  idle: { color: "text-zinc-500 fill-zinc-500", label: "Idle" },
  blocked: { color: "text-red-500 fill-red-500", label: "Blocked" },
  sleeping: { color: "text-zinc-600 fill-zinc-600", label: "Sleeping" },
  offline: { color: "text-zinc-700 fill-zinc-700", label: "Offline" },
};

export function StatusIndicator({
  status,
  showLabel = true,
  size = "sm",
}: {
  status: MCAgentStatusType;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const dotSize = size === "md" ? "h-3 w-3" : "h-2 w-2";

  return (
    <span className="inline-flex items-center gap-1.5">
      <Circle className={`${dotSize} ${config.color} ${config.animate || ""}`} />
      {showLabel && (
        <span className="text-xs capitalize text-muted-foreground">
          {config.label}
        </span>
      )}
    </span>
  );
}
