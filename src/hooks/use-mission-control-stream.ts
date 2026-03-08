"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface MCStreamMessage {
  type: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// Map SSE event types to React Query cache keys to invalidate
const EVENT_TO_QUERY_KEY: Record<string, string[]> = {
  task_created: ["mc-tasks"],
  task_updated: ["mc-tasks"],
  task_deleted: ["mc-tasks"],
  agent_status_changed: ["mc-agents"],
  new_event: ["mc-events"],
  session_updated: ["mc-sessions"],
};

export function useMissionControlStream() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const es = new EventSource("/api/mission-control/stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        retryCountRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const msg: MCStreamMessage = JSON.parse(event.data);

          if (msg.type === "ping" || msg.type === "connected") {
            return;
          }

          // Invalidate matching React Query cache keys
          const keys = EVENT_TO_QUERY_KEY[msg.type];
          if (keys) {
            for (const key of keys) {
              queryClient.invalidateQueries({ queryKey: [key] });
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        eventSourceRef.current = null;

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(
          1000 * Math.pow(2, retryCountRef.current),
          30000
        );
        retryCountRef.current++;

        retryTimeoutRef.current = setTimeout(connect, delay);
      };
    } catch {
      setConnected(false);
    }
  }, [queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connect]);

  return { connected };
}
