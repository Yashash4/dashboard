"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";

const EVENT_TO_QUERY_KEY: Record<string, string[]> = {
  task_created: ["mc-tasks"],
  task_updated: ["mc-tasks"],
  task_deleted: ["mc-tasks"],
  agent_status_changed: ["mc-agents"],
  new_event: ["mc-events"],
  session_created: ["mc-sessions"],
  session_updated: ["mc-sessions"],
};

type ConnectionState = "connected" | "reconnecting" | "offline";

/**
 * Real-time hook using Supabase Realtime channels.
 * Falls back to smart polling when disconnected.
 * Replaces the old EventSource-based SSE hook.
 */
export function useMCRealtime(userId: string | null) {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>("reconnecting");
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const visibleRef = useRef(true);

  const invalidateForEvent = useCallback(
    (eventType: string) => {
      const keys = EVENT_TO_QUERY_KEY[eventType];
      if (keys) {
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    },
    [queryClient]
  );

  // Smart polling fallback
  const startPolling = useCallback(
    (intervalMs: number) => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        if (!visibleRef.current) return;
        queryClient.invalidateQueries({ queryKey: ["mc-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["mc-agents"] });
        queryClient.invalidateQueries({ queryKey: ["mc-events"] });
        queryClient.invalidateQueries({ queryKey: ["mc-sessions"] });
      }, intervalMs);
    },
    [queryClient]
  );

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase.channel(`mc:${userId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "*" }, (payload) => {
        const eventType = payload.payload?.type || payload.event;
        if (eventType) invalidateForEvent(eventType);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionState("connected");
          // Slow polling when connected (sync safety net)
          startPolling(30000);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnectionState("reconnecting");
          // Fast polling when disconnected
          startPolling(5000);
        }
      });

    // Visibility change handler
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current) {
        // Immediate refresh on tab focus
        queryClient.invalidateQueries({ queryKey: ["mc-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["mc-agents"] });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId, invalidateForEvent, startPolling, stopPolling, queryClient]);

  return { connectionState };
}
