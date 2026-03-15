# Agent Store Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 5
**Total features:** 10 + agent seeding (planner provides configs)
**Last updated:** 2026-03-15

---

## CONTEXT: Current Store Page

**Files:**
- `src/app/dashboard/store/page.tsx` — server component, fetches agents + user's owned agents
- `src/components/dashboard/agent-store.tsx` — client component with agent cards, category filter, purchase

**Current layout:**
```
┌──────────────────────────────────────────────────────┐
│ Agent Store                                           │
│ Browse and deploy AI agents                           │
├──────────────────────────────────────────────────────┤
│ [All] [Support] [Sales] [Research] [Content] [Data]  │
├──────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │Agent Name│ │Agent Name│ │Agent Name│              │
│ │2-line    │ │2-line    │ │2-line    │              │
│ │desc...   │ │desc...   │ │desc...   │              │
│ │[Category]│ │[Category]│ │[Owned ✅]│              │
│ │[Add Free]│ │[$9 Buy]  │ │          │              │
│ └──────────┘ └──────────┘ └──────────┘              │
└──────────────────────────────────────────────────────┘
```

**CRITICAL PROBLEM:** The store is EMPTY. No agents exist in the database. The planner will provide 7 pre-built agent configs in `tasks/STORE_AGENTS_SEED.md`. The 59 agent runs the seed SQL and adds the "Free — Limited Time" badge.

---

## PRE-REQUISITE: SEED AGENTS (from planner)

- [ ] **5.0a Run seed SQL from `tasks/STORE_AGENTS_SEED.md`**
  Create migration file from the provided INSERT statements. All 7 agents: Support, Research, Writer, Data, Sales, Reviewer, Manager. Full OpenClaw config files in `config_files` JSONB.

- [ ] **5.0b Add "Free — Limited Time" badge logic**
  In `agent-store.tsx`, for agents where `price = 0`:
  ```typescript
  {agent.price === 0 && (
    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
      Free — Limited Time
    </Badge>
  )}
  ```
  When we later set `price > 0`, the badge disappears automatically.

- [ ] **5.0c Verify agents appear and deploy correctly**

---

## 5.1 AGENT DETAIL PAGE

### What it is
Click an agent card → full detail page with everything about the agent: description, capabilities, tools, setup guide, reviews, install button.

### Current state
Agent cards show: name + 2-line truncated description + category badge + Add/Buy button. Not enough info to decide.

### What to build

**Route:** `/dashboard/store/[id]` — agent detail page

```typescript
// src/app/dashboard/store/[id]/page.tsx

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  // Fetch agent details
  const { data: agent } = await admin
    .from("agents")
    .select("*")
    .eq("id", params.id)
    .eq("is_active", true)
    .single();

  if (!agent) return notFound();

  // Check if user owns this agent
  const { data: ownership } = await admin
    .from("user_agents")
    .select("id, deployed")
    .eq("user_id", user.id)
    .eq("agent_id", params.id)
    .single();

  // Fetch reviews
  const { data: reviews } = await admin
    .from("agent_reviews")
    .select("*, users(name, avatar_emoji)")
    .eq("agent_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch install count
  const { count: installCount } = await admin
    .from("user_agents")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", params.id);

  // Parse config files for display
  const configFiles = agent.config_files || {};
  const soulContent = configFiles["SOUL.md"] || "";
  const toolsList = (configFiles["TOOLS.md"] || "").split("\n").filter((l: string) => l.startsWith("- ")).map((l: string) => l.substring(2));
  const identity = parseIdentity(configFiles["identity.md"] || "");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link href="/store" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Store
      </Link>

      {/* Hero section */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-4xl border border-border">
          {identity.emoji || "🤖"}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground mt-1">{agent.description}</p>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="outline">{agent.category}</Badge>
            {agent.price === 0 && (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Free — Limited Time</Badge>
            )}
            <span className="text-sm text-muted-foreground">{installCount} users</span>
            {reviews?.length > 0 && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {averageRating(reviews).toFixed(1)} ({reviews.length} reviews)
              </span>
            )}
          </div>
        </div>
        <div>
          {ownership ? (
            ownership.deployed ? (
              <Badge className="bg-primary/10 text-primary">Deployed ✅</Badge>
            ) : (
              <Button asChild><Link href="/agents">Go to My Agents →</Link></Button>
            )
          ) : agent.price === 0 ? (
            <Button onClick={handleAdd}>Add to My Agents</Button>
          ) : (
            <Button onClick={handlePurchase}>${agent.price} — Buy</Button>
          )}
        </div>
      </div>

      {/* Tabs: Overview | Capabilities | Reviews | Setup */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews?.length || 0})</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Full SOUL.md rendered as markdown */}
          <Card>
            <CardHeader><CardTitle>About This Agent</CardTitle></CardHeader>
            <CardContent>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{soulContent}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities">
          {/* Tools list + identity info */}
          <Card>
            <CardHeader><CardTitle>Tools & Capabilities</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {toolsList.map((tool: string) => (
                  <div key={tool} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{tool}</span>
                  </div>
                ))}
              </div>
              {identity.theme && (
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Role:</strong> {identity.theme}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          {/* Reviews list + leave review form */}
          {/* ... see 5.6 below */}
        </TabsContent>

        <TabsContent value="setup">
          {/* How to deploy and configure */}
          <Card>
            <CardHeader><CardTitle>How to Set Up</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-mono text-sm">1</div>
                <div>
                  <p className="font-medium">Add to your agents</p>
                  <p className="text-sm text-muted-foreground">Click "Add to My Agents" above to add this agent to your library.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-mono text-sm">2</div>
                <div>
                  <p className="font-medium">Deploy the agent</p>
                  <p className="text-sm text-muted-foreground">Go to My Agents and click "Deploy" to activate it on your VPS.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-mono text-sm">3</div>
                <div>
                  <p className="font-medium">Start chatting</p>
                  <p className="text-sm text-muted-foreground">Go to Chat, select the agent, and send your first message. The agent will respond on all your connected channels.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function parseIdentity(content: string): { name?: string; theme?: string; emoji?: string } {
  const lines = content.split("\n");
  const result: Record<string, string> = {};
  for (const line of lines) {
    if (line.startsWith("theme:")) result.theme = line.replace("theme:", "").trim();
    if (line.startsWith("emoji:")) result.emoji = line.replace("emoji:", "").trim();
    if (line.startsWith("# ")) result.name = line.replace("# ", "").trim();
  }
  return result;
}

function averageRating(reviews: any[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
```

### Make agent cards clickable

In `agent-store.tsx`, wrap each card in a Link:
```typescript
<Link href={`/store/${agent.id}`} className="block hover:bg-muted/30 transition-colors rounded-lg">
  {/* existing card content */}
</Link>
```

Keep the "Add" / "Buy" button with `stopPropagation` so it doesn't navigate.

### Files to create
- `src/app/dashboard/store/[id]/page.tsx`

### Files to modify
- `src/components/dashboard/agent-store.tsx` — make cards clickable (Link to detail page)

---

## 5.2 SEARCH

### What it is
Search agents by name, description, or capabilities.

### What to build

**Client-side search** (agent list is small — no need for server-side):

```typescript
const [searchQuery, setSearchQuery] = useState("");

const filteredAgents = useMemo(() => {
  let result = agents;

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q)
    );
  }

  // Category filter (existing)
  if (categoryFilter !== "all") {
    result = result.filter(a => a.category === categoryFilter);
  }

  return result;
}, [agents, searchQuery, categoryFilter]);
```

**UI — search bar above categories:**

```
┌──────────────────────────────────────────────────────┐
│ 🔍 Search agents...                                  │
├──────────────────────────────────────────────────────┤
│ [All] [Support] [Sales] [Research] [Content] [Data]  │
├──────────────────────────────────────────────────────┤
│ Showing 5 of 7 agents                                │
```

### Files to modify
- `src/components/dashboard/agent-store.tsx` — add search input + filter logic

---

## 5.3 FEATURED / HERO SECTION

### What it is
Spotlight recommended agents at the top of the store. Curated by us.

### What to build

**Mark agents as featured in DB:**
```sql
ALTER TABLE agents ADD COLUMN is_featured BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN featured_description TEXT; -- longer tagline for the hero card
```

**UI — hero section above search:**

```
┌──────────────────────────────────────────────────────┐
│ ⭐ Featured Agent                                     │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🤝 Support Agent                                  │ │
│ │                                                    │ │
│ │ The all-in-one customer support AI. Handles        │ │
│ │ refunds, FAQs, order tracking, and escalation.     │ │
│ │ Trained on best practices for friendly,            │ │
│ │ professional customer interactions.                │ │
│ │                                                    │ │
│ │ ⭐ 4.8 (23 reviews) · 150 users · Free            │ │
│ │                                                    │ │
│ │ [View Details]                   [Add — Free]      │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

If multiple featured agents: carousel or 2-column featured grid.

Only show featured section if there ARE featured agents. Initially: feature the Support Agent (most universally useful).

### Files to modify
- `src/components/dashboard/agent-store.tsx` — add featured hero section
- `src/app/dashboard/store/page.tsx` — fetch featured agents separately
- Migration for `is_featured` + `featured_description` columns

---

## 5.4 FILTER TABS

### What it is
Quick filters beyond categories: All / Free / Premium / Popular / New.

### What to build

```typescript
const STORE_FILTERS = [
  { id: "all", label: "All" },
  { id: "free", label: "Free", filter: (a: Agent) => a.price === 0 },
  { id: "premium", label: "Premium", filter: (a: Agent) => a.price > 0 },
  { id: "popular", label: "Popular", sort: (a: Agent, b: Agent) => (b.install_count || 0) - (a.install_count || 0) },
  { id: "new", label: "New", sort: (a: Agent, b: Agent) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() },
];

// Above category filter:
<div className="flex gap-2 mb-3">
  {STORE_FILTERS.map(f => (
    <Button
      key={f.id}
      variant={activeFilter === f.id ? "default" : "outline"}
      size="sm"
      onClick={() => setActiveFilter(f.id)}
    >
      {f.label}
    </Button>
  ))}
</div>
```

**Need install_count on agents:**
```sql
ALTER TABLE agents ADD COLUMN install_count INTEGER DEFAULT 0;
-- Increment when a user adds an agent. Or compute from user_agents count.
```

Or compute dynamically:
```typescript
// In store page, fetch install counts:
const { data: counts } = await admin
  .from("user_agents")
  .select("agent_id")
  // group by agent_id and count — Supabase doesn't support GROUP BY easily
  // Alternative: use a view or RPC
```

Simpler: just use `user_agents` count per agent. Cache in agent card prop.

### Files to modify
- `src/components/dashboard/agent-store.tsx` — add filter tabs + sort logic
- `src/app/dashboard/store/page.tsx` — fetch install counts

---

## 5.5 AGENT PREVIEW / DEMO

### What it is
"Try this agent" button on the store page — test before deploying.

### What to build

**Same Quick Test dialog from Agents page (4.2)** but accessible from the Store.

**Problem:** The agent isn't deployed yet — it's in the store. Can't chat with an undeployed agent.

**Solution:** Deploy temporarily for testing. OR use a shared demo instance.

**Simpler approach — show sample conversation:**

Instead of live testing, show a pre-written sample conversation demonstrating the agent's capabilities:

```typescript
// Each agent can have a sample_conversation field:
ALTER TABLE agents ADD COLUMN sample_conversation JSONB DEFAULT '[]';
-- [
--   { "role": "user", "content": "Can I return my order #12345?" },
--   { "role": "assistant", "content": "Of course! I'd be happy to help with your return. Let me look up order #12345..." },
--   { "role": "user", "content": "It arrived damaged" },
--   { "role": "assistant", "content": "I'm sorry to hear that! Since the item arrived damaged, you're eligible for a full refund or replacement..." }
-- ]
```

**UI — in agent detail page (5.1), "Preview" tab:**

```
Preview Conversation
┌──────────────────────────────────────────────┐
│ 👤 Can I return my order #12345?             │
│                                               │
│ 🤝 Of course! I'd be happy to help with     │
│    your return. Let me look up order          │
│    #12345...                                  │
│                                               │
│ 👤 It arrived damaged                         │
│                                               │
│ 🤝 I'm sorry to hear that! Since the item   │
│    arrived damaged, you're eligible for a     │
│    full refund or replacement. Which would    │
│    you prefer?                                │
│                                               │
│ This is a sample conversation showing how     │
│ the agent handles typical interactions.        │
│ [Add to My Agents to start real conversations]│
└──────────────────────────────────────────────┘
```

**Planner provides sample conversations** in the agent seed data (added to PLANNER_TASKS.md).

### Files to modify
- `src/app/dashboard/store/[id]/page.tsx` — add "Preview" tab with sample conversation
- Migration for `sample_conversation` column
- Update PLANNER_TASKS.md — add sample conversations to agent seed task

---

## 5.6 RATINGS & REVIEWS

### What it is
Users rate agents 1-5 stars and leave reviews after using them.

### Database

```sql
CREATE TABLE agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, user_id) -- one review per user per agent
);

CREATE INDEX idx_reviews_agent ON agent_reviews(agent_id);

-- Denormalized average on agents table for fast display:
ALTER TABLE agents ADD COLUMN avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE agents ADD COLUMN review_count INTEGER DEFAULT 0;
```

### API

```typescript
// POST /api/agents/[id]/reviews
// Body: { rating: 4, review_text: "Great for customer support!" }
// Auth + verify user OWNS this agent (must have added it first)
// Upsert (can update existing review)
// Recalculate avg_rating + review_count on agents table
// Returns: { review: { ... } }

// GET /api/agents/[id]/reviews?limit=10&offset=0
// Public (no auth needed — reviews are public)
// Returns: { reviews: [...], total, avg_rating }

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Auth...
  const { rating, review_text } = await request.json();

  // Validate
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }
  if (review_text && review_text.length > 500) {
    return NextResponse.json({ error: "Review must be under 500 characters" }, { status: 400 });
  }

  // Verify user owns this agent
  const { data: ownership } = await admin
    .from("user_agents")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", params.id)
    .single();

  if (!ownership) {
    return NextResponse.json({ error: "You must add this agent before reviewing it" }, { status: 403 });
  }

  // Upsert review
  const { data: review, error } = await admin
    .from("agent_reviews")
    .upsert({
      agent_id: params.id,
      user_id: user.id,
      rating,
      review_text: review_text?.trim() || null,
    }, { onConflict: "agent_id,user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to save review" }, { status: 500 });

  // Recalculate average rating
  const { data: stats } = await admin
    .from("agent_reviews")
    .select("rating")
    .eq("agent_id", params.id);

  const avgRating = stats ? stats.reduce((sum, r) => sum + r.rating, 0) / stats.length : 0;

  await admin.from("agents").update({
    avg_rating: Math.round(avgRating * 100) / 100,
    review_count: stats?.length || 0,
  }).eq("id", params.id);

  return NextResponse.json({ review });
}
```

### UI — reviews tab in agent detail page

```
Reviews (23)                    ⭐ 4.8 average

┌──────────────────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐  John D.                     2 days ago    │
│ "Perfect for our customer support. Handles refunds   │
│  and FAQs without any issues. Response time is fast."│
├──────────────────────────────────────────────────────┤
│ ⭐⭐⭐⭐☆  Sarah M.                     1 week ago    │
│ "Good overall, but sometimes gives generic answers   │
│  for complex questions. Works great for simple FAQ."  │
├──────────────────────────────────────────────────────┤
│ ─── Leave Your Review ───────────────────────────── │
│ ⭐⭐⭐⭐⭐ (click to rate)                             │
│ [Write a review... (optional)]                       │
│ [Submit Review]                                      │
└──────────────────────────────────────────────────────┘
```

Only show "Leave Your Review" if user owns the agent. Show "Add this agent first to leave a review" otherwise.

### Files to create
- `src/app/api/agents/[id]/reviews/route.ts` (GET, POST)
- Migration for `agent_reviews` table + new columns on `agents`

### Files to modify
- `src/app/dashboard/store/[id]/page.tsx` — reviews tab
- `src/components/dashboard/agent-store.tsx` — show avg rating + review count on cards

---

## 5.7 INSTALL COUNT

### What it is
Show "Used by 150 users" on each agent. Social proof / popularity indicator.

### What to build

**Compute from `user_agents` table:**

```typescript
// In store page, fetch install counts per agent:
// Option A: RPC that returns count per agent
// Option B: count in the page server component

// Option B (simpler):
const { data: installCounts } = await admin
  .from("user_agents")
  .select("agent_id")
  .in("agent_id", agents.map(a => a.id));

const countMap = new Map<string, number>();
for (const ua of installCounts || []) {
  countMap.set(ua.agent_id, (countMap.get(ua.agent_id) || 0) + 1);
}
// Pass countMap to agent-store component
```

**Display on agent cards:**
```typescript
<span className="text-xs text-muted-foreground">
  {installCount} {installCount === 1 ? "user" : "users"}
</span>
```

**Also update the denormalized `install_count` on agents table** (increment on add, decrement on remove):
```typescript
// In agents/purchase route (after adding):
await admin.rpc("increment_agent_install_count", { p_agent_id: agentId });

// RPC:
// CREATE FUNCTION increment_agent_install_count(p_agent_id UUID) RETURNS void AS $$
// BEGIN UPDATE agents SET install_count = install_count + 1 WHERE id = p_agent_id; END; $$ LANGUAGE plpgsql;
```

### Files to modify
- `src/app/dashboard/store/page.tsx` — fetch/compute install counts
- `src/components/dashboard/agent-store.tsx` — display on cards
- `src/app/api/agents/purchase/route.ts` — increment count on add

---

## 5.8 SORTING

### What it is
Sort agents by: Popular (install count), Rating (avg_rating), Newest (created_at), Alphabetical (name).

### What to build

```typescript
const SORT_OPTIONS = [
  { id: "popular", label: "Popular", sort: (a, b) => (b.install_count || 0) - (a.install_count || 0) },
  { id: "rating", label: "Top Rated", sort: (a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) },
  { id: "newest", label: "Newest", sort: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() },
  { id: "name", label: "A-Z", sort: (a, b) => a.name.localeCompare(b.name) },
];

// Sort selector:
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger className="w-[140px]">
    <SelectValue placeholder="Sort by" />
  </SelectTrigger>
  <SelectContent>
    {SORT_OPTIONS.map(opt => (
      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Files to modify
- `src/components/dashboard/agent-store.tsx` — add sort selector + apply sort to filtered list

---

## 5.9 AGENT COMPARISON

### What it is
Compare two agents side-by-side: capabilities, tools, ratings, install count.

### What to build

**"Compare" checkbox on agent cards:**

```typescript
const [compareList, setCompareList] = useState<string[]>([]);

// On each card: small checkbox "Compare"
// When 2 are selected: show floating "Compare" bar at bottom

{compareList.length === 2 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 z-50">
    <span className="text-sm">Comparing {compareList.length} agents</span>
    <Button size="sm" onClick={() => setCompareDialogOpen(true)}>Compare Now</Button>
    <Button variant="ghost" size="sm" onClick={() => setCompareList([])}>Clear</Button>
  </div>
)}
```

**Comparison dialog:**

```
┌────────────────────────────────────────────────────────────┐
│ Agent Comparison                                    [Close] │
├────────────────────────────────────────────────────────────┤
│                   Support Agent    vs    Research Agent     │
│ ─────────────────────────────────────────────────────────── │
│ Category:         Support                Research          │
│ Rating:           ⭐ 4.8 (23)           ⭐ 4.5 (12)        │
│ Users:            150                    89                │
│ Price:            Free                   Free              │
│ ─────────────────────────────────────────────────────────── │
│ Tools:                                                     │
│ read              ✅                     ✅                 │
│ web               ✅                     ✅                 │
│ browser           ❌                     ✅                 │
│ write             ❌                     ✅                 │
│ memory_search     ✅                     ✅                 │
│ exec              ❌                     ❌                 │
│ ─────────────────────────────────────────────────────────── │
│ Best for:                                                  │
│ Customer support   ✅                     ❌                │
│ Research           ❌                     ✅                │
│ FAQ handling       ✅                     ❌                │
│ Web search         ❌                     ✅                │
└────────────────────────────────────────────────────────────┘
```

### Files to modify
- `src/components/dashboard/agent-store.tsx` — compare checkboxes + floating bar + comparison dialog

---

## 5.10 RELATED AGENTS

### What it is
"Users who deployed this also deployed..." — shown on agent detail page.

### What to build

**Query users who own this agent → find what other agents they own → rank by frequency:**

```typescript
// In agent detail page:
async function getRelatedAgents(agentId: string, limit: number = 3): Promise<Agent[]> {
  const admin = createAdminClient();

  // Find users who own this agent
  const { data: owners } = await admin
    .from("user_agents")
    .select("user_id")
    .eq("agent_id", agentId)
    .limit(100); // sample

  if (!owners?.length) return [];

  const ownerIds = owners.map(o => o.user_id);

  // Find what other agents these users own
  const { data: otherAgents } = await admin
    .from("user_agents")
    .select("agent_id, agents(id, name, description, category, avg_rating, install_count)")
    .in("user_id", ownerIds)
    .neq("agent_id", agentId);

  if (!otherAgents?.length) return [];

  // Count frequency
  const frequency = new Map<string, { count: number; agent: any }>();
  for (const ua of otherAgents) {
    const agent = Array.isArray(ua.agents) ? ua.agents[0] : ua.agents;
    if (!agent) continue;
    const existing = frequency.get(agent.id);
    if (existing) {
      existing.count++;
    } else {
      frequency.set(agent.id, { count: 1, agent });
    }
  }

  // Sort by frequency, return top N
  return [...frequency.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(f => f.agent);
}
```

**UI — section at bottom of agent detail page:**

```
Also Popular With Users of This Agent
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Research │ │ Writer   │ │ Data     │
│ Agent    │ │ Agent    │ │ Agent    │
│ ⭐ 4.5   │ │ ⭐ 4.3   │ │ ⭐ 4.6   │
│ [View]   │ │ [View]   │ │ [View]   │
└──────────┘ └──────────┘ └──────────┘
```

Only show if related agents exist. Links to their detail pages.

### Files to modify
- `src/app/dashboard/store/[id]/page.tsx` — add related agents section

---

## BUILD ORDER

```
5.0 Seed Agents (FIRST — store needs agents to exist)
  ↓
5.1 Agent Detail Page (the foundation — all other features build on this)
  ↓
5.2 Search (quick win, basic usability)
  ↓
5.3 Featured Hero Section (first impression)
  ↓
5.4 Filter Tabs (All/Free/Popular/New)
  ↓
5.8 Sorting (companion to filtering)
  ↓
5.7 Install Count (social proof — needs tracking)
  ↓
5.6 Ratings & Reviews (social proof — needs DB + API)
  ↓
5.5 Agent Preview / Demo (sample conversations)
  ↓
5.9 Agent Comparison (advanced feature)
  ↓
5.10 Related Agents (recommendation — needs user data)
```

5.0 → 5.1 → 5.2 → 5.3 are the critical path. Without agents (5.0) and a detail page (5.1), nothing else matters. Search (5.2) and featured (5.3) make the store usable. The rest adds polish and social proof.
