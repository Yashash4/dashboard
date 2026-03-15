"use client";

import { Download, ClipboardCopy, FileText, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatExportProps {
  agentName: string;
  messages: { role: string; content: string; created_at: string }[];
}

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTimestamp(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toMarkdown(agentName: string, messages: ChatExportProps["messages"]) {
  const lines = [`# Chat with ${agentName}`, `Exported on ${formatTimestamp(new Date().toISOString())}`, ""];
  for (const msg of messages) {
    const label = msg.role === "user" ? "You" : msg.role === "assistant" ? agentName : "System";
    lines.push(`### ${label}`);
    lines.push(`_${formatTimestamp(msg.created_at)}_`, "");
    lines.push(msg.content, "");
    lines.push("---", "");
  }
  return lines.join("\n");
}

function toPlainText(agentName: string, messages: ChatExportProps["messages"]) {
  const lines = [`Chat with ${agentName}`, `Exported on ${formatTimestamp(new Date().toISOString())}`, "", ""];
  for (const msg of messages) {
    const label = msg.role === "user" ? "You" : msg.role === "assistant" ? agentName : "System";
    lines.push(`[${label}] ${formatTimestamp(msg.created_at)}`);
    lines.push(msg.content, "");
  }
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ChatExport({ agentName, messages }: ChatExportProps) {
  const slug = agentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dateStr = formatDate();

  const handleExportMarkdown = () => {
    const content = toMarkdown(agentName, messages);
    downloadFile(content, `chat-${slug}-${dateStr}.md`, "text/markdown");
  };

  const handleExportText = () => {
    const content = toPlainText(agentName, messages);
    downloadFile(content, `chat-${slug}-${dateStr}.txt`, "text/plain");
  };

  const handleCopyClipboard = () => {
    const content = toPlainText(agentName, messages);
    navigator.clipboard.writeText(content);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          disabled={messages.length === 0}
        >
          <Download className="h-3 w-3 mr-1.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportMarkdown}>
          <FileDown className="h-3.5 w-3.5 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportText}>
          <FileText className="h-3.5 w-3.5 mr-2" />
          Export as Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyClipboard}>
          <ClipboardCopy className="h-3.5 w-3.5 mr-2" />
          Copy to Clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
