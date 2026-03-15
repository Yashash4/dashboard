"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, RotateCcw, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Copy, Check as CheckIcon } from "lucide-react";

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group">
      {language && (
        <div className="absolute top-0 left-0 px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-background/80 border-b border-r border-border">
          {language}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground bg-background/80"
      >
        {copied ? <CheckIcon className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </button>
      <pre className="bg-background p-3 overflow-x-auto text-xs font-mono border border-border">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface Agent {
  id: string;
  name: string;
  description: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  isError?: boolean;
}

// Available slash commands
const COMMANDS: Record<string, { description: string }> = {
  "/new": { description: "Start a new conversation session" },
  "/clear": { description: "Clear chat history" },
  "/compact": { description: "Summarize conversation and continue in a compact session" },
  "/help": { description: "Show available commands" },
  "/status": { description: "Check agent and connection status" },
  "/retry": { description: "Retry the last message" },
};

export function AgentChat({ agents }: { agents: Agent[] }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load message history when agent changes
  useEffect(() => {
    if (!selectedAgent) return;
    setLoadingHistory(true);
    setMessages([]);

    fetch(`/api/chat/messages?agent_id=${selectedAgent.id}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
      })
      .catch(() => {
        setMessages([{
          id: "error-history",
          role: "system",
          content: "Failed to load message history. Start a new conversation or try refreshing.",
          created_at: new Date().toISOString(),
        }]);
      })
      .finally(() => setLoadingHistory(false));
  }, [selectedAgent]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  }, [input]);

  const addSystemMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: "system",
        content,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const sendMessage = async (message: string, newSession = false) => {
    setLoading(true);
    const streamMsgId = `stream-${Date.now()}`;

    try {
      // Try streaming first
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          message,
          new_session: newSession,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: data.error || "Failed to get response",
            created_at: new Date().toISOString(),
            isError: true,
          },
        ]);
        return;
      }

      // Check if response is SSE stream
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && res.body) {
        // Streaming mode — show tokens as they arrive
        setMessages((prev) => [
          ...prev,
          { id: streamMsgId, role: "assistant", content: "", created_at: new Date().toISOString() },
        ]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? { ...m, content: m.content + parsed.content }
                      : m
                  )
                );
              }
            } catch {
              // Skip
            }
          }
        }
      } else {
        // Fallback to JSON response
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: data.message_id || `resp-${Date.now()}`,
            role: "assistant",
            content: data.response,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Network error. Please try again.",
          created_at: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  // Handle slash commands
  const handleCommand = async (cmd: string) => {
    const command = cmd.split(" ")[0].toLowerCase();

    switch (command) {
      case "/new":
      case "/clear": {
        setMessages([]);
        await fetch(`/api/chat/messages?agent_id=${selectedAgent.id}`, {
          method: "DELETE",
        }).catch(() => {});
        addSystemMessage(
          command === "/new"
            ? "New session started. Send a message to begin."
            : "Chat history cleared."
        );
        break;
      }

      case "/compact": {
        addSystemMessage("Compacting conversation...");
        // Ask the model to summarize, then start a new session with the summary as context
        const summaryPrompt =
          "Summarize our entire conversation so far in 2-3 sentences. Be concise. Start with 'Summary:'";

        // Send as user message to get summary
        setLoading(true);
        try {
          const res = await fetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agent_id: selectedAgent.id,
              message: summaryPrompt,
            }),
          });
          const data = await res.json();

          if (res.ok && data.response) {
            // Clear old messages on server
            await fetch(`/api/chat/messages?agent_id=${selectedAgent.id}`, {
              method: "DELETE",
            }).catch(() => {});

            // Reset messages and add system message in one update to avoid race conditions
            const compactMsg: Message = {
              id: `sys-compact-${Date.now()}`,
              role: "system",
              content: "Conversation compacted. Starting fresh session with context.",
              created_at: new Date().toISOString(),
            };
            setMessages([compactMsg]);

            // Send the summary as context to the new session
            await sendMessage(
              `[Context from previous conversation: ${data.response}]\n\nLet's continue. What were we working on?`,
              true
            );
          } else {
            addSystemMessage("Failed to compact conversation.");
          }
        } catch {
          addSystemMessage("Failed to compact conversation.");
        } finally {
          setLoading(false);
        }
        break;
      }

      case "/help": {
        const helpText = "**Available Commands**\n\n"
          + Object.entries(COMMANDS)
            .map(([cmd, info]) => `- \`${cmd}\` — ${info.description}`)
            .join("\n");
        addSystemMessage(helpText);
        break;
      }

      case "/status": {
        addSystemMessage("Checking agent status...");
        setLoading(true);
        try {
          const res = await fetch("/api/vps/gateway-health");
          const data = await res.json();
          if (res.ok) {
            const gwStatus = data.active && data.httpOk
              ? "✅ Running"
              : data.active
                ? "⚠️ Running but not responding"
                : "❌ Stopped";
            addSystemMessage(
              `**Agent:** ${selectedAgent.name}  \n**Gateway:** ${gwStatus}  \n**Version:** ${data.version || "unknown"}${data.pid ? `  \n**PID:** ${data.pid}` : ""}`
            );
          } else {
            addSystemMessage("Could not check status. Gateway may be unreachable.");
          }
        } catch {
          addSystemMessage("Failed to check status.");
        } finally {
          setLoading(false);
        }
        break;
      }

      case "/retry": {
        if (lastUserMessage) {
          // Remove the last error/response and retry
          setMessages((prev) => {
            const idx = prev.findLastIndex((m) => m.role === "user");
            if (idx >= 0) return prev.slice(0, idx);
            return prev;
          });
          const tempMsg: Message = {
            id: `temp-${Date.now()}`,
            role: "user",
            content: lastUserMessage,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, tempMsg]);
          await sendMessage(lastUserMessage);
        } else {
          addSystemMessage("No previous message to retry.");
        }
        break;
      }

      default: {
        addSystemMessage(
          `Unknown command: ${command}\nType **/help** to see available commands.`
        );
      }
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !selectedAgent) return;

    setInput("");

    // Check if it's a slash command
    if (trimmed.startsWith("/")) {
      await handleCommand(trimmed);
      return;
    }

    // Regular message
    setLastUserMessage(trimmed);
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    await sendMessage(trimmed);
  };

  const handleNewSession = async () => {
    if (loading) return;
    await handleCommand("/new");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      {/* Left panel: Agent list */}
      <div className="w-64 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Agents</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={cn(
                  "w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2.5",
                  selectedAgent?.id === agent.id
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{agent.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right panel: Chat */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{selectedAgent?.name}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewSession}
            disabled={loading}
            className="text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            New Session
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Send a message to start chatting with {selectedAgent?.name}.
              </p>
              <p className="text-xs text-muted-foreground">
                Type <span className="font-mono text-foreground">/help</span> to see available commands.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col",
                    msg.role === "user"
                      ? "items-end"
                      : msg.role === "system"
                        ? "items-center"
                        : "items-start"
                  )}
                >
                  {msg.role === "system" ? (
                    <div className="bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground max-w-[90%]">
                      <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-background [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-primary [&_code]:font-mono [&_code]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4 [&_li]:my-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2.5 text-sm",
                          msg.role === "user"
                            ? "bg-primary/10 text-foreground whitespace-pre-wrap"
                            : msg.isError
                              ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : "bg-muted text-foreground"
                        )}
                      >
                        {msg.role === "assistant" && msg.isError ? (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{msg.content}</span>
                          </div>
                        ) : msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:text-xs [&_code]:font-mono [&_a]:text-primary [&_a]:underline [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_tr:nth-child(even)]:bg-muted/30 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_hr]:border-border">
                            <ReactMarkdown
                              components={{
                                code: ({ children, className, ...props }) => {
                                  const isBlock = className?.startsWith("language-") || String(children).includes("\n");
                                  if (isBlock) {
                                    return <CodeBlock className={className}>{String(children).replace(/\n$/, "")}</CodeBlock>;
                                  }
                                  return <code className="bg-background px-1 py-0.5 text-primary font-mono text-xs" {...props}>{children}</code>;
                                },
                                a: ({ href, children }) => (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                    {children}
                                  </a>
                                ),
                                pre: ({ children }) => <>{children}</>,
                              }}
                            >{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{selectedAgent?.name} is typing</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="px-6 py-3 border-t border-border">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedAgent?.name}...`}
              rows={1}
              className="flex-1 resize-none bg-muted border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size="sm"
              className="h-9 px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Enter to send, Shift+Enter for new line &middot; Type{" "}
            <span className="font-mono">/help</span> for commands
          </p>
        </div>
      </div>
    </div>
  );
}
