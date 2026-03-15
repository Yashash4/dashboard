"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Search,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  File,
  FileSpreadsheet,
  Globe,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface KBDocument {
  id: string;
  name: string;
  type: "pdf" | "txt" | "csv" | "url" | "md";
  source_url: string | null;
  storage_path: string | null;
  file_size: number;
  chunk_count: number;
  retrieval_count: number;
  status: "indexed" | "processing" | "error" | "pending_embedding";
  error_message: string | null;
  indexed_at: string | null;
  created_at: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  txt: File,
  csv: FileSpreadsheet,
  url: Globe,
  md: FileText,
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  indexed: {
    label: "Indexed",
    icon: CheckCircle2,
    className: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  pending_embedding: {
    label: "Pending Embeddings",
    icon: Clock,
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  error: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

const STORAGE_LIMIT = 100 * 1024 * 1024; // 100 MB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fetchDocs(): Promise<{
  documents: KBDocument[];
  totalBytes: number;
}> {
  const res = await fetch("/api/knowledge-base");
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export function KnowledgeBaseManager() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"name" | "content">("name");
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["kb-documents"],
    queryFn: fetchDocs,
  });

  const docs = data?.documents || [];
  const totalBytes = data?.totalBytes || 0;
  const totalChunks = docs.reduce((s, d) => s + d.chunk_count, 0);
  const indexedCount = docs.filter((d) => d.status === "indexed").length;

  const filtered = docs.filter(
    (d) => !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleTestKB = async () => {
    if (!testQuery.trim()) return;
    setTestLoading(true);
    setTestResults(null);
    try {
      const res = await fetch(`/api/knowledge-base/search?q=${encodeURIComponent(testQuery)}&mode=content`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setTestResults(data.results || []);
    } catch {
      setTestResults([]);
    } finally {
      setTestLoading(false);
    }
  };

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/knowledge-base/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-documents"] });
      setUploadOpen(false);
      setSelectedFile(null);
      toast.success("Document uploaded and indexing started");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const uploadUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/knowledge-base/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch URL");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-documents"] });
      setUploadOpen(false);
      setUrlInput("");
      toast.success("URL crawled and indexed");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-documents"] });
      toast.success("Document removed from knowledge base");
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });

  const handleReindex = async (id: string) => {
    setReindexingId(id);
    try {
      const res = await fetch(`/api/knowledge-base/${id}/reindex`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Re-index failed");
      }
      queryClient.invalidateQueries({ queryKey: ["kb-documents"] });
      toast.success("Re-indexing complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-index failed");
    } finally {
      setReindexingId(null);
    }
  };

  const handleUpload = () => {
    if (uploadType === "file" && selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    } else if (uploadType === "url" && urlInput) {
      uploadUrlMutation.mutate(urlInput);
    }
  };

  const isUploading =
    uploadFileMutation.isPending || uploadUrlMutation.isPending;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  if (error) {
    return (
      <Card className="border-border">
        <CardContent className="py-12 text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Failed to load knowledge base</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["kb-documents"] })
            }
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Documents</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{docs.length}</p>
                )}
              </div>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Indexed</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {indexedCount}/{docs.length}
                  </p>
                )}
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Chunks</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{totalChunks}</p>
                )}
              </div>
              <HardDrive className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Storage Used</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {formatBytes(totalBytes)}
                  </p>
                )}
              </div>
              <HardDrive className="h-5 w-5 text-muted-foreground" />
            </div>
            {!isLoading && (
              <>
                <Progress
                  value={(totalBytes / STORAGE_LIMIT) * 100}
                  className="mt-2 h-1.5"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatBytes(totalBytes)} / {formatBytes(STORAGE_LIMIT)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchMode === "name" ? "Search by document name..." : "Search document content..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={searchMode} onValueChange={(v) => setSearchMode(v as "name" | "content")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Search by name</SelectItem>
            <SelectItem value="content">Search content</SelectItem>
          </SelectContent>
        </Select>
        <Dialog
          open={uploadOpen}
          onOpenChange={(open) => {
            setUploadOpen(open);
            if (!open) {
              setSelectedFile(null);
              setUrlInput("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Knowledge Base</DialogTitle>
              <DialogDescription>
                Upload a file or add a URL. Documents are chunked and indexed
                for your agents to reference.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Source Type
                </label>
                <Select
                  value={uploadType}
                  onValueChange={(v) => {
                    setUploadType(v as "file" | "url");
                    setSelectedFile(null);
                    setUrlInput("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">File Upload</SelectItem>
                    <SelectItem value="url">Web URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {uploadType === "file" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div
                    className="border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <>
                        <FileText className="h-8 w-8 mx-auto mb-3 text-primary" />
                        <p className="text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBytes(selectedFile.size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to select a file
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, TXT, MD, CSV — max 10 MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    URL
                  </label>
                  <Input
                    placeholder="https://docs.example.com/faq"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Page content will be crawled and indexed
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={
                  isUploading ||
                  (uploadType === "file" && !selectedFile) ||
                  (uploadType === "url" && !urlInput)
                }
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Processing..." : "Upload & Index"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document list */}
      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-10 w-10 shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {search ? "No documents match your search" : "No documents yet"}
              </p>
              {!search && (
                <p className="text-xs mt-1">
                  Upload documents so your agents can reference them
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((doc) => {
                const FileIcon = FILE_ICONS[doc.type] || File;
                const statusCfg = STATUS_CONFIG[doc.status];
                const StatusIcon = statusCfg.icon;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-muted/50 flex items-center justify-center shrink-0">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="uppercase font-mono">
                            {doc.type}
                          </span>
                          <span>&middot;</span>
                          <span>{formatBytes(doc.file_size)}</span>
                          {doc.chunk_count > 0 && (
                            <>
                              <span>&middot;</span>
                              <span>{doc.chunk_count} chunks</span>
                            </>
                          )}
                          {doc.retrieval_count > 0 && (
                            <>
                              <span>&middot;</span>
                              <span className="text-green-400">Referenced {doc.retrieval_count}x in chat</span>
                            </>
                          )}
                          <span>&middot;</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {doc.error_message && (
                          <p className="text-xs text-red-400 mt-1">
                            {doc.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusCfg.className}`}
                      >
                        <StatusIcon
                          className={`h-2.5 w-2.5 mr-1 ${doc.status === "processing" ? "animate-spin" : ""}`}
                        />
                        {statusCfg.label}
                      </Badge>
                      {(doc.status === "indexed" || doc.status === "error") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleReindex(doc.id)}
                          disabled={reindexingId === doc.id}
                        >
                          {reindexingId === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          )}
                          Re-index
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove Document?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove &quot;{doc.name}&quot; and all
                              its indexed chunks. Agents will no longer be able
                              to reference this document.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(doc.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Your KB */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Test Your Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Type a question to see which documents your agents would reference. Uses vector similarity search when available.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. How do I get a refund?"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTestKB()}
            />
            <Button
              onClick={handleTestKB}
              disabled={testLoading || !testQuery.trim()}
            >
              {testLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          {testResults !== null && (
            <div className="space-y-2">
              {testResults.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No matching content found. Try uploading more documents or rephrasing your query.
                </p>
              ) : (
                testResults.map((r: any, i: number) => (
                  <div key={i} className="border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{r.documentName}</span>
                      {r.similarity != null && (
                        <Badge variant="outline" className="text-[10px]">
                          {Math.round(r.similarity * 100)}% match
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-4">{r.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
