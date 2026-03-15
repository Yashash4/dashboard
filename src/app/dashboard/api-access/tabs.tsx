"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiAccessManager } from "@/components/dashboard/api-access-manager";
import { ApiPlayground } from "@/components/dashboard/api-playground";

export function ApiAccessTabs({ hostname }: { hostname: string | null }) {
  return (
    <Tabs defaultValue="keys">
      <TabsList className="mb-6">
        <TabsTrigger value="keys">Keys & Examples</TabsTrigger>
        <TabsTrigger value="docs">API Docs & Playground</TabsTrigger>
      </TabsList>
      <TabsContent value="keys">
        <ApiAccessManager hostname={hostname} />
      </TabsContent>
      <TabsContent value="docs">
        <ApiPlayground />
      </TabsContent>
    </Tabs>
  );
}
