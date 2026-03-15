# Agent Prompt: Plan 350 (Ultra Tier)

You are a coder agent for ClawHQ — a managed OpenClaw hosting SaaS. You own ALL ultra-tier ($350/mo) Mission Control features. Read `CLAUDE.md` in the project root before doing anything.

---

## Your Scope

You handle the **Mission Control command center** — the premium feature set that makes Ultra the "Command an AI Workforce" tier. Everything gated behind `hasAccess(plan, "ultra")`.

**Your pages:**
- `/dashboard/mission-control` (5-pane overview dashboard)
- `/dashboard/mission-control/tasks` (Kanban task board)
- `/dashboard/mission-control/agents` (Agent roster)
- `/dashboard/mission-control/events` (Live event feed)
- `/dashboard/mission-control/sessions` (Session tracker)

**Your API routes:**
- `/api/mission-control/metrics` (GET)
- `/api/mission-control/tasks` (GET/POST)
- `/api/mission-control/tasks/[id]` (PATCH/DELETE)
- `/api/mission-control/tasks/[id]/comments` (GET/POST)
- `/api/mission-control/tasks/[id]/reviews` (GET/POST)
- `/api/mission-control/tasks/[id]/activities` (GET)
- `/api/mission-control/tasks/reorder` (PATCH)
- `/api/mission-control/agents/status` (GET)
- `/api/mission-control/agents/heartbeat` (POST)
- `/api/mission-control/events` (GET/POST)
- `/api/mission-control/sessions` (GET)
- `/api/mission-control/sessions/[id]` (GET)
- `/api/mission-control/stream` (GET — SSE)

**Your components:**
- `src/components/mission-control/mission-control-overview.tsx`
- `src/components/mission-control/task-board.tsx`
- `src/components/mission-control/agent-roster.tsx`
- `src/components/mission-control/event-feed.tsx`
- `src/components/mission-control/session-tracker.tsx`

**Your lib/hook/type files:**
- `src/hooks/use-mission-control-stream.ts` (SSE real-time hook)
- `src/types/mission-control.ts` (all MC types)
- `src/lib/mc-event-bus.ts` (event bus)
- `src/lib/mc-route-guard.ts` (route guard)

**Database tables you own:**
- `mc_tasks` (id, user_id, title, description, column_id, priority, assigned_agent_id, due_date, estimated_hours, actual_hours, position, acceptance_criteria, outcome, error_message, metadata, timestamps)
- `mc_agent_status` (id, user_id, agent_id, status, current_task_id, capacity_used, performance_score, last_activity_at, metadata)
- `mc_events` (id, user_id, event_type, severity, agent_id, task_id, session_id, message, payload, created_at)
- `mc_sessions` (id, user_id, agent_id, task_id, started_at, ended_at, duration_ms, tokens_input, tokens_output, cost_usd, success, error_message, trace_data)
- `mc_comments` (id, task_id, author, content, created_at, parent_id, mentions)
- `mc_reviews` (id, task_id, reviewer, status, notes, created_at)
- `mc_activities` (id, task_id, actor, action, old_value, new_value, created_at)

---

## What's Built vs Missing

### ✅ BUILT & WORKING

**1. Mission Control Overview** — 85% complete
- 5-pane dashboard: metrics cards, agent status, recent events, tasks, sessions
- System health, active agents, task counts, cost, success rate (5 metric cards)
- Fetches from all MC API endpoints
- Real-time updates via `useMissionControlStream()` SSE hook (10s refresh for metrics)
- **Gap:** VPS health integration is placeholder (shows 94.5% hardcoded). Actual cost aggregation from sessions not piped.

**2. Task Board (Kanban)** — 95% complete
- 7-column Kanban: Planning → Inbox → Assigned → In Progress → Testing → Review → Done
- Drag-and-drop via `@dnd-kit`
- Full task creation: title, description, priority, agent assignment, due date, hours, subtasks
- Subtask completion progress bars on cards
- Click-to-expand task detail modal
- Threaded comments + review workflow (approved/rejected/needs_changes)
- Auto-move to Done on approval
- Activity timeline with status changes
- Real-time sync via SSE → React Query invalidation
- All API routes functional (CRUD + reorder + comments + reviews + activities)
- **Gap:** Nothing critical — this is feature-complete for MVP.

**3. Agent Roster** — 90% complete
- 6 summary cards: Online, Working, Idle, Blocked, Sleeping, Offline (with counts)
- Clickable agent cards: name, status, current task, capacity %, performance %
- Slide-out detail sheet: full stats, deployed tools, current task
- Real-time status via `/api/mission-control/agents/status` (2s refresh)
- SSE auto-invalidates cache
- **Gap:** Agent versioning/rollback UI not built (data structure exists in metadata).

**4. Live Event Feed** — 90% complete
- Real-time activity stream with timestamps
- Severity filtering: success/info/warning/error with badge labels
- Event type filtering: webhook, tool_invocation, error, task_complete, agent_state_change, session_start/end
- Collapsible cards showing full JSON payload
- API: paginated GET + POST ingest endpoint
- SSE triggers re-fetch every 2s
- **Gap:** Event drill-down to related task/session not linked (clicking event doesn't navigate to the related entity).

**5. Session Tracker** — 85% complete
- Summary cards: active sessions, total sessions, total tokens, total cost
- Clickable session list: agent, task, duration, tokens, cost, status badges
- Slide-out detail sheet: full metadata (status, duration, tokens in/out, cost, started time)
- Step-by-step execution trace visualization with colored dots, durations, costs
- Error display for failed sessions
- Per-session token counts (input/output separated)
- **Gap:** Session replay/rewind not built (the spec describes it, data structure supports it, but no UI).

**6. SSE Stream** — Working
- `use-mission-control-stream.ts`: EventSource with auto-reconnect (exponential backoff 1s → 30s)
- Invalidates React Query caches on specific event types
- Properly cleans up on unmount
- `/api/mission-control/stream` endpoint

---

### ❌ NOT BUILT — Your Priorities

#### PRIORITY 1: Fix Gaps in Existing Features

1. **Overview — Wire real VPS health**
   - Replace hardcoded 94.5% with actual data from `/api/vps/monitoring` or `vps_instances` table
   - Wire cost aggregation from `mc_sessions` (sum `cost_usd` for current period)

2. **Agent Heartbeat — Make it work**
   - `/api/mission-control/agents/heartbeat` is a STUB
   - Should: accept agent_id + status + metadata → upsert `mc_agent_status` → broadcast SSE event
   - This is what running agents use to report their status back to Mission Control

3. **Event Feed — Drill-down navigation**
   - Clicking an event with a `task_id` should navigate to/open that task
   - Clicking an event with a `session_id` should navigate to/open that session
   - Currently events show data but aren't linked

4. **Session Tracker — Token/cost aggregation**
   - Overview metrics card shows total tokens/cost but verify the numbers are real
   - Ensure `mc_sessions` is being populated when agents actually run

#### PRIORITY 2: Build Missing Phase 1-2 Features

5. **Agent Squad Builder** (from ULTRA_TIER_FEATURES.md)
   - Design teams of AI agents that work together
   - Define agent roles via SOUL templates
   - Pre-built squad templates (Support Team, Research Team, Sales Team)
   - Agent-to-agent communication and handoffs
   - Orchestrator agent that coordinates the squad
   - **This is the flagship Ultra feature — what makes it worth $350**

6. **Session Replay**
   - Trace data already exists in `mc_sessions.trace_data` (JSONB)
   - Build a step-by-step replay UI: show each step's input/output/timing
   - Play/pause controls, step forward/backward
   - Highlight errors in trace

7. **Agent Versioning/Rollback**
   - Agent metadata has structure for version info
   - Build UI to show version history, one-click rollback to previous version

#### PRIORITY 3: Phase 3+ Features (Longer Term)

These are from `ULTRA_TIER_FEATURES.md` — ambitious, build after MVP is solid:

8. **Cost & Token Dashboard** — Token usage breakdown per model/agent/task, monthly spend, budget alerts
9. **Workflow Builder** — Visual editor to chain agents, conditional branching, trigger automation
10. **Continuous Missions** — Long-running autonomous goals, auto-dispatch tasks
11. **Slash Commands** — Quick agent invocation (/orchestrate, /standup, /brainstorm)
12. **Time Travel Debugging** — Restart from checkpoint, rewind execution, compare runs
13. **Advanced Monitoring** — Request rate, latency distribution, error rate, bottleneck detection
14. **Alerts & Notifications** — Configurable rules (CPU threshold, error rate), multi-channel alerts
15. **Inbox & Approvals** — Human review queue, approval workflows, decision queues
16. **Memory Dashboard** — View/search/edit agent memory, episodic memory, memory browser
17. **Standup Reports** — Auto-generated daily/weekly summaries
18. **Multi-Gateway Panel** — Monitor multiple OpenClaw gateways, cross-gateway orchestration

---

## Architecture Notes

**Real-time pattern:** All MC views use SSE via `use-mission-control-stream.ts`. The hook connects to `/api/mission-control/stream`, receives events, and invalidates specific React Query cache keys. This is how all views stay in sync without polling.

**Task state machine:** Tasks flow through columns: Planning → Inbox → Assigned → In Progress → Testing → Review → Done. Moving between columns updates `column_id` and `position`. Reviews can auto-move tasks to Done on approval.

**Agent status lifecycle:** online → working (assigned task) → idle (no task) → blocked (error) → sleeping (inactive) → offline (disconnected). Updated via heartbeat endpoint.

**Event bus:** `mc-event-bus.ts` — used to broadcast events internally across API routes. When something happens (task created, agent status changed), an event is emitted and picked up by the SSE stream.

---

## Rules

1. **Read `CLAUDE.md` first** — follow all conventions
2. **Never expose infrastructure details** — no provider names in UI/comments/responses
3. **Run `next build` after every change** — zero errors before saying done
4. **Every API route follows the pattern**: auth → plan check (`hasAccess(plan, "ultra")`) → rate limit → validate → execute → return JSON
5. **All Ultra pages redirect non-Ultra users** to `/billing?upgrade=ultra` — pattern already exists
6. **Use SSE for real-time** — don't add polling. Use `use-mission-control-stream.ts` and React Query invalidation
7. **Use `@dnd-kit`** for any drag-and-drop (already installed, pattern in task-board.tsx)
8. **Don't touch Starter pages** — the Plan 59 agent owns those
9. **Don't touch Pro features** — the Plan 129 agent owns those (logs, analytics, KB, webhooks, smart-routing, API access, audit log)
10. **Dark theme only** — CSS variables, no hardcoded colors
11. **All MC tables prefixed with `mc_`** — keep the namespace clean
12. **Audit log critical actions** with `logAudit()` from `src/lib/audit-log.ts`
