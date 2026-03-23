"use client";

import { useEffect, useState } from "react";
import { useMCRealtime } from "@/hooks/use-mc-realtime";
import { Circle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user ID for Supabase Realtime channel (FIX-10)
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  // Supabase Realtime replaces dead SSE EventBus
  const { connectionState } = useMCRealtime(userId);

  const statusConfig = {
    connected: { color: "text-[var(--success)]", label: "Live" },
    reconnecting: { color: "text-[var(--warning)] animate-pulse", label: "Reconnecting..." },
    offline: { color: "text-[var(--text-tertiary)]", label: "Offline" },
  };

  const status = statusConfig[connectionState] || statusConfig.offline;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <Circle className={`h-2 w-2 fill-current ${status.color}`} />
        <span className="text-[10px] text-muted-foreground font-mono">
          {status.label}
        </span>
      </div>
      {children}
    </div>
  );
}
