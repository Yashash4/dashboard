"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const DOC_PAGES = [
  { label: "Chat API", href: "/docs" },
  { label: "Webhooks", href: "/docs/api/webhooks" },
  { label: "Knowledge Base", href: "/docs/pro/knowledge-base" },
];

export function DocsHeader({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b border-white/10 flex items-center px-4 lg:px-8">
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
            <span className="text-white text-sm font-semibold tracking-widest font-mono uppercase">
              ClawHQ
            </span>
          </Link>

          <div className="h-4 w-px bg-white/10" />
          <span className="hidden sm:inline text-white/50 text-[11px] font-mono uppercase tracking-wider">
            API Docs
          </span>

          {/* Page navigation */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            {DOC_PAGES.map((page) => {
              const isActive = pathname === page.href;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`px-3 py-1.5 text-[11px] font-mono tracking-wider transition-all duration-150 ${
                    isActive
                      ? "text-primary bg-primary/10 border border-primary/30"
                      : "text-white/40 hover:text-white/70 border border-transparent"
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
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-white/40 hover:text-white transition-colors uppercase tracking-wider"
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
