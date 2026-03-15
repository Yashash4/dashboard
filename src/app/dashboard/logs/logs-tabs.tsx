"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogsExplorer } from "@/components/dashboard/logs-explorer";
import { LogSavedViews } from "@/components/dashboard/log-saved-views";
import { LogPatterns } from "@/components/dashboard/log-patterns";
import { LogAlerts } from "@/components/dashboard/log-alerts";

export function LogsTabs() {
  return (
    <Tabs defaultValue="explorer">
      <TabsList className="mb-6">
        <TabsTrigger value="explorer">Explorer</TabsTrigger>
        <TabsTrigger value="saved">Saved Views</TabsTrigger>
        <TabsTrigger value="patterns">Patterns</TabsTrigger>
        <TabsTrigger value="alerts">Alerts</TabsTrigger>
      </TabsList>
      <TabsContent value="explorer">
        <LogsExplorer />
      </TabsContent>
      <TabsContent value="saved">
        <LogSavedViews />
      </TabsContent>
      <TabsContent value="patterns">
        <LogPatterns />
      </TabsContent>
      <TabsContent value="alerts">
        <LogAlerts />
      </TabsContent>
    </Tabs>
  );
}
