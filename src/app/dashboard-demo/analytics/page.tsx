"use client";

import { useState } from "react";
import {
  MessageSquare,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Timer,
  Users,
  BarChart3,
  Activity,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEMO_STATS = [
  { label: "Total Conversations", value: "2,847", change: "+12%", up: true, icon: MessageSquare },
  { label: "Avg Response Time", value: "1.8s", change: "-15%", up: true, icon: Clock },
  { label: "Resolution Rate", value: "94.2%", change: "+3.1%", up: true, icon: TrendingUp },
  { label: "Avg Session Duration", value: "4m 32s", change: "+8%", up: false, icon: Timer },
];

const DEMO_DAILY_DATA = [
  { date: "Mar 8", conversations: 78, tokens: 45200 },
  { date: "Mar 9", conversations: 92, tokens: 52100 },
  { date: "Mar 10", conversations: 85, tokens: 48300 },
  { date: "Mar 11", conversations: 110, tokens: 61200 },
  { date: "Mar 12", conversations: 95, tokens: 53400 },
  { date: "Mar 13", conversations: 88, tokens: 49800 },
  { date: "Mar 14", conversations: 102, tokens: 57600 },
  { date: "Mar 15", conversations: 115, tokens: 64200 },
  { date: "Mar 16", conversations: 98, tokens: 55100 },
  { date: "Mar 17", conversations: 120, tokens: 67800 },
  { date: "Mar 18", conversations: 105, tokens: 59400 },
  { date: "Mar 19", conversations: 130, tokens: 73200 },
  { date: "Mar 20", conversations: 112, tokens: 63100 },
  { date: "Mar 21", conversations: 125, tokens: 70500 },
];

const DEMO_AGENTS_BREAKDOWN = [
  { name: "support-bot", conversations: 1240, pct: 43.5 },
  { name: "research-bot", conversations: 820, pct: 28.8 },
  { name: "sales-agent", conversations: 510, pct: 17.9 },
  { name: "onboarding", conversations: 277, pct: 9.7 },
];

const DEMO_FUNNEL_STEPS = [
  { step: "Page Visit", count: 5000, pct: 100 },
  { step: "Chat Started", count: 2847, pct: 56.9 },
  { step: "Query Resolved", count: 2680, pct: 53.6 },
  { step: "Satisfied (CSAT 4+)", count: 2412, pct: 48.2 },
];

const DEMO_INTENTS = [
  { intent: "Password Reset", count: 342, pct: 12.0 },
  { intent: "Billing Question", count: 298, pct: 10.5 },
  { intent: "Feature Request", count: 267, pct: 9.4 },
  { intent: "Bug Report", count: 231, pct: 8.1 },
  { intent: "Account Setup", count: 198, pct: 7.0 },
  { intent: "General Inquiry", count: 1511, pct: 53.1 },
];

export default function AnalyticsDemoPage() {
  const [timeRange, setTimeRange] = useState("30");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Usage Analytics</h1>
      <p className="text-muted-foreground mb-6">
        Track conversations, performance metrics, and insights.
      </p>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
          <TabsTrigger value="csat">CSAT</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="intents">Intents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Time range selector */}
            <div className="flex justify-end">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="border-border">
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xl font-bold font-mono">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className={`h-3 w-3 ${stat.up ? "text-green-500" : "text-red-500"}`} />
                        <span className={`text-xs ${stat.up ? "text-green-500" : "text-red-500"}`}>
                          {stat.change}
                        </span>
                        <span className="text-xs text-muted-foreground">vs prev period</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Chart placeholder */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversations Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-end gap-1">
                  {DEMO_DAILY_DATA.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/30 hover:bg-primary/50 transition-colors rounded-t"
                        style={{ height: `${(d.conversations / 130) * 200}px` }}
                        title={`${d.date}: ${d.conversations} conversations`}
                      />
                      <span className="text-[9px] text-muted-foreground">{d.date.split(" ")[1]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Agent breakdown */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Agent Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEMO_AGENTS_BREAKDOWN.map((agent) => (
                    <div key={agent.name} className="flex items-center gap-3">
                      <span className="text-sm font-mono w-32 truncate">{agent.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${agent.pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right">{agent.conversations} ({agent.pct}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnels">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversation Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DEMO_FUNNEL_STEPS.map((step, i) => (
                  <div key={step.step} className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{step.step}</span>
                        <span className="text-xs text-muted-foreground">{step.count.toLocaleString()} ({step.pct}%)</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${step.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csat">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Avg CSAT</span>
                  <p className="text-2xl font-bold font-mono text-green-500">4.6</p>
                  <span className="text-xs text-muted-foreground">out of 5.0</span>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Total Ratings</span>
                  <p className="text-2xl font-bold font-mono">1,847</p>
                  <span className="text-xs text-muted-foreground">last 30 days</span>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Response Rate</span>
                  <p className="text-2xl font-bold font-mono">64.9%</p>
                  <span className="text-xs text-muted-foreground">of conversations rated</span>
                </CardContent>
              </Card>
            </div>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { stars: 5, count: 980, pct: 53 },
                    { stars: 4, count: 462, pct: 25 },
                    { stars: 3, count: 221, pct: 12 },
                    { stars: 2, count: 111, pct: 6 },
                    { stars: 1, count: 73, pct: 4 },
                  ].map((r) => (
                    <div key={r.stars} className="flex items-center gap-3">
                      <span className="text-sm w-12">{r.stars} star</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500/60 rounded-full" style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">{r.count} ({r.pct}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Active Now</span>
                  <p className="text-2xl font-bold font-mono text-green-500">12</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Today Total</span>
                  <p className="text-2xl font-bold font-mono">125</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <span className="text-xs text-muted-foreground">Avg Wait</span>
                  <p className="text-2xl font-bold font-mono">0.3s</p>
                </CardContent>
              </Card>
            </div>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { agent: "support-bot", user: "user_38a1", duration: "2m 15s", messages: 4 },
                    { agent: "support-bot", user: "user_91c4", duration: "5m 02s", messages: 8 },
                    { agent: "research-bot", user: "user_72bf", duration: "1m 30s", messages: 3 },
                    { agent: "sales-agent", user: "user_44de", duration: "3m 45s", messages: 6 },
                  ].map((c) => (
                    <div key={c.user} className="flex items-center justify-between p-2 border border-border/50">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-mono">{c.agent}</span>
                        <span className="text-xs text-muted-foreground">{c.user}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{c.messages} msgs</span>
                        <span>{c.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="intents">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Detected Intents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DEMO_INTENTS.map((intent) => (
                  <div key={intent.intent} className="flex items-center gap-3">
                    <span className="text-sm w-40 truncate">{intent.intent}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/50 rounded-full" style={{ width: `${intent.pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-24 text-right">{intent.count} ({intent.pct}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
