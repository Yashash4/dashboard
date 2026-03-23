"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Server, Cpu, MessageSquare, Bot, BarChart3, Shield, Wand2, Database, Code2, Webhook, ClipboardList, FileSearch, Command, Activity, BookOpen, HelpCircle, FileText, ChevronDown } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import Image from "next/image";

/* ─── Card Components (Resend-style dark cards with icon + gradient) ─── */

function CardVisual({ icon: Icon, gradient }: { icon: typeof Server; gradient: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Radial gradient glow */}
      <div className={`absolute w-[200%] h-[200%] ${gradient} opacity-[0.07]`} />
      {/* Concentric rings */}
      <div className="relative">
        <div className={`absolute -inset-8 rounded-full border ${gradient.includes("accent") ? "border-[var(--accent)]/[0.06]" : gradient.includes("pro") ? "border-[var(--tier-pro)]/[0.06]" : "border-[var(--tier-ultra)]/[0.06]"}`} />
        <div className={`absolute -inset-16 rounded-full border ${gradient.includes("accent") ? "border-[var(--accent)]/[0.03]" : gradient.includes("pro") ? "border-[var(--tier-pro)]/[0.03]" : "border-[var(--tier-ultra)]/[0.03]"}`} />
        <Icon size={28} className="opacity-20" />
      </div>
    </div>
  );
}

/* ─── Dropdown Definitions ─── */

const dropdowns: Record<string, {
  links: { icon: typeof Server; label: string; href: string }[];
  cards: { title: string; subtitle?: string; tag?: string; cardIcon: typeof Server; accentClass: string; gradient: string }[];
}> = {
  Features: {
    links: [
      { icon: Cpu, label: "AI Models", href: "#features" },
      { icon: MessageSquare, label: "Channels", href: "#features" },
      { icon: Bot, label: "Agent Store", href: "#features" },
      { icon: Database, label: "Knowledge Base", href: "#features" },
      { icon: Code2, label: "API & Webhooks", href: "#features" },
      { icon: Command, label: "Mission Control", href: "#features" },
    ],
    cards: [
      { title: "Starter Platform", subtitle: "Everything to run AI agents", cardIcon: Server, accentClass: "text-[var(--accent)]", gradient: "bg-[radial-gradient(circle_at_50%_50%,var(--accent),transparent_70%)]" },
      { title: "Pro Tools", subtitle: "Build and integrate", tag: "PRO", cardIcon: Code2, accentClass: "text-[var(--tier-pro)]", gradient: "bg-[radial-gradient(circle_at_50%_50%,var(--tier-pro),transparent_70%)]" },
    ],
  },
  "Pro & Ultra": {
    links: [
      { icon: Wand2, label: "Agent Builder", href: "#features" },
      { icon: Database, label: "Knowledge Base", href: "#features" },
      { icon: Code2, label: "API Access", href: "#features" },
      { icon: Webhook, label: "Webhooks", href: "#features" },
      { icon: FileSearch, label: "Analytics & Logs", href: "#features" },
      { icon: ClipboardList, label: "Audit Log", href: "#features" },
    ],
    cards: [
      { title: "Mission Control", subtitle: "Command your AI workforce", tag: "ULTRA", cardIcon: Command, accentClass: "text-[var(--tier-ultra)]", gradient: "bg-[radial-gradient(circle_at_50%_50%,var(--tier-ultra),transparent_70%)]" },
      { title: "Agent Builder", subtitle: "AI-assisted or manual", tag: "PRO", cardIcon: Wand2, accentClass: "text-[var(--tier-pro)]", gradient: "bg-[radial-gradient(circle_at_50%_50%,var(--tier-pro),transparent_70%)]" },
    ],
  },
  Resources: {
    links: [
      { icon: BookOpen, label: "Documentation", href: "/docs" },
      { icon: Code2, label: "API Reference", href: "/docs/pro/api" },
      { icon: HelpCircle, label: "FAQ", href: "#faq" },
      { icon: FileText, label: "Terms", href: "/terms" },
    ],
    cards: [
      { title: "Getting Started", subtitle: "From zero to live agents in minutes", tag: "GUIDE", cardIcon: BookOpen, accentClass: "text-[var(--accent)]", gradient: "bg-[radial-gradient(circle_at_50%_50%,var(--accent),transparent_70%)]" },
    ],
  },
};

const dropdownKeys = Object.keys(dropdowns);

/* ─── Navbar ─── */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(key);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 200);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-primary)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="ClawHQ" width={28} height={28} className="h-7 w-7" />
          <span className="text-[17px] font-semibold tracking-tight text-[var(--text-primary)]">ClawHQ</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {dropdownKeys.map((key) => (
            <div key={key} className="relative" onMouseEnter={() => handleEnter(key)} onMouseLeave={handleLeave}>
              <button
                className={`flex items-center gap-1 text-[15px] transition-colors px-3.5 py-2 rounded-lg ${
                  activeDropdown === key
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {key}
                <ChevronDown
                  size={11}
                  className={`transition-transform duration-200 ${activeDropdown === key ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown positioned under this button */}
              <AnimatePresence>
                {activeDropdown === key && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-2 z-50"
                    onMouseEnter={() => handleEnter(key)}
                    onMouseLeave={handleLeave}
                  >
                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-elevated)] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)] p-4 flex gap-4">
                      {/* Links */}
                      <div className="flex flex-col gap-0.5 py-1">
                        {dropdowns[key].links.map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            className="text-[16px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-1.5 px-3 rounded-lg hover:bg-[var(--accent-subtle)] whitespace-nowrap"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>

                      {/* Cards */}
                      <div className="flex flex-col gap-2.5 justify-center">
                        {dropdowns[key].cards.map((card) => {
                          const CardIcon = card.cardIcon;
                          return (
                            <div
                              key={card.title}
                              className="relative overflow-hidden rounded-xl bg-[#161616] border border-[var(--border-primary)] p-4 pr-6 group hover:border-[var(--text-tertiary)]/20 transition-all duration-300 cursor-default flex items-center gap-3.5 min-w-[200px]"
                            >
                              <div className={`absolute inset-0 ${card.gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500`} />
                              <div className="relative z-10 w-9 h-9 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                                <CardIcon size={16} className={`${card.accentClass} opacity-40 group-hover:opacity-70 transition-opacity`} />
                              </div>
                              <div className="relative z-10">
                                {card.tag && (
                                  <span className={`text-[8px] font-semibold uppercase tracking-widest ${card.accentClass} opacity-60`}>
                                    {card.tag}
                                  </span>
                                )}
                                <h4 className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">{card.title}</h4>
                                {card.subtitle && (
                                  <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{card.subtitle}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <a href="#pricing" className="text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3.5 py-2">
            Pricing
          </a>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <a href="/vps" className="text-[15px] px-4 py-2 rounded-lg bg-[var(--cta)] text-[var(--cta-foreground)] font-medium hover:opacity-90 transition-opacity">
              Dashboard
            </a>
          ) : (
            <>
              <a href="/login" className="text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2">Log in</a>
              <a href="/register" className="text-[15px] px-4 py-2 rounded-lg bg-[var(--cta)] text-[var(--cta-foreground)] font-medium hover:opacity-90 transition-opacity">
                Get Started
              </a>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-[var(--text-primary)] p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation menu">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>


      {/* ─── Mobile Menu ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[var(--bg-elevated)] border-b border-[var(--border-primary)] overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {dropdownKeys.map((key) => (
                <div key={key} className="flex flex-col">
                  <span className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-widest px-3 py-2 mt-2">{key}</span>
                  {dropdowns[key].links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2 text-[15px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-[15px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors mt-2">
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-[var(--border-primary)]">
                {user ? (
                  <a href="/vps" className="text-sm text-center px-4 py-2.5 rounded-lg bg-[var(--cta)] text-[var(--cta-foreground)] font-medium">Dashboard</a>
                ) : (
                  <>
                    <a href="/login" className="text-sm text-[var(--text-secondary)] px-3 py-2">Log in</a>
                    <a href="/register" className="text-sm text-center px-4 py-2.5 rounded-lg bg-[var(--cta)] text-[var(--cta-foreground)] font-medium">Get Started</a>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
