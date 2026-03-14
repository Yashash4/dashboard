"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Server, Cpu, MessageSquare, Bot, BarChart3, Shield, Zap, BookOpen, HelpCircle, Users, FileText, ChevronDown } from "lucide-react";

/* ─── Dropdown Content Definitions ─── */

const dropdowns: Record<string, { links: { icon: typeof Server; label: string; desc: string; href: string }[]; preview?: { title: string; subtitle: string; tag?: string } }> = {
  Features: {
    links: [
      { icon: Server, label: "Dedicated VPS", desc: "Your own server, not shared", href: "#features" },
      { icon: Cpu, label: "500+ AI Models", desc: "GPT-4o, Claude, Llama, Mistral & more", href: "#features" },
      { icon: MessageSquare, label: "7 Channels", desc: "WhatsApp, Telegram, Discord, Slack…", href: "#features" },
      { icon: Bot, label: "Agent Store", desc: "Deploy pre-built agents in one click", href: "#features" },
      { icon: BarChart3, label: "Monitoring", desc: "Real-time CPU, RAM, disk, network", href: "#features" },
      { icon: Shield, label: "Managed Security", desc: "SSL, firewall, auto-restart included", href: "#features" },
    ],
    preview: {
      tag: "NEW",
      title: "Mission Control Dashboard",
      subtitle: "Manage your entire AI infrastructure from one place — agents, channels, models, and monitoring.",
    },
  },
  Solutions: {
    links: [
      { icon: Users, label: "Customer Support", desc: "AI agents for support teams", href: "#features" },
      { icon: Zap, label: "Sales Automation", desc: "Qualify leads across all channels", href: "#features" },
      { icon: Bot, label: "Internal Assistants", desc: "Deploy agents for your team", href: "#features" },
    ],
    preview: {
      title: "Built for any team",
      subtitle: "Whether you're a solo founder or an enterprise — ClawHQ scales with you. One dashboard, unlimited potential.",
    },
  },
  Resources: {
    links: [
      { icon: BookOpen, label: "Documentation", desc: "Guides, API reference, tutorials", href: "#" },
      { icon: HelpCircle, label: "FAQ", desc: "Common questions answered", href: "#faq" },
      { icon: FileText, label: "Blog", desc: "Updates, tutorials, case studies", href: "#" },
    ],
    preview: {
      tag: "GUIDE",
      title: "Getting Started",
      subtitle: "From zero to live AI agents in under 24 hours. Follow our step-by-step guide.",
    },
  },
};

const dropdownKeys = Object.keys(dropdowns);

/* ─── Navbar Component ─── */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(key);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="text-lg font-semibold tracking-tight text-foreground">
          claw<span className="text-primary">hq</span>
        </a>

        {/* Desktop nav links with dropdowns */}
        <div className="hidden md:flex items-center gap-1">
          {dropdownKeys.map((key) => (
            <div
              key={key}
              className="relative"
              onMouseEnter={() => handleEnter(key)}
              onMouseLeave={handleLeave}
            >
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md">
                {key}
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    activeDropdown === key ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          ))}
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Pricing
          </a>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </a>
          <a
            href="/register"
            className="text-sm px-4 py-2 rounded-[var(--radius)] bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ─── Dropdown Panel (shared, positioned below nav) ─── */}
      <AnimatePresence>
        {activeDropdown && dropdowns[activeDropdown] && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-16 border-b border-border bg-card/95 backdrop-blur-xl"
            onMouseEnter={() => handleEnter(activeDropdown)}
            onMouseLeave={handleLeave}
          >
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="grid grid-cols-[1fr_300px] gap-8">
                {/* Left: link list */}
                <div className="grid grid-cols-2 gap-1">
                  {dropdowns[activeDropdown].links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="flex items-start gap-3 p-3 rounded-[var(--radius)] hover:bg-muted/50 transition-colors group"
                    >
                      <link.icon
                        size={16}
                        className="text-primary mt-0.5 shrink-0"
                      />
                      <div>
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {link.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {link.desc}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Right: preview card */}
                {dropdowns[activeDropdown].preview && (
                  <div className="border border-border rounded-[var(--radius)] bg-muted/30 p-5 flex flex-col justify-center">
                    {dropdowns[activeDropdown].preview!.tag && (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2">
                        {dropdowns[activeDropdown].preview!.tag}
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-foreground mb-1.5">
                      {dropdowns[activeDropdown].preview!.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {dropdowns[activeDropdown].preview!.subtitle}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Mobile Menu ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {dropdownKeys.map((key) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest px-3 py-2 mt-2">
                    {key}
                  </span>
                  {dropdowns[key].links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <link.icon size={14} className="text-primary shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
              <a
                href="#pricing"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm text-foreground hover:text-primary transition-colors mt-2"
              >
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                <a href="/login" className="text-sm text-muted-foreground px-3 py-2">
                  Log in
                </a>
                <a
                  href="/register"
                  className="text-sm text-center px-4 py-2.5 rounded-[var(--radius)] bg-primary text-primary-foreground font-medium"
                >
                  Get Started
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
