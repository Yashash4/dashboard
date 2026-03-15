"use client";

import { Bot, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreviewMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  agentName: string;
  sampleConversation: PreviewMessage[] | null;
}

/**
 * Shows a scripted sample conversation demonstrating how the agent works.
 * Data comes from agents.sample_conversation JSONB column.
 * If no sample conversation exists, shows a placeholder.
 */
export function AgentPreview({ agentName, sampleConversation }: Props) {
  if (!sampleConversation || sampleConversation.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-4">
            No preview available for this agent. Deploy it and try it in Chat.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Sample Conversation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sampleConversation.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary/10 text-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-4">
          This is a sample conversation. Actual responses will vary.
        </p>
      </CardContent>
    </Card>
  );
}
