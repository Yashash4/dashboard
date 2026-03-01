export const vpsStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  running: {
    label: "Running",
    className: "bg-green-600 text-white border-green-600",
  },
  stopped: {
    label: "Stopped",
    className: "bg-secondary text-secondary-foreground border-secondary",
  },
  restarting: {
    label: "Restarting",
    className: "bg-yellow-600 text-white border-yellow-600",
  },
  provisioning: {
    label: "Provisioning",
    className: "bg-yellow-600 text-white border-yellow-600",
  },
  error: {
    label: "Error",
    className: "bg-destructive text-destructive-foreground border-destructive",
  },
};

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
