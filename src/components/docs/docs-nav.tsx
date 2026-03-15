"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, Search } from "lucide-react";

const DOCS_NAV = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick Start Guide", href: "/docs/getting-started" },
      { title: "Plans & Pricing", href: "/docs/plans" },
    ],
  },
  {
    title: "Dashboard",
    items: [
      { title: "Overview", href: "/docs/dashboard" },
      { title: "VPS Management", href: "/docs/vps" },
      { title: "AI Models", href: "/docs/models" },
      { title: "Agents", href: "/docs/agents" },
      { title: "Agent Store", href: "/docs/store" },
      { title: "Chat", href: "/docs/chat" },
      { title: "Channels", href: "/docs/channels" },
      { title: "Support", href: "/docs/support" },
      { title: "Billing", href: "/docs/billing" },
      { title: "Account Settings", href: "/docs/account" },
    ],
  },
  {
    title: "Pro Features",
    items: [
      { title: "Overview", href: "/docs/pro" },
      { title: "Agent Builder", href: "/docs/pro/agent-builder" },
      { title: "Model Playground", href: "/docs/pro/model-playground" },
      { title: "Knowledge Base", href: "/docs/pro/knowledge-base" },
      { title: "Webhooks", href: "/docs/pro/webhooks" },
      { title: "API Access", href: "/docs/pro/api" },
      { title: "Logs Explorer", href: "/docs/pro/logs" },
      { title: "Analytics", href: "/docs/pro/analytics" },
      { title: "Audit Log", href: "/docs/pro/audit-log" },
    ],
  },
  {
    title: "Ultra Features",
    items: [
      { title: "Mission Control", href: "/docs/ultra" },
      { title: "Task Board", href: "/docs/ultra/task-board" },
      { title: "Agent Roster", href: "/docs/ultra/agent-roster" },
      { title: "Event Feed", href: "/docs/ultra/event-feed" },
      { title: "Sessions", href: "/docs/ultra/sessions" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "Authentication", href: "/docs/api/auth" },
      { title: "Chat API", href: "/docs/api/chat" },
      { title: "Agents API", href: "/docs/api/agents" },
      { title: "Webhooks API", href: "/docs/api/webhooks" },
      { title: "Models API", href: "/docs/api/models" },
      { title: "Rate Limits", href: "/docs/api/rate-limits" },
    ],
  },
  {
    title: "Help",
    items: [
      { title: "FAQ", href: "/docs/faq" },
      { title: "Contact Support", href: "/docs/support-contact" },
    ],
  },
];

function NavGroup({ group }: { group: (typeof DOCS_NAV)[number] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-1.5 px-1"
      >
        {group.title}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DocsNav() {
  const [search, setSearch] = useState("");

  const filteredNav = search
    ? DOCS_NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.title.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((group) => group.items.length > 0)
    : DOCS_NAV;

  return (
    <div className="flex flex-col h-full">
      <Link href="/" className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">C</span>
        </div>
        <span className="font-semibold tracking-wider text-sm">ClawHQ Docs</span>
      </Link>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search docs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-muted border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <nav className="flex-1 overflow-y-auto">
        {filteredNav.map((group) => (
          <NavGroup key={group.title} group={group} />
        ))}
      </nav>
    </div>
  );
}

export function MobileDocsNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 w-8 h-8 flex items-center justify-center rounded-md bg-card border border-border"
        aria-label="Toggle docs navigation"
      >
        {open ? <X size={16} /> : <Menu size={16} />}
      </button>
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border p-6 overflow-y-auto">
            <DocsNav />
          </aside>
        </>
      )}
    </>
  );
}
