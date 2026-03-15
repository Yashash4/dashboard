import Link from "next/link";

export default function DocsKnowledgeBasePage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Knowledge Base{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        The Knowledge Base turns your agents from generic conversationalists into domain experts.
        Upload your documentation, product guides, FAQs, or any reference material, and your
        agents will use it to answer questions accurately — grounded in your actual content rather
        than guessing.
      </p>

      <h2>How RAG Works</h2>

      <p>
        The Knowledge Base is powered by <strong>Retrieval-Augmented Generation (RAG)</strong>, a
        technique that combines search with AI generation. Here is exactly how it works, step by
        step:
      </p>

      <ol>
        <li>
          <strong>Upload</strong> — You upload documents (PDF, TXT, MD, CSV) or provide URLs to
          crawl. The raw content is extracted and stored on your VPS.
        </li>
        <li>
          <strong>Chunk</strong> — Each document is split into smaller pieces called chunks. ClawHQ
          uses a chunk size of <strong>2,000 characters</strong> with a <strong>200-character
          overlap</strong> between consecutive chunks. The overlap ensures that no information is
          lost at chunk boundaries — if a key sentence spans two chunks, the overlap captures it
          in both.
        </li>
        <li>
          <strong>Embed</strong> — Each chunk is converted into a numerical vector (an embedding)
          using the <strong>all-MiniLM-L6-v2</strong> model, which produces <strong>384-dimensional</strong>{" "}
          vectors. These vectors capture the semantic meaning of each chunk, so chunks about
          similar topics end up close together in vector space.
        </li>
        <li>
          <strong>Search</strong> — When a user asks a question, the question is also embedded
          into a vector. The system searches for chunks whose vectors are most similar to the
          question vector. This is called <em>semantic search</em> — it finds relevant content
          even when the exact words differ.
        </li>
        <li>
          <strong>Inject Context</strong> — The most relevant chunks are inserted into the
          prompt as context, placed before the user&apos;s question. The model sees both the
          retrieved content and the question together.
        </li>
        <li>
          <strong>Model Answers</strong> — The AI model generates its response using the injected
          context. Because the relevant information is right there in the prompt, the model can
          give accurate, grounded answers instead of relying solely on its training data.
        </li>
      </ol>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Why RAG matters:</strong> Without RAG, your agent can
        only answer from its general training knowledge. With RAG, it answers from <em>your</em>{" "}
        data — your product docs, your policies, your specific domain expertise. This dramatically
        reduces hallucination and increases answer accuracy.
      </div>

      <h2>Supported File Types</h2>

      <p>
        The Knowledge Base accepts four file formats:
      </p>

      <ul>
        <li><strong>PDF</strong> — Product manuals, research papers, contracts, any document saved as PDF. Text is extracted automatically; scanned images within PDFs are not supported.</li>
        <li><strong>TXT</strong> — Plain text files of any kind.</li>
        <li><strong>MD</strong> — Markdown files, including those with frontmatter. Markdown formatting is preserved during chunking.</li>
        <li><strong>CSV</strong> — Tabular data. Each row is treated as a potential chunk boundary, making CSV ideal for FAQ lists or structured reference data.</li>
      </ul>

      <h2>Upload Files or Crawl URLs</h2>

      <p>
        You can populate your Knowledge Base in two ways:
      </p>

      <ul>
        <li>
          <strong>File upload</strong> — Drag and drop files directly into the dashboard, or click
          to browse. Multiple files can be uploaded simultaneously. Each file is processed
          (extracted, chunked, embedded) automatically.
        </li>
        <li>
          <strong>URL crawl</strong> — Provide a URL and ClawHQ will fetch the page content,
          extract the text, and process it through the same chunking and embedding pipeline. This
          is useful for ingesting existing web documentation, help center articles, or blog posts.
        </li>
      </ul>

      <h2>Hybrid Search</h2>

      <p>
        ClawHQ uses <strong>hybrid search</strong>, which combines two search strategies
        simultaneously:
      </p>

      <ul>
        <li>
          <strong>Vector search</strong> — Finds semantically similar content using embedding
          cosine similarity. Catches relevant results even when the wording differs from the query.
        </li>
        <li>
          <strong>Keyword search</strong> — Traditional text matching that finds exact terms,
          product names, error codes, and other specific strings that semantic search might rank
          lower.
        </li>
      </ul>

      <p>
        Both searches run simultaneously, and the results are merged using a weighted combination.
        This ensures that you get the best of both worlds: semantic understanding plus precise
        keyword matching.
      </p>

      <h2>Relevance Threshold</h2>

      <p>
        The default relevance threshold is a <strong>0.3 cosine similarity score</strong>. Chunks
        scoring below this threshold are excluded from the context injected into the model prompt.
        This prevents low-quality matches from polluting the context window.
      </p>

      <p>
        You can adjust the threshold in the Knowledge Base settings. A higher threshold (e.g.,
        0.5) means only very closely matching chunks are used — more precise but potentially
        missing relevant content. A lower threshold (e.g., 0.2) casts a wider net but may include
        marginally relevant chunks.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Tip:</strong> Use the &quot;Test Your KB&quot; feature
        (described below) to experiment with different thresholds. Search for questions your users
        actually ask and verify that the right chunks are returned.
      </div>

      <h2>Test Your Knowledge Base</h2>

      <p>
        The &quot;Test Your KB&quot; interface lets you run search queries against your Knowledge
        Base and see exactly which chunks are returned, along with their relevance scores. This is
        invaluable for:
      </p>

      <ul>
        <li>Verifying that your documents are chunked correctly</li>
        <li>Tuning the relevance threshold</li>
        <li>Identifying gaps in your content (queries that return no results)</li>
        <li>Confirming that the right content surfaces for expected questions</li>
      </ul>

      <p>
        Type a question in the search bar, and the results panel shows each matching chunk with
        its source document, chunk index, similarity score, and the full chunk text.
      </p>

      <h2>Retrieval Tracking</h2>

      <p>
        Retrieval tracking records which documents and chunks are used most frequently in agent
        responses. Over time, this data reveals which parts of your Knowledge Base are most
        valuable and which documents are rarely accessed.
      </p>

      <p>
        Use retrieval tracking to prioritize content updates. Documents that are retrieved
        frequently but receive negative feedback may need rewriting. Documents that are never
        retrieved may need better titles or additional context to improve their discoverability.
      </p>

      <h2>Chunk Viewer</h2>

      <p>
        The Chunk Viewer lets you inspect individual chunks within any document. See how your
        content was split, verify that chunk boundaries make sense, and identify cases where
        important information was split across chunks in an unhelpful way.
      </p>

      <p>
        Each chunk displays its index number, character count, the first and last few words of
        overlap with adjacent chunks, and its embedding vector magnitude. You can navigate
        through chunks sequentially or jump to a specific chunk by index.
      </p>

      <h2>Connectors</h2>

      <p>
        Connect external data sources to keep your Knowledge Base synchronized with content that
        lives outside of ClawHQ:
      </p>

      <ul>
        <li>
          <strong>Google Drive</strong> — Connect your Google Drive account and select specific
          files or folders to sync. When the source document changes in Drive, the Knowledge Base
          automatically re-processes it.
        </li>
        <li>
          <strong>Notion</strong> — Connect your Notion workspace and select databases or pages
          to sync. Notion content is extracted, chunked, and embedded just like uploaded files.
        </li>
      </ul>

      <p>
        Connectors check for updates periodically and re-index changed content automatically.
        You can also trigger a manual sync at any time from the Connectors panel.
      </p>

      <h2>Feedback</h2>

      <p>
        When a user receives an answer that was sourced from the Knowledge Base, they can provide
        thumbs-up or thumbs-down feedback. This feedback is linked back to the specific chunks
        that were used, giving you a direct signal about content quality.
      </p>

      <p>
        Over time, feedback data helps you identify documents that are helpful versus those that
        lead to poor answers. Combined with retrieval tracking, feedback creates a continuous
        improvement loop for your Knowledge Base content.
      </p>

      <h2>Reindexing Documents</h2>

      <p>
        If you update the embedding model, change chunk settings, or modify a document&apos;s
        content, you can trigger a reindex. Reindexing re-processes the document through the full
        pipeline: extraction, chunking, and embedding. The old chunks are replaced with the new
        ones atomically, so there is no downtime during reindexing.
      </p>

      <h2>Data Privacy</h2>

      <p>
        All Knowledge Base data — uploaded files, extracted text, chunks, and embedding vectors —
        is stored on your VPS. Your data never leaves your instance. The embedding model runs
        locally on the VPS, so document content is never sent to external services for processing.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Next steps:</strong> After populating your Knowledge Base,
        use the <Link href="/docs/pro/analytics" className="text-primary underline">Analytics</Link>{" "}
        module to track how Knowledge Base-sourced answers affect your CSAT scores and resolution
        rates.
      </div>

      <h2>Related Documentation</h2>

      <ul>
        <li><Link href="/docs/pro">Pro Features Overview</Link> — Full list of Pro capabilities</li>
        <li><Link href="/docs/pro/analytics">Analytics</Link> — Track how KB-sourced answers impact satisfaction</li>
        <li><Link href="/docs/pro/agent-builder">Agent Builder</Link> — Create agents that leverage your Knowledge Base</li>
        <li><Link href="/docs/pro/api">API Access</Link> — Query the Knowledge Base programmatically via the API</li>
      </ul>
    </article>
  );
}
