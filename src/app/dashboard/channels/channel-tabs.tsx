"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelManager } from "@/components/dashboard/channel-manager";
import { ChannelAnalytics } from "@/components/dashboard/channel-analytics";
import { AutoResponsesManager } from "@/components/dashboard/auto-responses-manager";
import { BusinessHoursConfig } from "@/components/dashboard/business-hours-config";

export function ChannelsTabs({ channels }: { channels: any[] }) {
  return (
    <Tabs defaultValue="channels">
      <TabsList className="mb-6">
        <TabsTrigger value="channels">Channels</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="auto-responses">Auto-Responses</TabsTrigger>
        <TabsTrigger value="business-hours">Business Hours</TabsTrigger>
      </TabsList>
      <TabsContent value="channels">
        <ChannelManager channels={channels} />
      </TabsContent>
      <TabsContent value="analytics">
        <ChannelAnalytics />
      </TabsContent>
      <TabsContent value="auto-responses">
        <AutoResponsesManager />
      </TabsContent>
      <TabsContent value="business-hours">
        <BusinessHoursConfig />
      </TabsContent>
    </Tabs>
  );
}
