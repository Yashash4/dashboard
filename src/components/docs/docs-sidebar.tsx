"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, BookOpen, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DocsHeader } from "./docs-header";

interface Section {
  id: string;
  label: string;
  num: string;
}

const DOC_PAGES = [
  { label: "Chat API", href: "/docs", icon: "01" },
  { label: "Webhooks", href: "/docs/webhooks", icon: "02" },
  { label: "Knowledge Base", href: "/docs/knowledge-base", icon: "03" },
];

export function DocsSidebar({
  sections,
  children,
}: {
  sections: Section[];
  children: React.ReactNode;
}) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    const sectionEls = document.querySelectorAll("section[id]");
    sectionEls.forEach((s) => observer.observe(s));
    return () => sectionEls.forEach((s) => observer.unobserve(s));
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const sidebarContent = (
    <nav className="p-6 space-y-0.5">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="font-mono text-[11px] text-white/50 uppercase tracking-widest">
          API Reference
        </span>
      </div>

      {/* Page navigation (mobile only — desktop has header nav) */}
      <div className="md:hidden mb-4 pb-4 border-b border-white/[0.06] space-y-0.5">
        {DOC_PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className={`block px-3 py-2 text-[12px] font-mono transition-all duration-150 ${
              pathname === page.href
                ? "text-primary bg-primary/5"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            <span className="text-white/15 mr-2">{page.icon}</span>
            {page.label}
          </Link>
        ))}
      </div>

      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={`w-full text-left px-3 py-2 text-[13px] font-mono transition-all duration-150 ${
            activeSection === s.id
              ? "text-primary border-l-2 border-primary bg-primary/5 -ml-px"
              : "text-white/40 hover:text-white/70 border-l-2 border-transparent -ml-px"
          }`}
        >
          {s.label}
        </button>
      ))}

      <div className="pt-6 mt-6 border-t border-white/[0.06]">
        <Link
          href="/register"
          className="flex items-center gap-2 px-3 py-2 text-[12px] font-mono text-primary/70 hover:text-primary transition-colors"
        >
          Get API Key
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <DocsHeader>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="lg:hidden p-1.5 text-white/50 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-background border-white/10">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </DocsHeader>

      <div className="flex pt-16">
        <aside className="hidden lg:block fixed top-16 left-0 w-60 h-[calc(100vh-64px)] border-r border-white/10 bg-background overflow-y-auto">
          {sidebarContent}
        </aside>

        <main className="flex-1 lg:ml-60 px-4 sm:px-8 lg:px-16 py-12 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
