"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  MessageSquare,
  AlertTriangle,
  Server,
  Unplug,
  CheckCheck,
  Inbox,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  ticket_reply: MessageSquare,
  agent_error: AlertTriangle,
  vps_status: Server,
  channel_disconnect: Unplug,
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const markTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data } = useQuery<{ notifications: Notification[]; unread_count: number }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { notifications: [], unread_count: 0 };
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const markRead = useMutation({
    mutationFn: async (payload: { all?: boolean; ids?: string[] }) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (markTimeoutRef.current) clearTimeout(markTimeoutRef.current);
    };
  }, []);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      // Mark unread as read after 2s delay
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        markTimeoutRef.current = setTimeout(() => {
          markRead.mutate({ ids: unreadIds });
        }, 2000);
      }
    } else if (!open && markTimeoutRef.current) {
      clearTimeout(markTimeoutRef.current);
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0" aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-[var(--error)] text-white rounded-full" aria-hidden="true">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => markRead.mutate({ all: true })}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                return (
                  <div
                    key={n.id}
                    role={n.href ? "button" : undefined}
                    tabIndex={n.href ? 0 : undefined}
                    onClick={() => {
                      if (n.href) router.push(n.href);
                    }}
                    onKeyDown={(e) => {
                      if (n.href && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        router.push(n.href);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${
                      n.href ? "cursor-pointer hover:bg-muted/50" : ""
                    } ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex gap-3">
                      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${!n.read ? "" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
