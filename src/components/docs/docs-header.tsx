"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const DOC_PAGES = [
  { label: "Getting Started", href: "/docs" },
  { label: "Dashboard", href: "/docs/dashboard" },
  { label: "Pro Features", href: "/docs/pro" },
  { label: "Ultra", href: "/docs/ultra" },
  { label: "API Reference", href: "/docs/api/auth" },
  { label: "Billing", href: "/docs/billing" },
  { label: "Support", href: "/docs/support" },
];

export function DocsHeader({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center px-4 lg:px-8">
      <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4">
          {/* Mobile menu trigger — rendered by parent */}
          {children}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold font-mono">
                C
              </span>
            </div>
            <span className="text-[var(--text-primary)] text-sm font-semibold tracking-widest font-mono uppercase">
              ClawHQ
            </span>
          </Link>

          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <span className="hidden sm:inline text-[var(--text-tertiary)] text-[11px] font-mono uppercase tracking-wider">
            Documentation
          </span>

          {/* Page navigation */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            {DOC_PAGES.map((page) => {
              const isActive = pathname === page.href || pathname.startsWith(page.href + "/");
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`px-3 py-1.5 text-[11px] font-mono tracking-wider transition-all duration-150 ${
                    isActive
                      ? "text-primary bg-primary/10 border border-primary/30"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent"
                  }`}
                >
                  {page.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-3 w-3" />
            Home
          </Link>
          <Link
            href="/register"
            className="text-[11px] font-mono tracking-wider border border-primary bg-primary text-primary-foreground px-4 py-1.5 hover:brightness-110 transition-all uppercase"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
