"use client";

import { useState } from "react";
import { Bot, Send, RotateCcw, History, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const DEMO_AGENTS = [
  { id: "a-1", name: "Support Agent", description: "Handles customer support queries." },
  { id: "a-2", name: "Research Agent", description: "Gathers and synthesizes information." },
  { id: "a-3", name: "Sales Agent", description: "Engages leads and qualifies prospects." },
];

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

const DEMO_CONVERSATIONS: Record<string, Message[]> = {
  "a-1": [
    {
      id: "m-s1",
      role: "user",
      content: "How do I configure my WhatsApp channel?",
      created_at: "2026-03-22T10:00:00Z",
    },
    {
      id: "m-s2",
      role: "assistant",
      content: "To configure your WhatsApp channel, follow these steps:\n\n1. Go to **Channels** in your dashboard\n2. Click the **Connect** button next to WhatsApp\n3. Enter your WhatsApp Business API credentials\n4. Set up your webhook URL\n5. Test the connection\n\nWould you like me to walk you through any of these steps in detail?",
      created_at: "2026-03-22T10:00:05Z",
    },
    {
      id: "m-s3",
      role: "user",
      content: "Yes, can you explain step 3?",
      created_at: "2026-03-22T10:01:00Z",
    },
    {
      id: "m-s4",
      role: "assistant",
      content: "Sure! For step 3, you'll need your WhatsApp Business API credentials from Meta:\n\n- **Phone Number ID**: Found in your Meta Business Manager under WhatsApp > Phone Numbers\n- **Access Token**: Generate a permanent token from System Users in Business Settings\n- **Business Account ID**: Listed in your WhatsApp Business Account settings\n\nEnter these into the corresponding fields in the channel setup wizard. Make sure your token has the required permissions:\n- `whatsapp_business_messaging`\n- `whatsapp_business_management`\n\nNeed help finding any of these?",
      created_at: "2026-03-22T10:01:08Z",
    },
  ],
  "a-2": [
    {
      id: "m-r1",
      role: "user",
      content: "Can you research the latest trends in AI agent frameworks for 2026?",
      created_at: "2026-03-22T09:00:00Z",
    },
    {
      id: "m-r2",
      role: "assistant",
      content: "Here's a summary of the key AI agent framework trends for 2026:\n\n**1. Multi-Agent Orchestration**\nFrameworks are moving beyond single-agent setups. Tools like CrewAI and AutoGen now support complex multi-agent workflows where specialized agents collaborate on tasks.\n\n**2. Tool-Use Standardization**\nThe MCP (Model Context Protocol) has become the de facto standard for connecting agents to external tools and data sources.\n\n**3. Memory & Context Management**\nLong-term memory systems are now built into most frameworks, allowing agents to maintain context across sessions without hitting token limits.\n\n**4. Deployment & Observability**\nProduction-ready deployment with built-in tracing, monitoring, and cost tracking is now table stakes.\n\n**5. Domain-Specific Agents**\nPre-built agent templates for specific industries (legal, healthcare, finance) are rapidly growing.\n\nWould you like me to dive deeper into any of these areas?",
      created_at: "2026-03-22T09:00:12Z",
    },
    {
      id: "m-r3",
      role: "user",
      content: "Tell me more about multi-agent orchestration patterns.",
      created_at: "2026-03-22T09:02:00Z",
    },
    {
      id: "m-r4",
      role: "assistant",
      content: "Multi-agent orchestration has evolved into several distinct patterns:\n\n**Hierarchical Pattern**\nA supervisor agent delegates tasks to worker agents. The supervisor plans, assigns, and aggregates results. Best for complex workflows with clear subtask decomposition.\n\n**Collaborative Pattern**\nAgents communicate peer-to-peer, sharing context and building on each other's work. Common in creative tasks like brainstorming or code review.\n\n**Pipeline Pattern**\nAgents process data sequentially, each adding their specialization. For example: Research Agent -> Analysis Agent -> Writing Agent.\n\n**Competitive Pattern**\nMultiple agents independently solve the same problem, and the best result is selected. Used for critical decisions where accuracy matters.\n\nThe key challenge remains **state management** -- ensuring agents have the right context without overwhelming their token windows. Most frameworks now use a shared memory store with selective retrieval.",
      created_at: "2026-03-22T09:02:15Z",
    },
  ],
  "a-3": [
    {
      id: "m-sa1",
      role: "user",
      content: "I have a new lead from the website form. Name: Sarah Chen, Company: TechFlow Inc, interested in the Enterprise plan.",
      created_at: "2026-03-22T11:00:00Z",
    },
    {
      id: "m-sa2",
      role: "assistant",
      content: "I've noted the new lead details:\n\n**Lead Profile:**\n- **Name:** Sarah Chen\n- **Company:** TechFlow Inc\n- **Interest:** Enterprise plan\n- **Source:** Website form\n\nBased on the Enterprise plan inquiry, this is a high-value lead. Here's my recommended qualification approach:\n\n1. **Company Research:** TechFlow Inc appears to be a mid-size tech company (~200 employees). They likely need multi-channel support.\n\n2. **Suggested Next Steps:**\n   - Send personalized intro email highlighting Enterprise features (dedicated VPS, priority support, custom agent configs)\n   - Schedule a 30-min demo call\n   - Prepare ROI analysis based on their likely support volume\n\n3. **Key Talking Points:**\n   - 99.9% uptime SLA\n   - Unlimited agents and channels\n   - Dedicated account manager\n\nShall I draft the initial outreach email?",
      created_at: "2026-03-22T11:00:08Z",
    },
    {
      id: "m-sa3",
      role: "user",
      content: "Yes, draft the email please.",
      created_at: "2026-03-22T11:01:00Z",
    },
    {
      id: "m-sa4",
      role: "assistant",
      content: "Here's the draft outreach email:\n\n---\n\n**Subject:** Sarah, let's explore how ClawHQ can power TechFlow's customer experience\n\nHi Sarah,\n\nThank you for your interest in ClawHQ's Enterprise plan! I noticed TechFlow Inc is looking to scale its customer communication -- I'd love to show you how our platform can help.\n\nWith ClawHQ Enterprise, you'll get:\n\n- **Dedicated infrastructure** with 99.9% uptime SLA\n- **Unlimited AI agents** customized for your workflows\n- **All channels** (WhatsApp, Slack, Teams, Discord, and more) connected simultaneously\n- **Priority support** with a dedicated account manager\n\nWould you be available for a quick 30-minute demo this week? I'd love to walk you through the platform and discuss how it fits TechFlow's needs.\n\nBest regards,\nClawHQ Sales Team\n\n---\n\nWant me to adjust the tone, add specific details, or schedule the follow-up?",
      created_at: "2026-03-22T11:01:12Z",
    },
  ],
};

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function DemoChatPage() {
  const [selectedAgent, setSelectedAgent] = useState(DEMO_AGENTS[0]);
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messages = DEMO_CONVERSATIONS[selectedAgent.id] || [];

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex h-full relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left panel: Agent list */}
        <div className={cn(
          "w-64 border-r border-border flex flex-col bg-background z-40 transition-transform duration-200",
          "fixed inset-y-0 left-0 md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Agents</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {DEMO_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setSidebarOpen(false);
                  }}
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
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="px-6 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open agent list"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
              <Bot className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">{selectedAgent?.name}</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-xs text-muted-foreground"
                aria-label="Toggle conversation history"
              >
                <History className="h-3 w-3 mr-1.5" />
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-xs text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                New Session
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6 py-4">
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
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-primary/10 text-foreground whitespace-pre-wrap"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-6 py-3 border-t border-border">
            <div className="flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Message ${selectedAgent?.name}...`}
                rows={1}
                className="flex-1 resize-none bg-muted border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                disabled
              />
              <Button
                disabled
                size="sm"
                className="h-9 px-3"
                aria-label="Send message"
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
    </div>
  );
}
