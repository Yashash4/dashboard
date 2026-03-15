"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageAnalytics } from "@/components/dashboard/usage-analytics";
import { ConversationFunnels } from "@/components/dashboard/conversation-funnels";
import { CsatDashboard } from "@/components/dashboard/csat-dashboard";
import { LiveDashboard } from "@/components/dashboard/live-dashboard";
import { IntentsDashboard } from "@/components/dashboard/intents-dashboard";

export function AnalyticsTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="funnels">Funnels</TabsTrigger>
        <TabsTrigger value="csat">CSAT</TabsTrigger>
        <TabsTrigger value="live">Live</TabsTrigger>
        <TabsTrigger value="intents">Intents</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <UsageAnalytics />
      </TabsContent>
      <TabsContent value="funnels">
        <ConversationFunnels />
      </TabsContent>
      <TabsContent value="csat">
        <CsatDashboard />
      </TabsContent>
      <TabsContent value="live">
        <LiveDashboard />
      </TabsContent>
      <TabsContent value="intents">
        <IntentsDashboard />
      </TabsContent>
    </Tabs>
  );
}
