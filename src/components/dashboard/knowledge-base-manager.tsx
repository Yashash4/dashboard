"use client";

import { useState } from "react";
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

interface KBDocument {
  id: string;
  name: string;
  type: "pdf" | "txt" | "csv" | "url" | "md";
  size: string;
  chunks: number;
  status: "indexed" | "processing" | "error";
  uploadedAt: string;
  lastIndexed: string | null;
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

const MOCK_DOCS: KBDocument[] = [
  {
    id: "1",
    name: "Product FAQ.pdf",
    type: "pdf",
    size: "2.4 MB",
    chunks: 147,
    status: "indexed",
    uploadedAt: "2026-03-01",
    lastIndexed: "2026-03-07",
  },
  {
    id: "2",
    name: "Support Playbook.md",
    type: "md",
    size: "89 KB",
    chunks: 52,
    status: "indexed",
    uploadedAt: "2026-02-20",
    lastIndexed: "2026-03-05",
  },
  {
    id: "3",
    name: "Pricing Guide.txt",
    type: "txt",
    size: "12 KB",
    chunks: 8,
    status: "indexed",
    uploadedAt: "2026-03-04",
    lastIndexed: "2026-03-04",
  },
  {
    id: "4",
    name: "Return Policy.pdf",
    type: "pdf",
    size: "540 KB",
    chunks: 0,
    status: "processing",
    uploadedAt: "2026-03-07",
    lastIndexed: null,
  },
];

export function KnowledgeBaseManager() {
  const [docs, setDocs] = useState<KBDocument[]>(MOCK_DOCS);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const totalChunks = docs.reduce((s, d) => s + d.chunks, 0);
  const indexedCount = docs.filter((d) => d.status === "indexed").length;

  const filtered = docs.filter(
    (d) =>
      !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const newDoc: KBDocument = {
        id: Math.random().toString(36).slice(2, 8),
        name: uploadType === "url" ? urlInput : "New Document.pdf",
        type: uploadType === "url" ? "url" : "pdf",
        size: uploadType === "url" ? "-" : "1.2 MB",
        chunks: 0,
        status: "processing",
        uploadedAt: new Date().toISOString().slice(0, 10),
        lastIndexed: null,
      };
      setDocs((prev) => [newDoc, ...prev]);
      setUploading(false);
      setUploadOpen(false);
      setUrlInput("");
      toast.success("Document uploaded — indexing started");
    }, 1500);
  };

  const handleDelete = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document removed from knowledge base");
  };

  const handleReindex = (id: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "processing" as const } : d
      )
    );
    toast.success("Re-indexing started");
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{docs.length}</p>
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
                <p className="text-2xl font-bold">
                  {indexedCount}/{docs.length}
                </p>
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
                <p className="text-2xl font-bold">{totalChunks}</p>
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
                <p className="text-2xl font-bold">3.0 MB</p>
              </div>
              <HardDrive className="h-5 w-5 text-muted-foreground" />
            </div>
            <Progress value={3} className="mt-2 h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">
              3 MB / 100 MB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
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
                  onValueChange={(v) => setUploadType(v as "file" | "url")}
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
                <div className="border-2 border-dashed border-border p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, TXT, MD, CSV — max 10 MB
                  </p>
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
              <Button variant="outline" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || (uploadType === "url" && !urlInput)}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Uploading..." : "Upload & Index"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document list */}
      <Card className="border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No documents found</p>
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
                          <span>{doc.size}</span>
                          {doc.chunks > 0 && (
                            <>
                              <span>&middot;</span>
                              <span>{doc.chunks} chunks</span>
                            </>
                          )}
                          <span>&middot;</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
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
                      {doc.status === "indexed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleReindex(doc.id)}
                        >
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
                              onClick={() => handleDelete(doc.id)}
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
    </div>
  );
}
