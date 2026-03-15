"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Edit2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function KBChunkViewer() {
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [editingChunk, setEditingChunk] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch documents list
  const { data: docsData } = useQuery({
    queryKey: ["kb-documents"],
    queryFn: async () => {
      const res = await fetch("/api/knowledge-base");
      if (!res.ok) return { documents: [] };
      return res.json();
    },
  });
  const docs = docsData?.documents || [];

  // Fetch chunks for selected document
  const { data: chunksData, isLoading } = useQuery({
    queryKey: ["kb-chunks", selectedDoc],
    queryFn: async () => {
      if (!selectedDoc) return { chunks: [] };
      const res = await fetch(`/api/knowledge-base/chunks?document_id=${selectedDoc}`);
      if (!res.ok) return { chunks: [] };
      return res.json();
    },
    enabled: !!selectedDoc,
  });
  const chunks = chunksData?.chunks || [];

  const editMutation = useMutation({
    mutationFn: async ({ chunk_id, content }: { chunk_id: string; content: string }) => {
      const res = await fetch("/api/knowledge-base/chunks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunk_id, content }),
      });
      if (!res.ok) throw new Error("Failed to update chunk");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-chunks", selectedDoc] });
      setEditingChunk(null);
      toast.success("Chunk updated");
    },
    onError: () => toast.error("Failed to update chunk"),
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Select Document</label>
        <Select value={selectedDoc} onValueChange={setSelectedDoc}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Choose a document..." />
          </SelectTrigger>
          <SelectContent>
            {docs.map((doc: any) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.name} ({doc.chunk_count} chunks)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedDoc ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select a document to view its chunks</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : chunks.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No chunks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chunks.map((chunk: any) => (
            <Card key={chunk.id} className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      #{chunk.chunk_index}
                    </Badge>
                    {chunk.is_edited && (
                      <Badge variant="outline" className="text-[10px] text-yellow-400">edited</Badge>
                    )}
                  </div>
                  {editingChunk === chunk.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingChunk(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => editMutation.mutate({ chunk_id: chunk.id, content: editContent })} disabled={editMutation.isPending}>
                        {editMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => { setEditingChunk(chunk.id); setEditContent(chunk.content); }}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingChunk === chunk.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    className="w-full border border-input bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                    {chunk.content}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
