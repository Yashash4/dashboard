"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "./code-block";
import { HttpBadge } from "./http-badge";
import { ParamTable } from "./param-table";
import { Callout } from "./callout";
import { SectionHeading } from "./section-heading";
import { StatusBadge } from "./status-badge";
import { DocsSidebar } from "./docs-sidebar";

const SECTIONS = [
  { id: "introduction", label: "Introduction", num: "001" },
  { id: "quick-start", label: "Quick Start", num: "002" },
  { id: "list-documents", label: "List Documents", num: "003" },
  { id: "upload-file", label: "Upload File", num: "004" },
  { id: "add-url", label: "Add URL", num: "005" },
  { id: "search", label: "Search", num: "006" },
  { id: "delete-document", label: "Delete Document", num: "007" },
  { id: "reindex", label: "Reindex", num: "008" },
  { id: "chunking", label: "Chunking Algorithm", num: "009" },
  { id: "chat-integration", label: "Chat Integration", num: "010" },
  { id: "limits", label: "Limits & Quotas", num: "011" },
  { id: "errors", label: "Error Reference", num: "012" },
];

const BASE_URL = "https://app.clawhq.tech/api";

const CURL_UPLOAD = `curl -X POST ${BASE_URL}/knowledge-base/upload \\
  -H "Authorization: Bearer $CLAWHQ_API_KEY" \\
  -F "file=@./product-docs.pdf"`;

const CURL_URL = `curl -X POST ${BASE_URL}/knowledge-base/url \\
  -H "Authorization: Bearer $CLAWHQ_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://docs.example.com/faq"}'`;

const CURL_SEARCH = `curl "${BASE_URL}/knowledge-base/search?q=how+to+reset+password" \\
  -H "Authorization: Bearer $CLAWHQ_API_KEY"`;

const CURL_DELETE = `curl -X DELETE ${BASE_URL}/knowledge-base/{document_id} \\
  -H "Authorization: Bearer $CLAWHQ_API_KEY"`;

const CURL_REINDEX = `curl -X POST ${BASE_URL}/knowledge-base/{document_id}/reindex \\
  -H "Authorization: Bearer $CLAWHQ_API_KEY"`;

const CHUNKING_PSEUDO = `function chunkText(text):
  paragraphs = text.split("\\n\\n")  // Split on double newlines

  for each paragraph:
    if paragraph.length > 2000:
      // Split long paragraphs at sentence boundaries
      splitAtSentences(paragraph, maxSize=2000)
    else:
      // Accumulate paragraphs until chunk reaches 2000 chars
      if currentChunk + paragraph > 2000:
        saveChunk(currentChunk)
        // Keep last 200 chars as overlap for context continuity
        currentChunk = last200chars + paragraph
      else:
        currentChunk += paragraph

  // Discard chunks shorter than 10 characters
  return chunks.filter(c => c.length > 10)`;

const CSV_CHUNKING_PSEUDO = `function chunkCSV(csvText):
  header = firstLine

  for each dataRow:
    rowWithContext = "Headers: " + header + "\\n\\nRow N: " + dataRow

    if currentChunk + rowWithContext > 2000:
      saveChunk(currentChunk)
      // Each new chunk starts with the header for context
      currentChunk = "Headers: " + header + "\\n\\n" + rowWithContext
    else:
      currentChunk += rowWithContext

  return chunks`;

export default function KnowledgeBaseDocs() {
  return (
    <DocsSidebar sections={SECTIONS}>
      {/* ════════ SECTION 1: INTRODUCTION ════════ */}
      <section id="introduction" className="mb-20 scroll-mt-24">
        <SectionHeading num="001" title="Introduction" id="introduction" />
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
            Pro Feature
          </span>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          The Knowledge Base gives your AI agents context from your own documents.
          Upload files or crawl URLs — content is automatically chunked, indexed
          with full-text search, and injected into agent conversations as relevant
          context. This is RAG (Retrieval-Augmented Generation) built into your agent.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="border border-white/10 p-4 bg-white/[0.01]">
            <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
              Supported Files
            </div>
            <code className="font-mono text-[14px] text-white/80">PDF, TXT, MD, CSV</code>
          </div>
          <div className="border border-white/10 p-4 bg-white/[0.01]">
            <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-2">
              Web Crawling
            </div>
            <code className="font-mono text-[14px] text-white/80">Any public URL</code>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Search Engine", value: "Postgres FTS" },
            { label: "Max File Size", value: "10 MB" },
            { label: "Total Storage", value: "100 MB" },
          ].map((item) => (
            <div key={item.label} className="border border-white/10 p-3 bg-white/[0.01]">
              <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-1">
                {item.label}
              </div>
              <span className="font-mono text-[13px] text-white/70">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Callout type="info">
            All Knowledge Base endpoints require <strong>API key authentication</strong> (Bearer token).
            Documents are automatically used in{" "}
            <Link href="/docs" className="text-primary hover:underline">Chat API</Link>{" "}
            responses — no extra parameters needed.
          </Callout>
        </div>
      </section>

      {/* ════════ SECTION 2: QUICK START ════════ */}
      <section id="quick-start" className="mb-20 scroll-mt-24">
        <SectionHeading num="002" title="Quick Start" id="quick-start" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-8">
          Give your agent document-aware answers in 3 steps.
        </p>

        <div className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
              1
            </div>
            <div className="w-px flex-1 bg-white/10 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="text-white font-semibold mb-2">Upload a Document</h3>
            <p className="text-white/50 text-sm mb-3">
              Go to{" "}
              <Link href="/knowledge-base" className="text-primary hover:underline">
                Dashboard → Knowledge Base
              </Link>
              {" "}and upload a PDF, TXT, MD, or CSV file. Or add a URL to crawl.
            </p>
            <CodeBlock language="bash" code={CURL_UPLOAD} />
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
              2
            </div>
            <div className="w-px flex-1 bg-white/10 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="text-white font-semibold mb-2">Wait for Indexing</h3>
            <p className="text-white/50 text-sm mb-3">
              The document is automatically chunked and indexed. Status goes
              from <code className="font-mono text-white/70">processing</code> to{" "}
              <code className="font-mono text-white/70">indexed</code>. This typically
              takes a few seconds.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
              3
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Chat with Context</h3>
            <p className="text-white/50 text-sm mb-3">
              Send a message through the{" "}
              <Link href="/docs" className="text-primary hover:underline">
                Chat API
              </Link>
              {" "}— the system automatically searches your Knowledge Base and injects
              relevant chunks as context. No extra parameters needed.
            </p>
          </div>
        </div>
      </section>

      {/* ════════ SECTION 3: LIST DOCUMENTS ════════ */}
      <section id="list-documents" className="mb-20 scroll-mt-24">
        <SectionHeading num="003" title="List Documents" id="list-documents" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="GET" />
          <code className="font-mono text-[15px] text-white/90">/api/knowledge-base</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Returns all documents in your Knowledge Base, ordered by most recent first.
          Includes total storage usage for quota tracking.
        </p>

        <h3 className="text-white font-semibold mb-3">Response</h3>
        <CodeBlock
          language="json"
          code={`{
  "documents": [
    {
      "id": "uuid-here",
      "name": "product-docs.pdf",
      "type": "pdf",
      "file_size": 245760,
      "status": "indexed",
      "chunk_count": 42,
      "source_url": null,
      "storage_path": "user-id/doc-id/product-docs.pdf",
      "error_message": null,
      "created_at": "2026-03-09T10:00:00Z",
      "indexed_at": "2026-03-09T10:00:05Z"
    }
  ],
  "totalBytes": 1048576
}`}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">Response Fields</h3>
        <ParamTable
          params={[
            { name: "id", type: "uuid", required: true, description: "Unique document identifier." },
            { name: "name", type: "string", required: true, description: "Original filename or URL hostname+path." },
            { name: "type", type: "string", required: true, description: "Document type: \"pdf\", \"txt\", \"md\", \"csv\", or \"url\"." },
            { name: "file_size", type: "number", required: true, description: "Content size in bytes." },
            { name: "status", type: "string", required: true, description: "Processing status: \"processing\", \"indexed\", or \"error\"." },
            { name: "chunk_count", type: "number", required: false, description: "Number of text chunks created after indexing." },
            { name: "source_url", type: "string", required: false, description: "Original URL (for URL-sourced documents only)." },
            { name: "error_message", type: "string", required: false, description: "Error details if status is \"error\"." },
            { name: "totalBytes", type: "number", required: true, description: "Total storage used across all documents (top-level field)." },
          ]}
        />
      </section>

      {/* ════════ SECTION 4: UPLOAD FILE ════════ */}
      <section id="upload-file" className="mb-20 scroll-mt-24">
        <SectionHeading num="004" title="Upload File" id="upload-file" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="POST" />
          <code className="font-mono text-[15px] text-white/90">/api/knowledge-base/upload</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Upload a file to your Knowledge Base. The file is stored in Supabase Storage,
          text is extracted, chunked, and indexed for full-text search.
        </p>

        <h3 className="text-white font-semibold mb-3">Request</h3>
        <div className="border border-white/10 p-4 bg-white/[0.01] mb-4">
          <code className="font-mono text-[13px] text-white/70">
            Content-Type: multipart/form-data
          </code>
        </div>
        <ParamTable
          params={[
            {
              name: "file",
              type: "File",
              required: true,
              description: "The file to upload. Supported types: PDF, TXT, MD, CSV. Max 10 MB.",
            },
          ]}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">Example</h3>
        <Tabs defaultValue="curl">
          <TabsList className="bg-white/[0.03] border border-white/10 h-10 p-0.5">
            <TabsTrigger value="curl" className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4">
              cURL
            </TabsTrigger>
            <TabsTrigger value="python" className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4">
              Python
            </TabsTrigger>
            <TabsTrigger value="javascript" className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4">
              JavaScript
            </TabsTrigger>
          </TabsList>
          <TabsContent value="curl" className="mt-3">
            <CodeBlock language="bash" code={CURL_UPLOAD} />
          </TabsContent>
          <TabsContent value="python" className="mt-3">
            <CodeBlock
              language="python"
              code={`import os
import requests

with open("product-docs.pdf", "rb") as f:
    response = requests.post(
        "${BASE_URL}/knowledge-base/upload",
        files={"file": f},
        headers={"Authorization": f"Bearer {os.environ['CLAWHQ_API_KEY']}"},
    )

data = response.json()
print(f"Document ID: {data['document']['id']}")
print(f"Chunks created: {data['chunkCount']}")`}
            />
          </TabsContent>
          <TabsContent value="javascript" className="mt-3">
            <CodeBlock
              language="javascript"
              code={`const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("${BASE_URL}/knowledge-base/upload", {
  method: "POST",
  body: formData,
  headers: {
    "Authorization": \`Bearer \${process.env.CLAWHQ_API_KEY}\`,
  },
});

const data = await response.json();
console.log("Document ID:", data.document.id);
console.log("Chunks created:", data.chunkCount);`}
            />
          </TabsContent>
        </Tabs>

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <CodeBlock
          language="json"
          code={`{
  "document": {
    "id": "uuid-here",
    "name": "product-docs.pdf",
    "type": "pdf",
    "file_size": 245760,
    "status": "indexed",
    "chunk_count": 42,
    "storage_path": "user-id/doc-id/product-docs.pdf",
    "created_at": "2026-03-09T10:00:00Z",
    "indexed_at": "2026-03-09T10:00:05Z"
  },
  "chunkCount": 42
}`}
        />

        <div className="mt-4">
          <h4 className="text-white/80 text-sm font-semibold mb-2">Supported File Types</h4>
          <div className="border border-white/10 overflow-hidden">
            {[
              { ext: ".pdf", desc: "PDF documents — text extracted via pdf-parse" },
              { ext: ".txt", desc: "Plain text files — read as UTF-8" },
              { ext: ".md", desc: "Markdown files — read as plain text" },
              { ext: ".csv", desc: "CSV files — rows chunked with header context" },
            ].map((ft) => (
              <div key={ft.ext} className="border-b border-white/[0.06] last:border-0 p-3 flex items-center gap-4">
                <code className="font-mono text-[13px] text-primary w-12">{ft.ext}</code>
                <span className="text-white/50 text-[13px]">{ft.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SECTION 5: ADD URL ════════ */}
      <section id="add-url" className="mb-20 scroll-mt-24">
        <SectionHeading num="005" title="Add URL" id="add-url" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="POST" />
          <code className="font-mono text-[15px] text-white/90">/api/knowledge-base/url</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Crawl a public URL and add its text content to your Knowledge Base.
          HTML is stripped (removing scripts, styles, nav, footer, and header elements),
          and the remaining text is chunked and indexed.
        </p>

        <h3 className="text-white font-semibold mb-3">Request Body</h3>
        <ParamTable
          params={[
            {
              name: "url",
              type: "string",
              required: true,
              description: "Public HTTP/HTTPS URL to crawl. No private/internal addresses allowed.",
            },
          ]}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">Example</h3>
        <CodeBlock language="bash" code={CURL_URL} />

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <CodeBlock
          language="json"
          code={`{
  "document": {
    "id": "uuid-here",
    "name": "docs.example.com/faq",
    "type": "url",
    "file_size": 15360,
    "status": "indexed",
    "chunk_count": 8,
    "source_url": "https://docs.example.com/faq",
    "created_at": "2026-03-09T10:00:00Z",
    "indexed_at": "2026-03-09T10:00:03Z"
  },
  "chunkCount": 8
}`}
        />

        <div className="mt-4 space-y-3">
          <h4 className="text-white/80 text-sm font-semibold">Crawling Details</h4>
          <ul className="space-y-2 text-[13px] text-white/60">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
              User-Agent: <code className="font-mono text-white/70">ClawHQ-KB-Crawler/1.0</code>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
              Fetch timeout: 15 seconds
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
              SSRF protection blocks localhost, private IPs (10.x, 172.16-31.x, 192.168.x), and .local/.internal domains
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
              Minimum 20 characters of useful text required after stripping HTML
            </li>
          </ul>
        </div>
      </section>

      {/* ════════ SECTION 6: SEARCH ════════ */}
      <section id="search" className="mb-20 scroll-mt-24">
        <SectionHeading num="006" title="Search" id="search" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="GET" />
          <code className="font-mono text-[15px] text-white/90">/api/knowledge-base/search</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Search your Knowledge Base using PostgreSQL full-text search. Results
          are ranked by relevance using <code className="font-mono text-white/90">ts_rank</code>.
        </p>

        <h3 className="text-white font-semibold mb-3">Query Parameters</h3>
        <ParamTable
          params={[
            {
              name: "q",
              type: "string",
              required: true,
              description: "Search query. Minimum 2 characters.",
            },
          ]}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">Example</h3>
        <CodeBlock language="bash" code={CURL_SEARCH} />

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <CodeBlock
          language="json"
          code={`{
  "results": [
    {
      "id": "chunk-uuid",
      "content": "To reset your password, go to Settings > Account > Change Password...",
      "chunkIndex": 5,
      "documentId": "doc-uuid",
      "documentName": "product-docs.pdf",
      "rank": 0.0892
    }
  ]
}`}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">Result Fields</h3>
        <ParamTable
          params={[
            { name: "id", type: "uuid", required: true, description: "Unique chunk identifier." },
            { name: "content", type: "string", required: true, description: "The text content of the matched chunk." },
            { name: "chunkIndex", type: "number", required: true, description: "Position of this chunk within the document (0-indexed)." },
            { name: "documentId", type: "uuid", required: true, description: "ID of the parent document." },
            { name: "documentName", type: "string", required: true, description: "Name of the parent document." },
            { name: "rank", type: "number", required: true, description: "Relevance score from PostgreSQL ts_rank. Higher is more relevant." },
          ]}
        />

        <div className="mt-4">
          <Callout type="info">
            Search uses PostgreSQL&apos;s <code className="font-mono text-white/70">tsvector</code> +{" "}
            <code className="font-mono text-white/70">GIN index</code> for fast full-text search.
            Maximum 20 results per query.
          </Callout>
        </div>
      </section>

      {/* ════════ SECTION 7: DELETE DOCUMENT ════════ */}
      <section id="delete-document" className="mb-20 scroll-mt-24">
        <SectionHeading num="007" title="Delete Document" id="delete-document" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="DELETE" />
          <code className="font-mono text-[15px] text-white/90">/api/knowledge-base/{"{id}"}</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Permanently delete a document and all its indexed chunks. If the document
          was uploaded as a file, the stored file is also removed.
        </p>

        <h3 className="text-white font-semibold mb-3">Example</h3>
        <CodeBlock language="bash" code={CURL_DELETE} />

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <CodeBlock language="json" code={`{ "success": true }`} />

        <div className="mt-4">
          <h4 className="text-white/80 text-sm font-semibold mb-2">Cascading Cleanup</h4>
          <div className="space-y-2 text-[13px] text-white/60">
            {[
              "Storage file removed from Supabase Storage (if uploaded)",
              "All text chunks deleted from kb_chunks table",
              "Document record deleted from kb_documents table",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="font-mono text-[11px] text-primary/60 mt-0.5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SECTION 8: REINDEX ════════ */}
      <section id="reindex" className="mb-20 scroll-mt-24">
        <SectionHeading num="008" title="Reindex" id="reindex" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="POST" />
          <code className="font-mono text-[15px] text-white/90">/api/knowledge-base/{"{id}"}/reindex</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Re-process a document: re-fetch the URL or re-download the file,
          delete existing chunks, and create new ones. Useful when source
          content has changed.
        </p>

        <h3 className="text-white font-semibold mb-3">Example</h3>
        <CodeBlock language="bash" code={CURL_REINDEX} />

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "chunkCount": 45
}`}
        />

        <div className="mt-4">
          <Callout type="info">
            During reindexing, the document status is set to{" "}
            <code className="font-mono text-white/70">processing</code>. It returns
            to <code className="font-mono text-white/70">indexed</code> on success or{" "}
            <code className="font-mono text-white/70">error</code> on failure.
            URL documents are re-fetched from the original source URL.
          </Callout>
        </div>
      </section>

      {/* ════════ SECTION 9: CHUNKING ════════ */}
      <section id="chunking" className="mb-20 scroll-mt-24">
        <SectionHeading num="009" title="Chunking Algorithm" id="chunking" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Documents are split into searchable chunks using a paragraph-based
          algorithm with overlap for context continuity. CSV files use a
          special row-based strategy.
        </p>

        <h3 className="text-white font-semibold mb-3">Text Chunking (PDF, TXT, MD)</h3>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {[
            { label: "Max Chunk Size", value: "2,000 chars" },
            { label: "Overlap", value: "200 chars" },
            { label: "Min Chunk Size", value: "10 chars" },
          ].map((item) => (
            <div key={item.label} className="border border-white/10 p-3 bg-white/[0.01]">
              <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-1">
                {item.label}
              </div>
              <span className="font-mono text-[13px] text-white/70">{item.value}</span>
            </div>
          ))}
        </div>

        <CodeBlock language="text" code={CHUNKING_PSEUDO} filename="Pseudocode — Text Chunking" />

        <h3 className="text-white font-semibold mb-3 mt-8">CSV Chunking</h3>
        <p className="text-white/50 text-[13px] mb-4">
          CSV files are chunked differently: each chunk includes the header row
          for context, followed by as many data rows as fit within the 2,000
          character limit.
        </p>
        <CodeBlock language="text" code={CSV_CHUNKING_PSEUDO} filename="Pseudocode — CSV Chunking" />

        <div className="mt-4">
          <Callout type="tip">
            The 200-character overlap ensures that sentences split across chunk
            boundaries still appear in at least one complete chunk, improving
            search accuracy.
          </Callout>
        </div>
      </section>

      {/* ════════ SECTION 10: CHAT INTEGRATION ════════ */}
      <section id="chat-integration" className="mb-20 scroll-mt-24">
        <SectionHeading num="010" title="Chat Integration" id="chat-integration" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          The Knowledge Base integrates automatically with the{" "}
          <Link href="/docs" className="text-primary hover:underline">Chat API</Link>.
          When a user sends a message, the system decides whether to search your
          KB and inject relevant context.
        </p>

        <h3 className="text-white font-semibold mb-4">Auto-Search Rules</h3>
        <div className="border border-white/10 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                  Condition
                </th>
                <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                  Threshold
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Minimum message length</td>
                <td className="px-4 py-3 font-mono text-white/90">20 characters</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Minimum word count</td>
                <td className="px-4 py-3 font-mono text-white/90">3 words</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Max chunks injected</td>
                <td className="px-4 py-3 font-mono text-white/90">Top 3 by relevance</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white/70">On KB failure</td>
                <td className="px-4 py-3 font-mono text-white/90">Fail silently (chat continues)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-white font-semibold mb-3">How Context Injection Works</h3>
        <div className="space-y-3 mb-6">
          {[
            "User sends a message via the Chat API",
            "If message meets length/word thresholds, KB search runs automatically",
            "Top 3 most relevant chunks (by ts_rank) are retrieved",
            "Chunks are prepended to the system prompt as context",
            "Agent generates a response using both the context and its own knowledge",
            "If KB search fails or returns nothing, the agent responds normally",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-[11px] text-primary/60 mt-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-white/60 text-[13px]">{step}</p>
            </div>
          ))}
        </div>

        <Callout type="tip">
          Short messages like &quot;hi&quot; or &quot;thanks&quot; skip KB search entirely for
          faster responses. This is intentional — greetings don&apos;t need
          document context.
        </Callout>
      </section>

      {/* ════════ SECTION 11: LIMITS ════════ */}
      <section id="limits" className="mb-20 scroll-mt-24">
        <SectionHeading num="011" title="Limits & Quotas" id="limits" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Knowledge Base resources and rate limits for Pro plan accounts.
        </p>

        <h3 className="text-white font-semibold mb-3">Storage Limits</h3>
        <div className="border border-white/10 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                  Limit
                </th>
                <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Max file size (single)</td>
                <td className="px-4 py-3 font-mono text-white/90">10 MB</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Total storage per account</td>
                <td className="px-4 py-3 font-mono text-white/90">100 MB</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Chunk size</td>
                <td className="px-4 py-3 font-mono text-white/90">2,000 characters max</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Chunk overlap</td>
                <td className="px-4 py-3 font-mono text-white/90">200 characters</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white/70">Search results per query</td>
                <td className="px-4 py-3 font-mono text-white/90">20 max</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-white font-semibold mb-3">Rate Limits</h3>
        <div className="border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                  Endpoint
                </th>
                <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                  Limit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-white/70 text-[13px]">GET /api/knowledge-base</td>
                <td className="px-4 py-3 font-mono text-white/90">30/min</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-white/70 text-[13px]">POST /upload</td>
                <td className="px-4 py-3 font-mono text-white/90">10/min</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-white/70 text-[13px]">POST /url</td>
                <td className="px-4 py-3 font-mono text-white/90">5/min</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-white/70 text-[13px]">GET /search</td>
                <td className="px-4 py-3 font-mono text-white/90">20/min</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-white/70 text-[13px]">DELETE /[id]</td>
                <td className="px-4 py-3 font-mono text-white/90">20/min</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-white/70 text-[13px]">POST /[id]/reindex</td>
                <td className="px-4 py-3 font-mono text-white/90">5/min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ════════ SECTION 12: ERRORS ════════ */}
      <section id="errors" className="mb-20 scroll-mt-24">
        <SectionHeading num="012" title="Error Reference" id="errors" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          All Knowledge Base endpoints return JSON errors in the format{" "}
          <code className="font-mono text-[13px] text-white/90">{`{ "error": "message" }`}</code>.
        </p>

        <div className="border border-white/10 overflow-hidden">
          {[
            { code: 400, title: "Bad Request", examples: [
              '"No file provided"',
              '"Unsupported file type. Use PDF, TXT, MD, or CSV."',
              '"File too large. Maximum 10 MB."',
              '"Storage limit reached (100 MB). Delete some documents first."',
              '"Valid URL is required"',
              '"URL must point to a public website"',
              '"Failed to fetch URL: 404"',
              '"No useful text content found at URL"',
              '"URL took too long to respond"',
              '"Query must be at least 2 characters"',
            ]},
            { code: 401, title: "Unauthorized", examples: ['"Unauthorized"'] },
            { code: 403, title: "Forbidden", examples: ['"Pro plan required"'] },
            { code: 404, title: "Not Found", examples: ['"Document not found"'] },
            { code: 422, title: "Unprocessable Entity", examples: ['"No text content found in file"'] },
            { code: 429, title: "Too Many Requests", examples: ['"Too many requests"'] },
            { code: 500, title: "Server Error", examples: [
              '"Failed to create document"',
              '"Failed to upload file"',
              '"Failed to process document"',
              '"Failed to fetch documents"',
              '"Failed to delete document"',
              '"Search failed"',
            ]},
          ].map((err) => (
            <div
              key={err.code}
              className="border-b border-white/[0.06] last:border-0 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge code={err.code} />
                <span className="font-semibold text-white text-sm">{err.title}</span>
              </div>
              <div className="space-y-1">
                {err.examples.map((ex, i) => (
                  <code key={i} className="block font-mono text-[12px] text-white/40">
                    {`{ "error": ${ex} }`}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <div className="border-t border-white/[0.06] pt-8 mt-12">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-white/20">
            ClawHQ Knowledge Base API
          </span>
          <span className="font-mono text-[10px] text-white/20">
            Last updated: March 2026
          </span>
        </div>
      </div>
    </DocsSidebar>
  );
}
