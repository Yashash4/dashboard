import type { Metadata } from "next";
import { DocsNav, MobileDocsNav } from "@/components/docs/docs-nav";

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
      <MobileDocsNav />

      <div className="flex">
        {/* Left sidebar */}
        <aside className="hidden md:block fixed top-0 left-0 w-64 h-screen border-r border-border p-6 overflow-y-auto bg-card">
          <DocsNav />
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64 lg:mr-48 min-h-screen">
          <div className="max-w-3xl mx-auto px-6 py-12">
            {children}
          </div>
        </main>

        {/* Right sidebar — table of contents placeholder */}
        <aside className="hidden lg:block fixed top-0 right-0 w-48 h-screen p-6 border-l border-border overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            On this page
          </p>
          <p className="text-xs text-muted-foreground">
            {/* Table of contents will be generated per page */}
          </p>
        </aside>
      </div>
    </div>
  );
}
