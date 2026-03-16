"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Server,
  MessageSquare,
  Bot,
  ShoppingBag,
  CreditCard,
  HelpCircle,
  MessageCircle,
  Globe,
  Settings,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: typeof Server;
  external?: boolean;
}

const ALL_ACTIONS: QuickAction[] = [
  { id: "manage-vps", label: "Manage VPS", href: "/vps", icon: Server },
  { id: "support", label: "Raise Ticket", href: "/support/new", icon: HelpCircle },
  { id: "store", label: "Agent Store", href: "/store", icon: ShoppingBag },
  { id: "channels", label: "Connect Channel", href: "/channels", icon: MessageSquare },
  { id: "chat", label: "Open Chat", href: "/chat", icon: MessageCircle },
  { id: "agents", label: "My Agents", href: "/agents", icon: Bot },
  { id: "billing", label: "View Billing", href: "/billing", icon: CreditCard },
  { id: "openclaw", label: "OpenClaw", href: "/openclaw", icon: Globe },
];

const DEFAULT_IDS = ["manage-vps", "support", "store", "channels", "chat"];
const STORAGE_KEY = "clawhq-quick-actions";

export function QuickActions({ openclawUrl }: { openclawUrl?: string | null }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_IDS);
  const [editing, setEditing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedIds(parsed);
        }
      }
    } catch {
      // Use defaults
    }
  }, []);

  const saveSelection = (ids: string[]) => {
    setSelectedIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // localStorage full
    }
  };

  const toggleAction = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((a) => a !== id)
      : [...selectedIds, id];
    if (next.length === 0) return; // Must keep at least 1
    saveSelection(next);
  };

  const visibleActions = ALL_ACTIONS.filter((a) => selectedIds.includes(a.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setEditing(!editing)}
        >
          <Settings className="mr-1.5 h-3 w-3" />
          {editing ? "Done" : "Customize"}
        </Button>
      </div>

      {editing ? (
        <div className="flex flex-wrap gap-2">
          {ALL_ACTIONS.map((action) => {
            const isSelected = selectedIds.includes(action.id);
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-primary" />}
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {openclawUrl && (
            <Button asChild>
              <a href={openclawUrl} target="_blank" rel="noopener noreferrer">
                Open OpenClaw
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.id} variant="outline" asChild>
                <Link href={action.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
