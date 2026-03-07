"use client";

import { Badge } from "@/components/ui/badge";

const PRIORITY_CONFIG: Record<string, { className: string; label: string }> = {
  critical: {
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    label: "Critical",
  },
  high: {
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    label: "High",
  },
  medium: {
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    label: "Medium",
  },
  low: {
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    label: "Low",
  },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <Badge variant="outline" className={`text-[10px] font-mono ${config.className}`}>
      {config.label}
    </Badge>
  );
}
