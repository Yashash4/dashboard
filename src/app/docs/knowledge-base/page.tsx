import Link from "next/link";

export default function DocsKnowledgeBasePage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Knowledge Base</h1>
      <p className="text-muted-foreground text-lg">
        The Knowledge Base feature is available on Pro and Ultra plans. It provides
        a full RAG (Retrieval-Augmented Generation) pipeline for enriching your AI
        agents with your own documents and data.
      </p>

      <h2>Features</h2>
      <ul>
        <li>File uploads (PDF, TXT, CSV, DOCX)</li>
        <li>URL crawling and content extraction</li>
        <li>Hybrid search combining keyword and semantic matching</li>
        <li>Chunk inspection and manual override</li>
        <li>Retrieval analytics to understand what content is being used</li>
        <li>External connectors for third-party data sources</li>
      </ul>

      <h2>Upgrading to Pro</h2>
      <p>
        Knowledge Base is available on the{" "}
        <Link href="/docs/pro/knowledge-base" className="text-primary hover:underline">Pro plan</Link>{" "}
        with 500 documents included, and on Ultra with unlimited documents.
      </p>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/faq" className="text-primary hover:underline">FAQ</Link> for common questions.</li>
        <li><Link href="/docs/pro/knowledge-base" className="text-primary hover:underline">Pro Knowledge Base</Link> documentation.</li>
        <li><Link href="/docs/billing" className="text-primary hover:underline">Compare plans</Link> to upgrade.</li>
      </ul>
    </article>
  );
}
