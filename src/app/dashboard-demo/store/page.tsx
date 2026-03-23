"use client";

import { useState } from "react";
import {
  Bot,
  Check,
  ShoppingCart,
  Plus,
  Tag,
  Sparkles,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEMO_STORE_AGENTS = [
  { id: "a-1", name: "Support Agent", description: "Handles customer support queries across all channels with intelligent routing and escalation.", category: "support", price: 0, is_premium: false },
  { id: "a-2", name: "Research Agent", description: "Gathers and synthesizes information from multiple sources for comprehensive research.", category: "research", price: 0, is_premium: false },
  { id: "a-3", name: "Sales Agent", description: "Engages leads, qualifies prospects, and manages sales conversations automatically.", category: "sales", price: 0, is_premium: false },
  { id: "a-4", name: "Writer Agent", description: "Creates blog posts, emails, marketing copy, and other written content.", category: "content", price: 0, is_premium: false },
  { id: "a-5", name: "Data Analyst", description: "Analyzes datasets and generates detailed insights, charts, and reports.", category: "analytics", price: 0, is_premium: false },
  { id: "a-6", name: "Code Reviewer", description: "Reviews code changes, suggests improvements, and catches bugs before deployment.", category: "engineering", price: 29, is_premium: true },
  { id: "a-7", name: "Project Manager", description: "Coordinates tasks, tracks progress, and manages team workflows.", category: "operations", price: 49, is_premium: true },
];

const OWNED_IDS = new Set(["a-1", "a-2", "a-3", "a-4", "a-5"]);

export default function DemoStorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [filterTab, setFilterTab] = useState<"all" | "free" | "premium">("all");

  const categories = [
    "all",
    ...Array.from(new Set(DEMO_STORE_AGENTS.map((a) => a.category).filter(Boolean))),
  ];

  const searchLower = search.toLowerCase().trim();
  const filtered = DEMO_STORE_AGENTS
    .filter((a) => activeCategory === "all" || a.category === activeCategory)
    .filter((a) => filterTab === "all" || (filterTab === "free" ? Number(a.price) === 0 : a.is_premium))
    .filter((a) => !searchLower || a.name.toLowerCase().includes(searchLower) || a.description?.toLowerCase().includes(searchLower) || a.category?.toLowerCase().includes(searchLower))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price") return Number(a.price) - Number(b.price);
      return 0;
    });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Agent Store</h1>
      <p className="text-muted-foreground mb-6">
        Browse and add agents to your library.
      </p>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents..."
          className="w-full max-w-sm bg-transparent border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filter tabs + Sort */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {(["all", "free", "premium"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                filterTab === tab
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {tab === "all" ? "All" : tab === "free" ? "Free" : "Premium"}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "price")}
          className="text-xs bg-transparent border border-border px-2 py-1 text-muted-foreground"
        >
          <option value="name">A-Z</option>
          <option value="price">Price</option>
        </select>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as string)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors border",
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            {(cat as string) === "all"
              ? "All"
              : (cat as string).charAt(0).toUpperCase() +
                (cat as string).slice(1)}
          </button>
        ))}
      </div>

      {(search || activeCategory !== "all") && (
        <p className="text-xs text-muted-foreground mb-4">
          Showing {filtered.length} of {DEMO_STORE_AGENTS.length} agents
        </p>
      )}

      {/* Agent grid */}
      {filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No agents found</h2>
              <p className="text-muted-foreground text-sm">
                {activeCategory === "all"
                  ? "No agents are available in the store right now."
                  : "No agents in this category. Try a different filter."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => {
            const isOwned = OWNED_IDS.has(agent.id);
            const price = Number(agent.price) || 0;
            const isFree = price === 0;

            return (
              <Card
                key={agent.id}
                className={cn(
                  "border-border transition-colors",
                  isOwned && "border-green-600/30 bg-green-600/5"
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-base">
                        {agent.name}
                      </span>
                    </div>
                    {agent.is_premium ? (
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Premium
                      </Badge>
                    ) : Number(agent.price) === 0 ? (
                      <Badge className="bg-green-600/15 text-green-500 border-green-600/30 text-xs">
                        Free &mdash; Limited Time
                      </Badge>
                    ) : null}
                  </div>

                  {agent.category && (
                    <div className="flex items-center gap-1 mb-2">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">
                        {agent.category}
                      </span>
                    </div>
                  )}

                  {agent.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {agent.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold">
                      {isFree ? (
                        <span className="text-green-500">Free</span>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground font-normal mr-0.5">
                            $
                          </span>
                          {price.toFixed(2)}
                        </>
                      )}
                    </span>
                    {!isFree && (
                      <span className="text-xs text-muted-foreground">
                        one-time
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  {isOwned ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full pointer-events-none border-green-600/30 text-green-500"
                      disabled
                    >
                      <Check className="mr-2 h-3 w-3" />
                      Owned
                    </Button>
                  ) : isFree ? (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add to Library
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      <ShoppingCart className="mr-2 h-3 w-3" />
                      Buy for ${price.toFixed(2)}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
