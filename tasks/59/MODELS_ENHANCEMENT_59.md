# Models Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 3
**Total features:** 7 + 1 config change
**Last updated:** 2026-03-15

---

## CONTEXT: Current Models Page

**Files:**
- `src/app/dashboard/models/page.tsx` — server component, fetches model config + subscription + available models
- `src/components/dashboard/model-config.tsx` — client component with model list, change request, cancel
- `src/app/api/models/change/route.ts` — POST (request change) + DELETE (cancel pending)

**Current layout:**
```
┌──────────────────────────────────────────────────────┐
│ AI Model                                              │
│ Manage your AI model configuration                    │
├──────────────────────────────────────────────────────┤
│ Current Model: Kimi K2.5                              │
│ Context Limit: 128K tokens                            │
│ Changes this cycle: 0/1                               │
│ Pending: None                                         │
├──────────────────────────────────────────────────────┤
│ Available Models                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Kimi K2.5│ │MiniMax   │ │ Model C  │              │
│ │ 128K ctx │ │M2.5     │ │ 128K ctx │              │
│ │ [Current]│ │[Select]  │ │[Select]  │              │
│ └──────────┘ └──────────┘ └──────────┘              │
└──────────────────────────────────────────────────────┘
```

**How model changes work:**
- Starter: "Request Change" → queues for next billing cycle. Currently 1 change/month. Changing to **5/month**.
- Pro: instant switch via SSH config push
- Available models fetched from `available_models` table

---

## 3.0 CHANGE MAX MODEL SWITCHES FROM 1 TO 5

### What it is
Starter users can now change models 5 times per billing cycle instead of 1.

### What to change

**In `src/components/dashboard/model-config.tsx`:**
```typescript
// Line ~66: Change maxChanges for starter
const maxChanges = plan === "starter" ? 5 : 999; // was 1, now 5
```

**In `src/app/api/models/change/route.ts`:**
```typescript
// Line ~108: Change maxChanges for starter
const maxChanges = plan === "starter" ? 5 : 999; // was 1, now 5
```

**In UI copy:**
```typescript
// Change: "You've used your change this cycle"
// To: "You've used 3 of 5 model changes this cycle"
// When all used: "You've used all 5 model changes this cycle. Resets on [date]."
```

**Update landing page/pricing** if it mentions "1 change per cycle" → "5 changes per cycle"

### Files to modify
- `src/components/dashboard/model-config.tsx` — maxChanges + UI copy
- `src/app/api/models/change/route.ts` — maxChanges
- Landing page pricing component — if it mentions change limit

---

## 3.1 MODEL COMPARISON CARDS

### What it is
Before switching models, users see a side-by-side comparison of their current model vs the one they're about to switch to. Shows what they gain and lose.

### Current state
Model cards show: name + context limit. That's it. User has no idea what makes one model different from another.

### Database changes

Add richer model metadata to the `available_models` table:

```sql
ALTER TABLE available_models ADD COLUMN description TEXT;
ALTER TABLE available_models ADD COLUMN capabilities TEXT[] DEFAULT '{}';
-- capabilities: ['chat', 'analysis', 'code', 'vision', 'creative', 'fast']
ALTER TABLE available_models ADD COLUMN strengths TEXT;
-- "Best for customer support, fast responses, good at following instructions"
ALTER TABLE available_models ADD COLUMN context_window INTEGER;
-- actual context window in tokens
ALTER TABLE available_models ADD COLUMN speed_rating TEXT DEFAULT 'medium';
-- 'fast', 'medium', 'slow'
ALTER TABLE available_models ADD COLUMN best_for TEXT[];
-- ['customer support', 'coding', 'research', 'content writing']
```

**Seed data for existing models:**
```sql
UPDATE available_models SET
  description = 'A versatile model with strong conversational abilities and fast response times. Excellent for customer support and general-purpose AI agents.',
  capabilities = '{chat,analysis,creative,fast}',
  strengths = 'Fast responses, good at following instructions, strong at conversation',
  context_window = 128000,
  speed_rating = 'fast',
  best_for = '{customer support,general chat,FAQ handling}'
WHERE name = 'Kimi K2.5';

UPDATE available_models SET
  description = 'A powerful model with deep analytical capabilities. Strong at complex reasoning, document analysis, and detailed research tasks.',
  capabilities = '{chat,analysis,code,creative}',
  strengths = 'Deep analysis, complex reasoning, detailed explanations',
  context_window = 128000,
  speed_rating = 'medium',
  best_for = '{research,data analysis,complex questions,content writing}'
WHERE name = 'MiniMax M2.5';
```

### UI — Enhanced model cards

Replace the simple model cards with rich comparison cards:

```typescript
// Each model card shows:
// ┌────────────────────────────────────────────┐
// │ Kimi K2.5                        [Current] │
// │                                             │
// │ A versatile model with strong              │
// │ conversational abilities...                │
// │                                             │
// │ ⚡ Fast  ·  128K context                    │
// │                                             │
// │ Capabilities:                               │
// │ 💬 Chat  📊 Analysis  🎨 Creative  ⚡ Fast   │
// │                                             │
// │ Best for:                                   │
// │ Customer support · General chat · FAQ       │
// │                                             │
// │ [Current Model]                             │
// └────────────────────────────────────────────┘

interface ModelCardProps {
  model: {
    name: string;
    description: string;
    capabilities: string[];
    strengths: string;
    context_window: number;
    speed_rating: string;
    best_for: string[];
  };
  isCurrent: boolean;
  isPending: boolean;
  onSelect: () => void;
  canChange: boolean;
}

const CAPABILITY_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  chat: { icon: MessageSquare, label: "Chat" },
  analysis: { icon: BarChart3, label: "Analysis" },
  code: { icon: Code, label: "Code" },
  vision: { icon: Eye, label: "Vision" },
  creative: { icon: Sparkles, label: "Creative" },
  fast: { icon: Zap, label: "Fast" },
};

const SPEED_CONFIG: Record<string, { label: string; color: string }> = {
  fast: { label: "⚡ Fast", color: "text-green-500" },
  medium: { label: "● Medium", color: "text-yellow-500" },
  slow: { label: "◐ Slow", color: "text-orange-500" },
};
```

### Comparison dialog before switching

When user clicks "Select" on a model, show a comparison dialog:

```typescript
// ┌──────────────────────────────────────────────────────┐
// │ Switch Model?                                         │
// ├──────────────────────────────────────────────────────┤
// │           Current            →           New          │
// │        Kimi K2.5                    MiniMax M2.5      │
// │                                                       │
// │ Context:  128K              →        128K             │
// │ Speed:    ⚡ Fast            →        ● Medium         │
// │                                                       │
// │ You'll gain:                                          │
// │  ✅ Deep analysis and complex reasoning               │
// │  ✅ Better at code and research                       │
// │                                                       │
// │ You'll lose:                                          │
// │  ❌ Fast response times                               │
// │                                                       │
// │ Note: This is change 2 of 5 this cycle.              │
// │ Change takes effect next billing cycle.               │
// │                                                       │
// │ [Cancel]                    [Switch to MiniMax M2.5]  │
// └──────────────────────────────────────────────────────┘

function generateComparison(current: Model, target: Model): {
  gains: string[];
  losses: string[];
} {
  const currentCaps = new Set(current.capabilities);
  const targetCaps = new Set(target.capabilities);

  const gains: string[] = [];
  const losses: string[] = [];

  // Capabilities gained
  for (const cap of targetCaps) {
    if (!currentCaps.has(cap)) {
      gains.push(`${CAPABILITY_ICONS[cap]?.label || cap} capability`);
    }
  }

  // Capabilities lost
  for (const cap of currentCaps) {
    if (!targetCaps.has(cap)) {
      losses.push(`${CAPABILITY_ICONS[cap]?.label || cap} capability`);
    }
  }

  // Speed comparison
  const speedOrder = { fast: 3, medium: 2, slow: 1 };
  if (speedOrder[target.speed_rating] > speedOrder[current.speed_rating]) {
    gains.push("Faster response times");
  } else if (speedOrder[target.speed_rating] < speedOrder[current.speed_rating]) {
    losses.push("Slower response times");
  }

  // Context window
  if (target.context_window > current.context_window) {
    gains.push(`Larger context window (${formatContext(target.context_window)} vs ${formatContext(current.context_window)})`);
  } else if (target.context_window < current.context_window) {
    losses.push(`Smaller context window (${formatContext(target.context_window)} vs ${formatContext(current.context_window)})`);
  }

  // Best-for differences
  const newBestFor = target.best_for.filter(b => !current.best_for.includes(b));
  if (newBestFor.length) gains.push(`Better for: ${newBestFor.join(", ")}`);

  // Add strengths as gains
  if (target.strengths && target.strengths !== current.strengths) {
    gains.push(target.strengths);
  }

  return { gains, losses };
}
```

### Files to modify
- `src/components/dashboard/model-config.tsx` — rich model cards + comparison dialog
- `src/app/dashboard/models/page.tsx` — fetch enhanced model data
- Migration for `available_models` table columns + seed data

---

## 3.2 MODEL CAPABILITIES BADGES

### What it is
Visual badges showing what each model can do: Chat, Analysis, Code, Vision, Creative, Fast.

### What to build

Already included in 3.1 above — the `CAPABILITY_ICONS` map renders as small badges:

```typescript
// In each model card:
<div className="flex flex-wrap gap-1.5 mt-2">
  {model.capabilities.map(cap => {
    const config = CAPABILITY_ICONS[cap];
    if (!config) return null;
    return (
      <span
        key={cap}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
      >
        <config.icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  })}
</div>
```

No separate implementation — part of 3.1.

---

## 3.3 MODEL RECOMMENDATION

### What it is
Based on the user's deployed agents and usage patterns, suggest which model would be best for them.

### What to build

**Recommendation logic:**

```typescript
// src/lib/model-recommendation.ts

interface ModelRecommendation {
  modelName: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export function recommendModel(
  agents: { name: string; category?: string }[],
  currentModel: string,
  availableModels: Model[]
): ModelRecommendation | null {
  // Analyze agent types
  const categories = agents.map(a => a.category?.toLowerCase() || "general");

  // Count use case types
  const hasSupport = categories.some(c => c.includes("support") || c.includes("customer"));
  const hasResearch = categories.some(c => c.includes("research") || c.includes("analysis"));
  const hasCoding = categories.some(c => c.includes("code") || c.includes("developer") || c.includes("technical"));
  const hasContent = categories.some(c => c.includes("content") || c.includes("writer") || c.includes("creative"));

  // Find best model for primary use case
  for (const model of availableModels) {
    if (model.name === currentModel) continue; // don't recommend current

    // Match model best_for with user's agent types
    const matchScore = calculateMatchScore(model, { hasSupport, hasResearch, hasCoding, hasContent });

    if (matchScore > 0.6) {
      return {
        modelName: model.name,
        reason: generateRecommendationReason(model, { hasSupport, hasResearch, hasCoding, hasContent }),
        confidence: matchScore > 0.8 ? "high" : "medium",
      };
    }
  }

  return null; // no strong recommendation
}

function calculateMatchScore(
  model: Model,
  usage: { hasSupport: boolean; hasResearch: boolean; hasCoding: boolean; hasContent: boolean }
): number {
  let score = 0;
  let relevantFactors = 0;

  if (usage.hasSupport) {
    relevantFactors++;
    if (model.best_for.some(b => b.includes("support") || b.includes("chat"))) score++;
    if (model.capabilities.includes("fast")) score += 0.5; // support needs fast responses
  }

  if (usage.hasResearch) {
    relevantFactors++;
    if (model.best_for.some(b => b.includes("research") || b.includes("analysis"))) score++;
    if (model.capabilities.includes("analysis")) score += 0.5;
  }

  if (usage.hasCoding) {
    relevantFactors++;
    if (model.best_for.some(b => b.includes("cod") || b.includes("technical"))) score++;
    if (model.capabilities.includes("code")) score += 0.5;
  }

  if (usage.hasContent) {
    relevantFactors++;
    if (model.best_for.some(b => b.includes("content") || b.includes("writing"))) score++;
    if (model.capabilities.includes("creative")) score += 0.5;
  }

  return relevantFactors > 0 ? score / (relevantFactors * 1.5) : 0;
}

function generateRecommendationReason(model: Model, usage: any): string {
  const reasons: string[] = [];

  if (usage.hasSupport && model.capabilities.includes("fast")) {
    reasons.push("fast responses for your support agents");
  }
  if (usage.hasResearch && model.capabilities.includes("analysis")) {
    reasons.push("strong analytical capabilities for research");
  }
  if (usage.hasCoding && model.capabilities.includes("code")) {
    reasons.push("excellent at code tasks");
  }
  if (usage.hasContent && model.capabilities.includes("creative")) {
    reasons.push("creative writing capabilities for content agents");
  }

  if (reasons.length === 0) return `${model.name} may be a good fit for your use case.`;
  return `Recommended for ${reasons.join(" and ")}.`;
}
```

**UI — recommendation banner:**

```
┌────────────────────────────────────────────────────────────┐
│ 💡 Recommendation                                          │
│ Based on your agents (Support Bot, Research Bot), we       │
│ suggest MiniMax M2.5 for strong analytical capabilities    │
│ for research.                                              │
│ [Switch to MiniMax M2.5]                     [Dismiss]     │
└────────────────────────────────────────────────────────────┘
```

Show above the model cards. Only show if there's a recommendation with "high" or "medium" confidence. Dismissable (store dismissed state in localStorage).

### Files to create
- `src/lib/model-recommendation.ts`

### Files to modify
- `src/app/dashboard/models/page.tsx` — fetch agents + compute recommendation
- `src/components/dashboard/model-config.tsx` — render recommendation banner

---

## 3.4 MODEL CHANGE HISTORY

### What it is
Track when the user switched models — from what to what, when, why.

### Database

```sql
CREATE TABLE model_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_model TEXT NOT NULL,
  to_model TEXT NOT NULL,
  change_type TEXT NOT NULL, -- 'instant' (Pro) or 'scheduled' (Starter)
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
  requested_at TIMESTAMPTZ DEFAULT now(),
  effective_at TIMESTAMPTZ, -- when the change actually happened
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX idx_model_history_user ON model_change_history(user_id, requested_at DESC);
```

**Track changes in the model change API:**

In `src/app/api/models/change/route.ts`, after a successful change request:

```typescript
// Insert history record
await admin.from("model_change_history").insert({
  user_id: user.id,
  from_model: currentModel,
  to_model: requestedModel,
  change_type: plan === "starter" ? "scheduled" : "instant",
  status: plan === "starter" ? "pending" : "completed",
  effective_at: plan === "starter" ? changeEffectiveDate : new Date().toISOString(),
});
```

On cancel:
```typescript
// Update history to cancelled
await admin.from("model_change_history").update({
  status: "cancelled",
  cancelled_at: new Date().toISOString(),
}).eq("user_id", user.id).eq("status", "pending");
```

**UI — history section below model cards:**

```
Model Change History
┌──────────────────────────────────────────────────────┐
│ Mar 15  Kimi K2.5 → MiniMax M2.5    Scheduled       │
│         Effective: Apr 1, 2026       [Cancel]        │
├──────────────────────────────────────────────────────┤
│ Feb 10  MiniMax M2.5 → Kimi K2.5    Completed       │
│         Switched instantly                            │
├──────────────────────────────────────────────────────┤
│ Jan 5   Kimi K2.5 → MiniMax M2.5    Cancelled       │
│         Cancelled on Jan 6                            │
└──────────────────────────────────────────────────────┘
```

**API:**
```typescript
// GET /api/models/history?limit=10
// Auth required
// Returns: { history: [{ id, from_model, to_model, change_type, status, requested_at, effective_at, cancelled_at }] }
```

### Files to create
- `src/app/api/models/history/route.ts` (GET)

### Files to modify
- `src/app/api/models/change/route.ts` — insert history on change + cancel
- `src/components/dashboard/model-config.tsx` — show history section
- Migration for `model_change_history` table

---

## 3.5 CURRENT MODEL PERFORMANCE

### What it is
Show how the current model is performing FOR THIS USER — average response time, success rate.

### What to build

**Data source:** From chat analytics (response_time_ms per message). Aggregate for the current model.

```typescript
// In models page, fetch recent performance:
const { data: performance } = await supabase.rpc("get_model_performance", {
  p_user_id: user.id,
  p_days: 7,
});

// Returns:
// {
//   avg_response_time_ms: 1800,
//   total_messages: 245,
//   success_rate: 98.2, // % of messages that got a response (not error/timeout)
//   fastest_response_ms: 450,
//   slowest_response_ms: 8200
// }
```

**RPC function:**
```sql
CREATE OR REPLACE FUNCTION get_model_performance(p_user_id UUID, p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'avg_response_time_ms', COALESCE(AVG(response_time_ms), 0)::INT,
    'total_messages', COUNT(*),
    'success_rate', CASE WHEN COUNT(*) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE response_time_ms IS NOT NULL AND response_time_ms > 0)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
      ELSE 100 END,
    'fastest_response_ms', COALESCE(MIN(response_time_ms) FILTER (WHERE response_time_ms > 0), 0),
    'slowest_response_ms', COALESCE(MAX(response_time_ms), 0)
  ) INTO result
  FROM agent_analytics
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;
```

**UI — performance card below current model info:**

```
┌────────────────────────────────────────────────────────┐
│ Model Performance (last 7 days)                         │
│                                                         │
│ Avg Response:  1.8s      Success Rate:  98.2%          │
│ Messages:      245       Fastest:       0.4s           │
│                                                         │
│ [View Detailed Analytics →] ← links to /analytics (Pro)│
└────────────────────────────────────────────────────────┘
```

For Starter users: show the basic numbers. Link to Pro analytics page shows upgrade prompt.

### Files to modify
- `src/app/dashboard/models/page.tsx` — fetch performance data
- `src/components/dashboard/model-config.tsx` — render performance card
- Migration for RPC function

---

## 3.6 MODEL DESCRIPTION / DETAILS PAGE

### What it is
Users don't know what "Kimi K2.5" means. Each model needs a proper description explaining what it's good at, its limitations, and when to use it.

### What to build

**Already included in 3.1** — the `description`, `strengths`, `best_for` columns on `available_models` provide this data. The enhanced model cards display this information.

**For a deeper detail view:** When user clicks "Learn more" on a model card, show a dialog or expandable section:

```
┌──────────────────────────────────────────────────────────┐
│ Kimi K2.5                                                │
│                                                          │
│ A versatile model with strong conversational abilities   │
│ and fast response times. Excellent for customer support   │
│ and general-purpose AI agents.                           │
│                                                          │
│ Strengths:                                               │
│ • Fast responses (avg 1-2 seconds)                       │
│ • Excellent at following instructions                    │
│ • Strong conversational ability                          │
│ • Good at handling multi-step requests                   │
│                                                          │
│ Best for:                                                │
│ 💬 Customer support  📋 FAQ handling  🤝 General chat     │
│                                                          │
│ Specifications:                                          │
│ Context window: 128,000 tokens                           │
│ Speed: ⚡ Fast                                            │
│ Capabilities: Chat · Analysis · Creative                 │
│                                                          │
│ [Select This Model]                              [Close] │
└──────────────────────────────────────────────────────────┘
```

**No separate implementation needed** — enhance the existing model card click handler to show a Sheet/Dialog with full details.

### Files to modify
- `src/components/dashboard/model-config.tsx` — add "Learn more" → detail dialog

---

## 3.7 QUICK SWITCH CONFIRMATION (What Changes)

### What it is
Before switching, show exactly what changes — context window, speed, capabilities gained/lost.

### What to build

**Already included in 3.1** — the comparison dialog shows "You'll gain" and "You'll lose" sections using the `generateComparison()` function.

**No separate implementation needed** — part of 3.1's switch confirmation dialog.

---

## BUILD ORDER

```
3.0 Change max switches from 1 to 5 (FIRST — tiny config change, immediate value)
  ↓
3.1 Model Comparison Cards + 3.2 Capabilities Badges + 3.7 Switch Confirmation
  (these are all one build — enhanced model cards with comparison dialog)
  ↓
3.6 Model Description/Details (extends 3.1 — add detail dialog)
  ↓
3.5 Current Model Performance (needs RPC + performance card)
  ↓
3.4 Model Change History (needs DB table + API + UI)
  ↓
3.3 Model Recommendation (needs agent analysis + recommendation logic)
```

3.0 is a 2-line code change. 3.1+3.2+3.6+3.7 are one unified build (enhanced model cards). 3.5 and 3.4 are independent. 3.3 depends on having agent data.
