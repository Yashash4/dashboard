import KnowledgeBaseDocs from "@/components/docs/knowledge-base-docs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Base API Documentation | ClawHQ",
  description:
    "Complete Knowledge Base API reference for ClawHQ. Upload documents, crawl URLs, search with full-text search, and give your AI agents document-aware context through RAG.",
  openGraph: {
    title: "Knowledge Base API Documentation | ClawHQ",
    description:
      "Upload documents and URLs to give your AI agents intelligent, document-aware responses.",
    type: "website",
  },
};

export default function KnowledgeBaseDocsPage() {
  return <KnowledgeBaseDocs />;
}
