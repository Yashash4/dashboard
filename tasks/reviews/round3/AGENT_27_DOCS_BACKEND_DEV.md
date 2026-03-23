# Agent 27 — Docs — Backend Developer Review

**Total Issues Found: 14**
- CRITICAL: 3 / HIGH: 5 / MEDIUM: 4 / LOW: 2

## CRITICAL

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| C1 | `src/app/docs/api/agents/page.tsx:25` | Docs say agents endpoint "accepts no query parameters" but actual route supports `limit` and `offset` pagination params | Actual route at `src/app/api/v1/agents/route.ts:13-16` parses `limit` (default 20, max 100) and `offset` (default 0) from query params. Response also includes `has_more` and `total` fields not shown in docs. |
| C2 | `src/app/docs/api/agents/page.tsx:32-58` | Documented response schema uses `"agents": [...]` wrapper only, but actual response also returns `has_more` and `total` pagination fields | Actual route at `src/app/api/v1/agents/route.ts:48` returns `{ agents, has_more, total }`. Docs only show `{ agents: [...] }`. Any client following the docs would miss pagination entirely. |
| C3 | `src/app/docs/pro/api/page.tsx:155-156` | Chat API code example reads `data.reply` but actual response field is `data.response` | Actual route at `src/app/api/v1/chat/route.ts:397-401` returns `{ response: assistantContent, agent: agentSlug, request_id: ctx.requestId }`. The field is `response`, not `reply`. Code examples in JS (line 156) and Python (line 175) both reference the wrong field name. |

## HIGH

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| H1 | `src/app/docs/pro/api/page.tsx:134-137` | SSE streaming response format in docs doesn't match actual implementation | Docs show `{"chunk": "...", "done": false}` format. Actual streaming at `src/app/api/v1/chat/route.ts:283-284` emits `{"content": "..."}` chunks (no `done` or `usage` fields). The stream terminates with `data: [DONE]` (OpenAI-compatible), not a `done: true` JSON object. |
| H2 | `src/app/docs/billing/page.tsx:43-44` | Billing docs show annual prices as per-month equivalents ($50/mo, $110/mo, $298/mo) but actual plan data uses total annual prices | `plans.ts` lines 19,37,56: Starter annual = $599 ($49.92/mo), Pro annual = $1299 ($108.25/mo), Ultra annual = $3499 ($291.58/mo). Docs say $50/mo, $110/mo, $298/mo — none of these match the actual per-month equivalents when dividing annual totals by 12. |
| H3 | `src/app/docs/billing/page.tsx:50` | Docs say Pro VPS resources are "8 vCPU / 32 GB / 200 GB" but plans.ts says "8 vCPU, 32GB RAM, 400GB storage" | `plans.ts:50` feature string is `"8 vCPU, 32GB RAM, 400GB storage"`. Docs at line 56 show "200 GB" storage for Pro. Actual is 400GB. |
| H4 | `src/app/docs/billing/page.tsx:56` | Docs say Ultra VPS resources are "16 vCPU / 64 GB / 400 GB" but plans.ts says "16 vCPU, 64GB RAM, 800GB storage" | `plans.ts:66` feature string is `"16 vCPU, 64GB RAM, 800GB storage"`. Docs show "400 GB" storage for Ultra. Actual is 800GB. |
| H5 | `src/app/docs/api/agents/page.tsx:35-38` | Documented agent `id` uses `agt_` prefix format but actual implementation returns raw `agent_id` from database | Actual route at `src/app/api/v1/agents/route.ts:36` sets `id: ua.agent_id` directly from the `user_agents` table. No `agt_` prefix is applied. The `slug` is also dynamically generated from the agent name (line 38) rather than being a stored field, so it may differ from what the docs imply. |

## MEDIUM

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| M1 | `src/app/docs/pro/api/page.tsx:56-60` | Docs list rate limit tiers as 30/60/120/300 RPM but don't mention the default or that the default for the chat endpoint differs | `v1-auth.ts:117` shows default RPM is 60 when no per-key rate limit is set. The chat route at `src/app/api/v1/chat/route.ts:28` calls `validateV1Auth(request)` without a rate limit override, meaning it uses the per-key RPM. Other endpoints like agents/models use a fixed 60 RPM override regardless of key setting. This per-endpoint behavior is not documented. |
| M2 | `src/app/docs/pro/api/page.tsx:120-128` | Chat API docs show `agent` as a required-looking parameter but it's actually optional | `src/app/api/v1/chat/route.ts:60-65` shows `agent` is optional. When omitted, the first deployed agent is used (lines 117-131). The docs show it in every example without noting it's optional. |
| M3 | `src/app/docs/pro/api/page.tsx:120-128` | Chat API docs don't document `session_id` parameter for maintaining conversation state | `src/app/api/v1/chat/route.ts:60,83-85,185-187` shows `session_id` is a supported parameter that enables stateful conversations. Without it, each call is stateless. This is a significant feature not mentioned in the API docs. |
| M4 | `src/app/docs/billing/page.tsx:45-54` | Billing docs list features like "Monthly messages: 5,000/50,000", "Webhooks: 2/10", "Knowledge Base documents: 50/500", "Mission Control", "Custom domain", "Audit logging retention" that have no corresponding enforcement in `plans.ts` | `plans.ts` only defines names, prices, taglines, and feature display strings. The feature limits in the billing docs table (message counts, webhook counts, KB document limits, audit log retention days) are not codified in the plans definition. These may be enforced elsewhere, but they don't appear in the canonical plan configuration file. |

## LOW

| ID | File:Line | Description | Evidence |
|----|-----------|-------------|----------|
| L1 | `src/app/docs/pro/page.tsx:179-195` | Pro vs Starter comparison table says Starter has "Not included" for Knowledge Base, Webhooks, API access, Audit log, Agent Builder, Model Playground | `plans.ts:22-31` Starter features list does not include these, which is consistent. However, the billing docs at `src/app/docs/billing/page.tsx:47-55` say Starter gets "50" KB documents, "2" webhooks, "Basic" API access, and "7 days" audit logging. The Pro overview page and billing page contradict each other on what Starter includes. |
| L2 | `src/app/docs/api/models/page.tsx:221` | "Next Steps" links to `/docs/api/webhooks` with text "Usage API" — wrong link href for the label | The link text says "Usage API" but the `href` points to `/docs/api/webhooks`. Should likely point to `/docs/api/usage` or `/docs/pro/api` since usage tracking is part of the API access module. Similarly, agents docs at line 227 link to `/docs/api/webhooks` with text "Conversations & Threads". |
