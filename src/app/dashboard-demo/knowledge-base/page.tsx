"use client";

import { useState } from "react";
import {
  BookOpen,
  Upload,
  FileText,
  Search,
  Clock,
  CheckCircle2,
  File,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Link2,
  Database,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEMO_DOCUMENTS = [
  {
    id: "1",
    name: "Product FAQ.pdf",
    type: "pdf" as const,
    file_size: 245760,
    chunk_count: 48,
    retrieval_count: 342,
    status: "indexed" as const,
    indexed_at: "2026-03-18T10:30:00Z",
    created_at: "2026-03-18T10:28:00Z",
  },
  {
    id: "2",
    name: "API Documentation.md",
    type: "md" as const,
    file_size: 89600,
    chunk_count: 32,
    retrieval_count: 187,
    status: "indexed" as const,
    indexed_at: "2026-03-15T14:20:00Z",
    created_at: "2026-03-15T14:18:00Z",
  },
  {
    id: "3",
    name: "Customer Data Export.csv",
    type: "csv" as const,
    file_size: 512000,
    chunk_count: 156,
    retrieval_count: 89,
    status: "indexed" as const,
    indexed_at: "2026-03-20T09:15:00Z",
    created_at: "2026-03-20T09:12:00Z",
  },
  {
    id: "4",
    name: "Company Policies.txt",
    type: "txt" as const,
    file_size: 34816,
    chunk_count: 12,
    retrieval_count: 421,
    status: "indexed" as const,
    indexed_at: "2026-03-10T16:45:00Z",
    created_at: "2026-03-10T16:44:00Z",
  },
  {
    id: "5",
    name: "https://docs.example.com",
    type: "url" as const,
    file_size: 156672,
    chunk_count: 64,
    retrieval_count: 56,
    status: "indexed" as const,
    indexed_at: "2026-03-21T11:00:00Z",
    created_at: "2026-03-21T10:55:00Z",
  },
];

const DEMO_CHUNKS = [
  { id: "c1", document: "Product FAQ.pdf", content: "Q: How do I reset my password? A: Navigate to Settings > Account > Change Password...", similarity: 0.94 },
  { id: "c2", document: "Product FAQ.pdf", content: "Q: What payment methods do you accept? A: We accept all major credit cards, PayPal...", similarity: 0.88 },
  { id: "c3", document: "API Documentation.md", content: "## Authentication\nAll API requests require a Bearer token in the Authorization header...", similarity: 0.92 },
  { id: "c4", document: "Company Policies.txt", content: "Refund Policy: Customers may request a full refund within 30 days of purchase...", similarity: 0.85 },
];

const DEMO_CONNECTORS = [
  { name: "Notion", status: "connected", docs: 12, icon: "N" },
  { name: "Google Drive", status: "connected", docs: 8, icon: "G" },
  { name: "Confluence", status: "available", docs: 0, icon: "C" },
  { name: "GitHub", status: "available", docs: 0, icon: "GH" },
];

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  txt: File,
  csv: FileSpreadsheet,
  url: Globe,
  md: FileText,
};

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  indexed: { badge: "bg-green-500/15 text-green-400 border-green-500/30", label: "Indexed" },
  processing: { badge: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Processing" },
  error: { badge: "bg-red-500/15 text-red-400 border-red-500/30", label: "Error" },
  pending_embedding: { badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Pending" },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBaseDemoPage() {
  const [search, setSearch] = useState("");

  const filteredDocs = DEMO_DOCUMENTS.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalChunks = DEMO_DOCUMENTS.reduce((s, d) => s + d.chunk_count, 0);
  const totalRetrievals = DEMO_DOCUMENTS.reduce((s, d) => s + d.retrieval_count, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Knowledge Base</h1>
      <p className="text-muted-foreground mb-6">
        Upload documents for your agents to reference.
      </p>

      <Tabs defaultValue="documents">
        <TabsList className="mb-6">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="chunks">Chunks</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Documents</span>
                  <p className="text-xl font-bold font-mono">{DEMO_DOCUMENTS.length}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Total Chunks</span>
                  <p className="text-xl font-bold font-mono">{totalChunks}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Total Retrievals</span>
                  <p className="text-xl font-bold font-mono">{totalRetrievals.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Search & Upload */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button disabled>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>

            {/* Document list */}
            <Card className="border-border">
              <CardContent className="p-0 divide-y divide-border">
                {filteredDocs.map((doc) => {
                  const Icon = FILE_ICONS[doc.type] || File;
                  const status = STATUS_CONFIG[doc.status];
                  return (
                    <div key={doc.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-muted/50 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{doc.name}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatSize(doc.file_size)}</span>
                            <span>&middot;</span>
                            <span>{doc.chunk_count} chunks</span>
                            <span>&middot;</span>
                            <span>{doc.retrieval_count} retrievals</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${status.badge}`}>
                        {status.label}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chunks">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Chunks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_CHUNKS.map((chunk) => (
                <div key={chunk.id} className="p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-mono">{chunk.document}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {(chunk.similarity * 100).toFixed(0)}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-2">{chunk.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectors">
          <div className="space-y-4">
            {DEMO_CONNECTORS.map((conn) => (
              <Card key={conn.name} className="border-border">
                <CardContent className="flex items-center justify-between py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted/50 flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {conn.icon}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{conn.name}</span>
                      {conn.status === "connected" && (
                        <p className="text-xs text-muted-foreground">{conn.docs} documents synced</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      conn.status === "connected"
                        ? "bg-green-500/15 text-green-400 border-green-500/30"
                        : ""
                    }`}
                  >
                    {conn.status === "connected" ? "Connected" : "Available"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
