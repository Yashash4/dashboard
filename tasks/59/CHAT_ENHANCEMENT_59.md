# Chat Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 6
**Total features:** 15
**Last updated:** 2026-03-15

---

## CONTEXT: Current Chat Page

**Files:**
- `src/app/dashboard/chat/page.tsx` — server component, fetches deployed agents + VPS status
- `src/components/dashboard/agent-chat.tsx` — client component (~400 lines), handles chat UI
- `src/app/api/chat/send/route.ts` — send message to agent via OpenClaw proxy
- `src/app/api/chat/messages/route.ts` — get/delete message history

**Current architecture:**
```
User types message → POST /api/chat/send
  → validates auth + rate limit
  → gets VPS credentials from Supabase
  → searches KB for context (if message qualifies)
  → proxies to OpenClaw on VPS port 18789 via HTTP Basic Auth
  → waits for FULL response (not streaming)
  → strips thinking tags from response
  → saves analytics record
  → returns { response: "full text" }
```

**Current UI layout:**
```
┌────────────────┬──────────────────────────────────────┐
│ Agent List      │ Chat Area                            │
│ (64px wide)     │                                      │
│                 │ Messages...                          │
│ • Support Bot   │                                      │
│ • Research Bot  │                                      │
│                 │ ┌──────────────────────────────┐     │
│                 │ │ Type a message...             │     │
│                 │ └──────────────────────────────┘     │
└────────────────┴──────────────────────────────────────┘
```

**What's bad:**
- No streaming — response dumps all at once after 5-30 seconds of nothing
- Typing indicator is just "Thinking..." text, not animated
- Agent status dot always grey (hardcoded `bg-zinc-500`)
- No conversation history — switching agents or refreshing = lost context
- No file/image support
- No message actions (copy, retry, edit)
- Layout uses `-m-6` hack (fragile)
- Left panel is fixed 64-width, too wide on mobile
- Code blocks render via markdown but no syntax highlighting, no copy button
- No search across conversations
- Chat data stored in Supabase (will move to VPS)

---

## 6.1 STREAMING RESPONSES

### What it is
Show the AI response token by token as it generates, instead of waiting for the full response and dumping it all at once. The #1 change that makes chat feel alive.

### Current state
`chat/send/route.ts` sends the request to OpenClaw, waits for the full response via `await fetch(...)`, then returns the complete text. User sees nothing for 5-30 seconds, then the entire response appears.

### What to build

**Server-side: SSE streaming from OpenClaw**

OpenClaw supports streaming — it's an OpenAI-compatible API. We need to proxy the stream through our API route.

```typescript
// src/app/api/chat/send/route.ts — updated for streaming

export async function POST(request: NextRequest) {
  // ... existing auth, rate limit, KB context setup ...

  const body = await request.json();
  const { message, agent_id, session_id, stream } = body;

  // ... existing message validation, VPS lookup, agent lookup ...

  // Build the request to OpenClaw
  const openclawPayload = {
    messages: [
      ...(kbContext ? [{ role: "system", content: kbSystemPrompt + "\n\n" + kbContext }] : []),
      { role: "user", content: message },
    ],
    model: agentSlug,
    stream: stream !== false, // default to streaming
    max_tokens: 4096,
  };

  // If streaming requested (default):
  if (stream !== false) {
    const upstreamResponse = await fetch(`${dashboardUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${vps.dashboard_username}:${vps.dashboard_password}`).toString("base64")}`,
        "x-openclaw-session-key": session_id || `session_${Date.now()}`,
      },
      body: JSON.stringify(openclawPayload),
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return NextResponse.json(
        { error: "Failed to get response from agent" },
        { status: 502 }
      );
    }

    // Create a TransformStream to process SSE chunks
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Process upstream SSE and forward to client
    (async () => {
      const reader = upstreamResponse.body!.getReader();
      let fullResponse = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                // Stream complete — send done signal
                await writer.write(encoder.encode("data: [DONE]\n\n"));

                // Fire-and-forget: save analytics, dispatch webhooks
                saveAnalytics(user.id, agentSlug, fullResponse, startTime).catch(() => {});
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;

                if (content) {
                  // Strip thinking tags from streaming content
                  const cleaned = stripThinkingTags(content);
                  if (cleaned) {
                    fullResponse += cleaned;
                    await writer.write(
                      encoder.encode(`data: ${JSON.stringify({ content: cleaned })}\n\n`)
                    );
                  }
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      } catch (err) {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // Non-streaming fallback (for API compatibility):
  // ... existing non-streaming logic ...
}

function stripThinkingTags(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, "")
    .replace(/<reflection>[\s\S]*?<\/reflection>/g, "");
}
```

**Client-side: SSE consumer in chat component**

```typescript
// In agent-chat.tsx — updated sendMessage():

async function sendMessage(message: string) {
  if (!message.trim() || sending) return;

  // Add user message to UI immediately
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };
  setMessages(prev => [...prev, userMsg]);
  setInput("");
  setSending(true);

  // Add empty assistant message (will be filled by streaming)
  const assistantMsgId = crypto.randomUUID();
  const assistantMsg: ChatMessage = {
    id: assistantMsgId,
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString(),
    isStreaming: true,
  };
  setMessages(prev => [...prev, assistantMsg]);

  try {
    const response = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        agent_id: selectedAgent?.slug,
        session_id: sessionId,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to send message");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            // Streaming complete
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              // Update the assistant message with accumulated content
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulated }
                    : msg
                )
              );
            }
            if (parsed.error) {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: `Error: ${parsed.error}`, isError: true, isStreaming: false }
                    : msg
                )
              );
            }
          } catch {
            // skip
          }
        }
      }
    }
  } catch (err) {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === assistantMsgId
          ? { ...msg, content: "Failed to get response. Please try again.", isError: true, isStreaming: false }
          : msg
      )
    );
  } finally {
    setSending(false);
  }
}
```

### Files to modify
- `src/app/api/chat/send/route.ts` — add streaming support
- `src/components/dashboard/agent-chat.tsx` — SSE consumer, streaming message state

### Testing
1. Send message → see response appear token by token
2. Long response → smooth streaming for 10+ seconds
3. Error mid-stream → error message appears
4. Cancel (navigate away) → stream closes cleanly
5. VPS timeout → graceful error after 60s

---

## 6.2 CONVERSATION HISTORY SIDEBAR

### What it is
A sidebar listing past conversations. Users can switch between conversations, start new ones, and never lose chat history.

### Current state
No conversation history UI. Messages are in-memory. Switching agents or refreshing = gone. The API stores messages in `chat_messages` table but the UI never loads history beyond the current session.

### What to build

**Conversation list component:**

```typescript
// src/components/dashboard/conversation-sidebar.tsx

interface Conversation {
  id: string;
  agentName: string;
  agentSlug: string;
  title: string;          // auto-generated from first message
  lastMessage: string;    // preview of last message
  lastMessageAt: string;
  messageCount: number;
  pinned: boolean;
  starred: boolean;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onSearch,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: (agentSlug: string) => void;
  onSearch: (query: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Group: pinned first, then by date (Today, Yesterday, This Week, Older)
  const grouped = useMemo(() => {
    let filtered = conversations;
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const pinned = filtered.filter(c => c.pinned);
    const unpinned = filtered.filter(c => !c.pinned);

    const today = unpinned.filter(c => isToday(c.lastMessageAt));
    const yesterday = unpinned.filter(c => isYesterday(c.lastMessageAt));
    const thisWeek = unpinned.filter(c => isThisWeek(c.lastMessageAt) && !isToday(c.lastMessageAt) && !isYesterday(c.lastMessageAt));
    const older = unpinned.filter(c => !isThisWeek(c.lastMessageAt));

    return { pinned, today, yesterday, thisWeek, older };
  }, [conversations, searchQuery]);

  return (
    <div className="w-72 border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium">Conversations</h3>
        <Button variant="ghost" size="icon" onClick={() => onNew("")}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {grouped.pinned.length > 0 && (
          <ConversationGroup label="Pinned" conversations={grouped.pinned} activeId={activeId} onSelect={onSelect} />
        )}
        {grouped.today.length > 0 && (
          <ConversationGroup label="Today" conversations={grouped.today} activeId={activeId} onSelect={onSelect} />
        )}
        {grouped.yesterday.length > 0 && (
          <ConversationGroup label="Yesterday" conversations={grouped.yesterday} activeId={activeId} onSelect={onSelect} />
        )}
        {grouped.thisWeek.length > 0 && (
          <ConversationGroup label="This Week" conversations={grouped.thisWeek} activeId={activeId} onSelect={onSelect} />
        )}
        {grouped.older.length > 0 && (
          <ConversationGroup label="Older" conversations={grouped.older} activeId={activeId} onSelect={onSelect} />
        )}

        {conversations.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet. Select an agent to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationGroup({ label, conversations, activeId, onSelect }: {
  label: string;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border/30 transition-colors ${
            activeId === conv.id ? "bg-muted" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{conv.pinned ? "📌" : ""}</span>
            <p className="text-sm font-medium truncate flex-1">{conv.title}</p>
            {conv.starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate flex-1">{conv.lastMessage}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">{formatTimeAgo(conv.lastMessageAt)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {conv.agentName} · {conv.messageCount} messages
          </p>
        </button>
      ))}
    </div>
  );
}
```

**API for conversation list:**

```typescript
// GET /api/chat/conversations
// Auth required
// Query params: ?agent_id=...&search=...&limit=50&offset=0
// Response: {
//   conversations: [{
//     id, agent_name, agent_slug, title, last_message, last_message_at,
//     message_count, pinned, starred
//   }],
//   total: number
// }

// POST /api/chat/conversations
// Create a new conversation
// Body: { agent_slug: "support-bot" }
// Returns: { conversation: { id, agent_name, ... } }

// PATCH /api/chat/conversations/[id]
// Update: pin, star, title rename
// Body: { pinned?: boolean, starred?: boolean, title?: string }

// DELETE /api/chat/conversations/[id]
// Delete conversation and all its messages
```

**Database changes:**

```sql
-- If chat_conversations doesn't exist or needs enhancement:
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_slug TEXT NOT NULL,
  title TEXT, -- auto-generated from first message, editable
  pinned BOOLEAN DEFAULT false,
  starred BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  last_message_preview TEXT, -- first 100 chars of last message
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
```

**Auto-generate title from first user message:**

```typescript
// When first message is sent in a new conversation:
function generateTitle(firstMessage: string): string {
  // Take first 50 chars, cut at last word boundary
  const truncated = firstMessage.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 20 ? truncated.substring(0, lastSpace) + "..." : truncated;
}
```

**New chat layout (replaces current):**

```
┌───────────────┬───────────────────────────────────────┐
│ Conversations │ Agent: Support Bot  🟢 Healthy         │
│ [+ New]       │ ─────────────────────────────────────── │
│ ┌─ Search ──┐ │                                        │
│ └───────────┘ │ 👤 Can I return my order?              │
│               │                                        │
│ 📌 Pinned     │ 🤖 Of course! Our return policy...     │
│  Refund req   │    [📋 Copy] [🔄 Retry]                │
│               │                                        │
│ Today         │ 👤 What's the deadline?                │
│  Shipping Q   │                                        │
│  Pricing info │ 🤖 ███████▊ (streaming...)             │
│               │                                        │
│ Yesterday     │ ─────────────────────────────────────── │
│  Product help │ ┌──────────────────────────────┐ [📎]  │
│               │ │ Type a message...             │ [➤]  │
│ This Week     │ └──────────────────────────────┘       │
│  API setup    │                                        │
└───────────────┴───────────────────────────────────────┘
```

### Files to create
- `src/components/dashboard/conversation-sidebar.tsx`
- `src/app/api/chat/conversations/route.ts` (GET, POST)
- `src/app/api/chat/conversations/[id]/route.ts` (PATCH, DELETE)

### Files to modify
- `src/components/dashboard/agent-chat.tsx` — integrate sidebar, manage active conversation
- `src/app/dashboard/chat/page.tsx` — new layout structure

---

## 6.3 TYPING INDICATOR

### What it is
Animated dots while the AI generates a response. Professional feel instead of "Thinking..." text.

### What to build

```typescript
// src/components/dashboard/typing-indicator.tsx

export function TypingIndicator({ agentName }: { agentName?: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
          </div>
          {agentName && (
            <span className="text-xs text-muted-foreground ml-2">{agentName} is typing</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

**When streaming is active** (6.1): show typing indicator UNTIL the first token arrives, then switch to streaming text. This means:
1. User sends message → typing indicator appears
2. First token arrives → typing indicator disappears, streaming text starts
3. Stream completes → final message

**When streaming is NOT available** (fallback): show typing indicator for the full wait duration.

### Files to create
- `src/components/dashboard/typing-indicator.tsx`

### Files to modify
- `src/components/dashboard/agent-chat.tsx` — show indicator during generation

---

## 6.4 MESSAGE ACTIONS (Copy, Retry, Edit)

### What it is
Action buttons on each message: copy text, retry generation, edit user message.

### What to build

```typescript
// On ASSISTANT messages (hover to reveal):
// [📋 Copy] [🔄 Regenerate] [👍] [👎]

// On USER messages (hover to reveal):
// [✏️ Edit] [📋 Copy]

// Action implementations:

// Copy: navigator.clipboard.writeText(message.content)
//   toast.success("Copied to clipboard")

// Regenerate: resend the user message before this response
//   Delete the current assistant message
//   Re-call sendMessage() with the original user message

// Edit: replace user message content inline
//   Show textarea with current content
//   On submit: delete all messages after this one
//   Re-send the edited message

// Thumbs up/down: ties into KB feedback (8.10) and CSAT (10.4)
//   If message used KB context: store as KB feedback
//   Otherwise: store as general feedback

interface MessageActionsProps {
  message: ChatMessage;
  onCopy: () => void;
  onRetry: () => void;
  onEdit: (newContent: string) => void;
  onFeedback: (type: "positive" | "negative") => void;
}

export function MessageActions({ message, onCopy, onRetry, onEdit, onFeedback }: MessageActionsProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  if (message.isStreaming) return null; // no actions during streaming

  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1">
      {message.role === "assistant" && (
        <>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopy} title="Copy">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRetry} title="Regenerate">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFeedback("positive")} title="Good response">
            <ThumbsUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFeedback("negative")} title="Bad response">
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </>
      )}
      {message.role === "user" && (
        <>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)} title="Edit">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopy} title="Copy">
            <Copy className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}
```

### Files to create
- `src/components/dashboard/message-actions.tsx`

### Files to modify
- `src/components/dashboard/agent-chat.tsx` — wrap messages in `group` class, add actions

---

## 6.5 CODE BLOCK RENDERING

### What it is
Syntax-highlighted code blocks with language detection, copy button, and optional line numbers.

### What to build

```typescript
// src/components/dashboard/code-block.tsx

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden my-3 bg-[#0d1117] border border-border">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={copyCode}
        >
          {copied ? (
            <><Check className="h-3 w-3 mr-1" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3 mr-1" /> Copy</>
          )}
        </Button>
      </div>

      {/* Code content */}
      <pre className="overflow-x-auto p-4 text-sm">
        <code className={`language-${language || "plaintext"} font-mono text-[13px] leading-relaxed`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
```

**Integration with ReactMarkdown:**

```typescript
// In agent-chat.tsx, update the markdown renderer:
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : undefined;
      const codeString = String(children).replace(/\n$/, "");

      if (!inline && (match || codeString.includes("\n"))) {
        return <CodeBlock code={codeString} language={language} />;
      }

      // Inline code
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    // ... other component overrides for tables, links, etc.
  }}
>
  {message.content}
</ReactMarkdown>
```

**For advanced syntax highlighting:** Install `react-syntax-highlighter` or `shiki`:
```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

Then use in CodeBlock:
```typescript
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Replace <pre><code> with:
<SyntaxHighlighter
  language={language || "text"}
  style={oneDark}
  customStyle={{ margin: 0, padding: "1rem", background: "transparent" }}
>
  {code}
</SyntaxHighlighter>
```

### Files to create
- `src/components/dashboard/code-block.tsx`

### Files to modify
- `src/components/dashboard/agent-chat.tsx` — custom ReactMarkdown code renderer
- Install `react-syntax-highlighter` for highlighting

---

## 6.6 FILE / IMAGE SENDING

### What it is
Users can attach files and images to chat messages. The agent can "see" images and read file contents.

### What to build

**File attachment UI:**

```typescript
// Paperclip button next to send button
// Click → file picker (accept: images, PDF, TXT, CSV, MD)
// Selected file → preview chip above input: "[📎 photo.jpg 2.3MB] ×"
// Send → upload file + message together

// In the input area:
<div className="border-t border-border p-3">
  {/* File preview */}
  {attachedFile && (
    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted rounded-lg">
      <Paperclip className="h-3 w-3 text-muted-foreground" />
      <span className="text-sm truncate flex-1">{attachedFile.name}</span>
      <span className="text-xs text-muted-foreground">{formatFileSize(attachedFile.size)}</span>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachedFile(null)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )}

  {/* Image preview */}
  {attachedFile && attachedFile.type.startsWith("image/") && (
    <div className="mb-2">
      <img
        src={URL.createObjectURL(attachedFile)}
        alt="Attachment preview"
        className="max-h-32 rounded-lg border border-border"
      />
    </div>
  )}

  {/* Input row */}
  <div className="flex gap-2 items-end">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => fileInputRef.current?.click()}
      title="Attach file"
    >
      <Paperclip className="h-4 w-4" />
    </Button>
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      accept="image/png,image/jpeg,image/gif,image/webp,.pdf,.txt,.md,.csv"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            toast.error("File must be under 10MB");
            return;
          }
          setAttachedFile(file);
        }
      }}
    />
    <Textarea ... />
    <Button onClick={handleSend} ...>
      <Send className="h-4 w-4" />
    </Button>
  </div>
</div>
```

**Sending file with message:**

```typescript
async function handleSend() {
  if (!input.trim() && !attachedFile) return;

  let fileContext = "";

  if (attachedFile) {
    if (attachedFile.type.startsWith("image/")) {
      // Convert image to base64
      const base64 = await fileToBase64(attachedFile);
      // Send as multimodal content (if model supports vision)
      // For now: send base64 to API, let it handle multimodal
      fileContext = `[User attached image: ${attachedFile.name}]`;
    } else {
      // Read text file content
      const text = await attachedFile.text();
      fileContext = `[User attached file: ${attachedFile.name}]\n\nFile contents:\n${text.substring(0, 5000)}`;
      // Cap at 5000 chars to avoid overwhelming context
    }
  }

  const fullMessage = fileContext
    ? `${input}\n\n${fileContext}`
    : input;

  await sendMessage(fullMessage);
  setAttachedFile(null);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**For image/vision support:** If the model supports multimodal (vision), send the image as base64 in the OpenAI-compatible format:
```json
{
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "What's in this image?" },
      { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
    ]
  }]
}
```

This requires the chat/send route to handle multimodal content. If the model doesn't support vision, fall back to text description: "[User attached an image that cannot be processed by the current model]".

### Files to modify
- `src/components/dashboard/agent-chat.tsx` — file picker, preview, send logic
- `src/app/api/chat/send/route.ts` — handle multimodal content

---

## 6.7 through 6.15: Remaining Features

Due to file size, the remaining features are documented with implementation specs but less code detail. The patterns established in 6.1-6.6 apply.

---

## 6.7 SEARCH CONVERSATIONS

**What:** Search across all conversations by message content.
**API:** `GET /api/chat/search?q=refund&limit=20` → returns matching conversations with highlighted snippets.
**UI:** Search input in conversation sidebar (already built in 6.2). Results show conversation title + matching message snippet + timestamp. Click → opens that conversation scrolled to the matching message.

---

## 6.8 PIN / STAR CONVERSATIONS

**What:** Pin important conversations to top. Star for quick access.
**Already built in 6.2** — the conversation sidebar groups pinned conversations first. Pin/star via right-click context menu or swipe action on mobile. Stored in `chat_conversations.pinned` and `chat_conversations.starred` columns.

---

## 6.9 EXPORT CONVERSATION

**What:** Export a conversation as text, markdown, or JSON.
**UI:** "Export" button in chat header (or in conversation context menu). Options: Copy to clipboard, Download as .txt, Download as .md (with markdown formatting preserved), Download as .json (structured with roles + timestamps).
**Implementation:**
```typescript
function exportConversation(messages: ChatMessage[], format: "txt" | "md" | "json") {
  let content: string;

  switch (format) {
    case "txt":
      content = messages.map(m => `[${m.role}] ${m.content}`).join("\n\n");
      break;
    case "md":
      content = messages.map(m =>
        m.role === "user" ? `**You:** ${m.content}` : `**Agent:** ${m.content}`
      ).join("\n\n---\n\n");
      break;
    case "json":
      content = JSON.stringify(messages.map(m => ({
        role: m.role, content: m.content, timestamp: m.timestamp
      })), null, 2);
      break;
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `conversation-${Date.now()}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 6.10 RICH MESSAGE FORMATTING

**What:** Agent can send structured content — not just plain text. Buttons, cards, tables render properly.
**Already partially exists:** ReactMarkdown renders tables, lists, bold, italic, links. Code blocks enhanced in 6.5.
**Add:**
- Tables render with styled borders and alternating row colors
- Links open in new tab with external icon
- Images in markdown render inline (if model sends image URLs)
- Block quotes render with left border accent
- Horizontal rules render as styled dividers

```typescript
// Enhanced ReactMarkdown components:
components={{
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full border border-border rounded-lg overflow-hidden text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-medium border-b border-border">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 border-b border-border/50">{children}</td>,
  tr: ({ children, ...props }) => <tr className="even:bg-muted/30">{children}</tr>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
      {children}<ExternalLink className="h-3 w-3" />
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/50 pl-4 my-3 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt} className="rounded-lg max-w-full h-auto my-3 border border-border" />
  ),
}}
```

---

## 6.11 RESPONSIVE MOBILE LAYOUT

**What:** Chat works on mobile. Currently the 64-width left panel + chat area doesn't fit.
**Build:**
- On mobile (< 768px): conversation sidebar becomes a full-screen sheet (slide from left)
- Chat area takes full width
- "Back" button at top → opens sidebar sheet
- Input area stays at bottom (fixed position)
- Agent selector as a dropdown in header instead of sidebar

```typescript
const isMobile = useMediaQuery("(max-width: 768px)");

{isMobile ? (
  // Mobile: full-width chat, sidebar as sheet
  <>
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-80 p-0">
        <ConversationSidebar ... />
      </SheetContent>
    </Sheet>

    <div className="flex flex-col h-[100dvh]">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium truncate">{activeConversation?.title || selectedAgent?.name}</span>
      </header>

      {/* Messages take remaining space */}
      <div className="flex-1 overflow-y-auto">
        {/* messages */}
      </div>

      {/* Input fixed at bottom */}
      <div className="border-t border-border p-3">
        {/* input + send */}
      </div>
    </div>
  </>
) : (
  // Desktop: sidebar + chat side by side
  <div className="flex h-[calc(100vh-3.5rem)]">
    <ConversationSidebar ... />
    <div className="flex-1 flex flex-col">
      {/* messages + input */}
    </div>
  </div>
)}
```

---

## 6.12 AGENT AVATAR + PERSONA

**What:** Show agent's emoji/avatar from identity.md instead of generic Bot icon.
**Build:** When loading agents, fetch their identity config (emoji, theme). Display emoji as avatar in chat bubbles and agent list.
```typescript
// Agent avatar:
<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
  <span className="text-sm">{agent.emoji || "🤖"}</span>
</div>
```
Agent name styled with theme color from identity.md if available.

---

## 6.13 CONVERSATION TITLE (Auto-Generated)

**What:** Instead of "Conversation with Support Bot" → auto-generate from first message: "Refund request for order #12345"
**Already built in 6.2** — `generateTitle()` function truncates first message to ~50 chars. User can also rename via PATCH endpoint.

---

## 6.14 READ RECEIPTS / DELIVERY STATUS

**What:** Show message status: Sending → Sent → Delivered.
**Build:**
```typescript
// On each user message, show status:
// ⏳ Sending (while fetch in progress)
// ✓ Sent (fetch completed, waiting for response)
// ✓✓ Delivered (when agent starts responding / streaming begins)

interface ChatMessage {
  // ... existing fields ...
  deliveryStatus?: "sending" | "sent" | "delivered";
}

// Status indicator under user messages:
{message.role === "user" && (
  <span className="text-[10px] text-muted-foreground">
    {message.deliveryStatus === "sending" && "⏳ Sending..."}
    {message.deliveryStatus === "sent" && "✓ Sent"}
    {message.deliveryStatus === "delivered" && "✓✓"}
  </span>
)}
```

---

## 6.15 SOUND NOTIFICATION

**What:** Optional beep/chime when agent responds (for users who switch tabs while waiting).
**Build:**
```typescript
// Play notification sound when:
// 1. Streaming completes (message.isStreaming goes from true to false)
// 2. Document is NOT focused (user is in another tab)

const notificationSound = useRef<HTMLAudioElement | null>(null);
const [soundEnabled, setSoundEnabled] = useState(() => {
  return localStorage.getItem("chat-sound") !== "false"; // default on
});

useEffect(() => {
  notificationSound.current = new Audio("/sounds/message.mp3");
  notificationSound.current.volume = 0.3;
}, []);

// When a streaming message completes:
useEffect(() => {
  if (!document.hasFocus() && soundEnabled) {
    notificationSound.current?.play().catch(() => {});
  }
}, [messages]); // trigger when messages change

// Toggle in chat header:
<Button variant="ghost" size="icon" onClick={() => {
  setSoundEnabled(!soundEnabled);
  localStorage.setItem("chat-sound", (!soundEnabled).toString());
}} title={soundEnabled ? "Mute notifications" : "Unmute notifications"}>
  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
</Button>
```

**Sound file:** Create a simple notification sound. Use a free, short beep/chime. Save as `/public/sounds/message.mp3`. Keep under 50KB.

---

## BUILD ORDER

```
PHASE 1 — Core Chat Rebuild:
  6.1  Streaming Responses (FIRST — transforms the entire chat experience)
  6.3  Typing Indicator (companion to streaming)
  6.5  Code Block Rendering (enhanced markdown)
  6.10 Rich Message Formatting (enhanced markdown)
  6.11 Responsive Mobile Layout (fix the layout hack)

PHASE 2 — Conversation Management:
  6.2  Conversation History Sidebar (biggest UI change)
  6.13 Conversation Title (auto-generate)
  6.7  Search Conversations (uses sidebar)
  6.8  Pin/Star (uses sidebar)

PHASE 3 — Message Features:
  6.4  Message Actions (copy, retry, edit, feedback)
  6.6  File/Image Sending (attachments)
  6.14 Read Receipts (delivery status)

PHASE 4 — Polish:
  6.9  Export Conversation (download)
  6.12 Agent Avatar + Persona (visual identity)
  6.15 Sound Notification (tab notification)
```

Phase 1 is the critical rebuild — streaming + typing indicator + code blocks + mobile layout. This transforms chat from "basic" to "professional." Phase 2 adds conversation management. Phase 3-4 add polish features.
