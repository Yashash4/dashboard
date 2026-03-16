"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, MessageSquare, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationSummary {
  id: string;
  agent_name: string;
  last_message: string | null;
  message_count: number;
  created_at: string;
  last_message_at: string;
}

interface ChatHistoryPanelProps {
  agentId: string;
  onSelectConversation: (conversationId: string) => void;
  currentConversationId?: string | null;
}

export function ChatHistoryPanel({
  agentId,
  onSelectConversation,
  currentConversationId,
}: ChatHistoryPanelProps) {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<{
    conversations: ConversationSummary[];
    total: number;
  }>({
    queryKey: ["chat-history", agentId, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/chat/conversations?agent_id=${agentId}&limit=20&offset=${page * 20}`
      );
      if (!res.ok) throw new Error("Failed to load history");
      return res.json();
    },
    staleTime: 30_000,
  });

  const conversations = data?.conversations ?? [];
  const total = data?.total ?? 0;
  const hasMore = (page + 1) * 20 < total;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Conversation History</span>
        </div>
        {total > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {total} conversation{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 px-3">
            <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => onSelectConversation(convo.id)}
                className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors text-xs ${
                  currentConversationId === convo.id ? "bg-muted/50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground truncate">
                    {convo.last_message
                      ? convo.last_message.slice(0, 40) + (convo.last_message.length > 40 ? "..." : "")
                      : "Empty conversation"}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                  <span>{convo.message_count} msgs</span>
                  <span>&middot;</span>
                  <span>
                    {new Date(convo.last_message_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {(hasMore || page > 0) && (
          <div className="flex items-center justify-center gap-2 p-2">
            {page > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPage(page - 1)}>
                Previous
              </Button>
            )}
            {hasMore && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPage(page + 1)}>
                Next
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
