"use client";

import { Check, CheckCheck, Clock } from "lucide-react";

type Status = "sending" | "sent" | "delivered";

interface Props {
  status: Status;
}

/**
 * Read receipt indicator shown below user messages.
 * - sending: clock icon (⏳)
 * - sent: single check (✓)
 * - delivered: double check (✓✓) — shown when agent starts responding
 */
export function ChatReadReceipt({ status }: Props) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
      {status === "sending" && (
        <>
          <Clock className="h-2.5 w-2.5" />
          <span>Sending</span>
        </>
      )}
      {status === "sent" && (
        <>
          <Check className="h-2.5 w-2.5" />
          <span>Sent</span>
        </>
      )}
      {status === "delivered" && (
        <>
          <CheckCheck className="h-2.5 w-2.5 text-primary" />
          <span>Delivered</span>
        </>
      )}
    </span>
  );
}

/**
 * Determine message status based on position in the messages array.
 * A user message is "delivered" if there's an assistant response after it.
 * The last user message is "sent" if no response yet, or "sending" if currently loading.
 */
export function getMessageStatus(
  messageId: string,
  role: string,
  messages: { id: string; role: string }[],
  isLoading: boolean
): Status | null {
  if (role !== "user") return null;

  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) return null;

  // Check if there's an assistant message after this user message
  const hasResponse = messages.slice(idx + 1).some((m) => m.role === "assistant");
  if (hasResponse) return "delivered";

  // This is the last user message
  const isLast = !messages.slice(idx + 1).some((m) => m.role === "user");
  if (isLast && isLoading) return "sending";

  return "sent";
}
