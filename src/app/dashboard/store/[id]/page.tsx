import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Check, Tag, Sparkles, Plus, ShoppingCart } from "lucide-react";

import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentDetailActions } from "./actions";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, description, category, price, is_premium, is_active, config_files")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!agent) notFound();

  const { data: ownership } = await supabase
    .from("user_agents")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", id)
    .single();

  const isOwned = !!ownership;
  const price = Number(agent.price) || 0;
  const isFree = price === 0;
  const configFiles = (agent.config_files || {}) as Record<string, string>;

  // Extract tools from TOOLS.md if it exists
  const toolsList = configFiles["TOOLS.md"]
    ? configFiles["TOOLS.md"].split("\n").filter((l: string) => l.trim().startsWith("-")).map((l: string) => l.replace(/^-\s*/, "").trim())
    : [];

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/store">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Store
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                {agent.is_premium ? (
                  <Badge className="bg-primary/15 text-primary border-primary/30">
                    <Sparkles className="mr-1 h-3 w-3" />Premium
                  </Badge>
                ) : isFree ? (
                  <Badge className="bg-[color-mix(in_srgb,var(--success),transparent_85%)] text-[var(--success)] border-[color-mix(in_srgb,var(--success),transparent_70%)]">
                    Free — Limited Time
                  </Badge>
                ) : null}
              </div>
              {agent.category && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="capitalize">{agent.category}</span>
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {agent.description || "No description available."}
                  </p>
                  {configFiles["SOUL.md"] && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold mb-2">Agent Personality</h3>
                      <div className="bg-muted/50 border border-border p-4 text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto font-mono text-xs">
                        {configFiles["SOUL.md"].slice(0, 2000)}
                        {configFiles["SOUL.md"].length > 2000 && "\n\n... (truncated)"}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="capabilities" className="mt-4">
              <Card className="border-border">
                <CardContent className="pt-6">
                  {toolsList.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Tools & Capabilities</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {toolsList.map((tool: string) => (
                          <div key={tool} className="flex items-center gap-2 p-2 border border-border">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-sm capitalize">{tool.replace(/_/g, " ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Capability information not available for this agent.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="setup" className="mt-4">
              <Card className="border-border">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                    <div>
                      <p className="text-sm font-medium">Add to Library</p>
                      <p className="text-xs text-muted-foreground">Click the button on the right to add this agent.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                    <div>
                      <p className="text-sm font-medium">Deploy</p>
                      <p className="text-xs text-muted-foreground">Go to My Agents and click Deploy to install on your VPS.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                    <div>
                      <p className="text-sm font-medium">Chat</p>
                      <p className="text-xs text-muted-foreground">Open Chat to start talking with your deployed agent.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="border-border sticky top-6">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {isFree ? (
                    <span className="text-[var(--success)]">Free</span>
                  ) : (
                    <span className="text-primary">Premium</span>
                  )}
                </p>
              </div>

              <AgentDetailActions
                agentId={agent.id}
                agentName={agent.name}
                isOwned={isOwned}
                isFree={isFree}
                price={price}
              />

              {isOwned && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/agents">View in My Agents</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
