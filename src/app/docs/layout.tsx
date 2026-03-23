import type { Metadata } from "next";
import { DocsNav, MobileDocsNav } from "@/components/docs/docs-nav";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";

export const metadata: Metadata = {
  title: "Documentation | ClawHQ",
  description:
    "ClawHQ documentation — guides, feature docs, API reference, and more.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip navigation link for keyboard/screen reader users */}
      <a
        href="#docs-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[var(--bg-elevated)] focus:text-[var(--text-primary)] focus:px-4 focus:py-2 focus:rounded-md focus:border focus:border-[var(--border-primary)]"
      >
        Skip to content
      </a>

      <MobileDocsNav />

      <div className="flex">
        {/* Left sidebar */}
        <aside className="hidden md:block fixed top-0 left-0 w-64 h-screen border-r border-border p-6 overflow-y-auto bg-card">
          <DocsNav />
        </aside>

        {/* Main content — no right sidebar */}
        <main id="docs-main-content" className="flex-1 md:ml-64 min-h-screen">
          <div className="max-w-3xl mx-auto px-6 py-12">
            <DocsBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
