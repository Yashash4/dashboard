"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABEL_MAP: Record<string, string> = {
  docs: "Docs",
  pro: "Pro",
  ultra: "Ultra",
  api: "API",
  agents: "Agents",
  models: "Models",
  auth: "Authentication",
  chat: "Chat",
  webhooks: "Webhooks",
  "rate-limits": "Rate Limits",
  vps: "VPS",
  billing: "Billing",
  support: "Support",
  account: "Account",
  channels: "Channels",
  plans: "Plans",
  faq: "FAQ",
  dashboard: "Dashboard",
  "getting-started": "Getting Started",
  store: "Store",
  "agent-builder": "Agent Builder",
  "model-playground": "Model Playground",
  "knowledge-base": "Knowledge Base",
  logs: "Logs",
  analytics: "Analytics",
  "audit-log": "Audit Log",
  monitoring: "Monitoring",
  "task-board": "Task Board",
  "agent-roster": "Agent Roster",
  "event-feed": "Event Feed",
  sessions: "Sessions",
  "support-contact": "Contact Support",
};

export function DocsBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/docs") return null;

  const segments = pathname.replace(/^\/docs\/?/, "").split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/docs/" + segments.slice(0, i + 1).join("/");
    const label = LABEL_MAP[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    return { href, label };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/docs" className="hover:text-foreground transition-colors">
        Docs
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-muted-foreground/50" />
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
