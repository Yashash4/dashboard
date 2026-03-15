"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeBaseManager } from "@/components/dashboard/knowledge-base-manager";
import { KBChunkViewer } from "@/components/dashboard/kb-chunk-viewer";
import { KBConnectors } from "@/components/dashboard/kb-connectors";

export function KBTabs() {
  return (
    <Tabs defaultValue="documents">
      <TabsList className="mb-6">
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="chunks">Chunks</TabsTrigger>
        <TabsTrigger value="connectors">Connectors</TabsTrigger>
      </TabsList>
      <TabsContent value="documents">
        <KnowledgeBaseManager />
      </TabsContent>
      <TabsContent value="chunks">
        <KBChunkViewer />
      </TabsContent>
      <TabsContent value="connectors">
        <KBConnectors />
      </TabsContent>
    </Tabs>
  );
}
