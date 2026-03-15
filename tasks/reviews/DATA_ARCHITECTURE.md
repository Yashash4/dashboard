# Data Architecture Verification Report

**Date:** 2026-03-16
**Scope:** All data writes in `dashboard/src/` checked against the VPS-vs-Supabase architecture decision.

---

## Summary

| Category | Status |
|----------|--------|
| mc_events | **3 VIOLATIONS** (direct Supabase writes without VPS check) |
| mc_sessions | COMPLIANT (VPS-first with Supabase fallback) |
| mc_activities | COMPLIANT (VPS-first with Supabase fallback) |
| audit_logs | COMPLIANT (VPS-first with Supabase fallback) |
| kb_documents / kb_chunks | COMPLIANT (no Supabase references found) |
| webhook_deliveries | COMPLIANT (no Supabase references found) |
| agent_analytics | COMPLIANT (no Supabase references found) |
| chat_messages / chat_conversations | COMPLIANT (no Supabase references found) |
| vpsDataFetch() usage | COMPLIANT (correct data types routed to VPS) |
| deployAgent() | COMPLIANT (writes to VPS filesystem via SSH) |

**Total violations: 3** (all in `mc_events`)

---

## Violations

### VIOLATION 1: `mc_events` INSERT in workload route (READ)

- **File:** `src/app/api/mission-control/workload/route.ts`
- **Line:** 24
- **Code:** `supabase.from("mc_events").select("id").eq("user_id", user.id).eq("severity", "error").gte("created_at", fiveMinAgo)`
- **What it does:** Reads recent error events directly from Supabase to calculate workload recommendation.
- **Problem:** `mc_events` should live on VPS. This query bypasses `vpsDataFetch()` entirely -- no `hasVPSDataAPI()` check, no fallback pattern.
- **Fix:** Add the standard VPS-first pattern:
  ```typescript
  if (await hasVPSDataAPI(user.id)) {
    const data = await vpsDataFetch(user.id, `/api/events?severity=error&since=${fiveMinAgo}&limit=100`);
    // use data.events.length for error count
  } else {
    // existing Supabase fallback
  }
  ```

### VIOLATION 2: `mc_events` INSERT in task queue route (WRITE)

- **File:** `src/app/api/mission-control/tasks/queue/route.ts`
- **Line:** 112
- **Code:**
  ```typescript
  await supabase.from("mc_events").insert({
    user_id: user.id,
    event_type: "task_complete",
    severity: "info",
    agent_id: agentId,
    task_id: claimed.id,
    message: `Task "${candidate.title}" assigned to agent via queue`,
    payload: { action: "queue_pickup", attempt: attempt + 1 },
  });
  ```
- **What it does:** Logs a "task assigned via queue" event directly to Supabase.
- **Problem:** This is a direct Supabase insert with no `hasVPSDataAPI()` check. Every other event-writing route uses the VPS-first pattern. This one does not.
- **Fix:** Add VPS-first pattern:
  ```typescript
  if (await hasVPSDataAPI(user.id)) {
    await vpsDataFetch(user.id, "/api/events", {
      method: "POST",
      body: { event_type: "task_complete", severity: "info", agent_id: agentId, task_id: claimed.id, message: `...`, payload: { ... } },
    });
  } else {
    await supabase.from("mc_events").insert({ ... });
  }
  ```

### VIOLATION 3: `mc_events` INSERT in agent heartbeat route (WRITE)

- **File:** `src/app/api/mission-control/agents/heartbeat/route.ts`
- **Line:** 77
- **Code:**
  ```typescript
  await supabase.from("mc_events").insert({
    user_id: user.id,
    event_type: "agent_state_change",
    severity: status === "offline" ? "warning" : "info",
    agent_id,
    message: `Agent changed status from ${existing.status} to ${status}`,
    payload: { old_status: existing.status, new_status: status },
  });
  ```
- **What it does:** Logs an agent state change event directly to Supabase.
- **Problem:** Same as Violation 2 -- direct Supabase write without VPS-first check.
- **Fix:** Same pattern -- add `hasVPSDataAPI()` check and `vpsDataFetch()` call with Supabase fallback.

---

## Compliant Patterns (Verified Correct)

### Events Route (`src/app/api/mission-control/events/route.ts`)
- **GET (line 33):** Uses `hasVPSDataAPI()` -> `vpsDataFetch()` with Supabase fallback. Correct.
- **POST (line 99):** Uses `hasVPSDataAPI()` -> `vpsDataFetch()` with Supabase fallback. Correct.

### Sessions Route (`src/app/api/mission-control/sessions/route.ts`)
- **GET (line 20):** VPS-first with Supabase fallback. Correct.
- **POST (line 60):** VPS-first with Supabase fallback. Correct.

### Sessions [id] Route (`src/app/api/mission-control/sessions/[id]/route.ts`)
- **PATCH (line 31):** VPS-first with Supabase fallback. Correct.

### Activities Route (`src/app/api/mission-control/tasks/[id]/activities/route.ts`)
- **GET (line 21):** VPS-first with Supabase fallback. Correct.

### MC Automation (`src/lib/mc-automation.ts`)
- **Line 44:** Writes activities to VPS via `vpsDataFetch()`. Correct.
- **Lines 33-39:** Updates `mc_automation_rules` run count in Supabase. Correct (config data belongs in Supabase).
- **Lines 72-93, 106:** Writes `mc_tasks` to Supabase. Correct (task records belong in Supabase).

### Audit Log (`src/lib/audit-log.ts`)
- **Line 19-31:** VPS-first with Supabase fallback. Correct.
- **Line 48:** Supabase fallback for audit_logs. Acceptable as documented fallback.

### Reviews Route (`src/app/api/mission-control/tasks/[id]/reviews/route.ts`)
- **Lines 89-96:** Review records written to Supabase (`mc_reviews`). Correct (reviews are Supabase data per architecture).
- **Lines 102-111, 122-129:** Activities logged to VPS via `vpsDataFetch()`. Correct.

### Deploy Agent (`src/app/api/agents/deploy/route.ts`)
- **Line 203:** Calls `deployAgent()` via SSH to write config files to VPS filesystem. Correct.
- **Lines 215-221:** Updates `user_agents.deployed` status in Supabase. Correct (agent ownership is Supabase data).

### Deploy Agent SSH (`src/lib/ssh.ts`)
- **Lines 372-422:** `deployAgent()` writes files to VPS filesystem via SSH. Supports both Docker and native runtimes. Correct.
- **Lines 424-451:** `undeployAgent()` removes files from VPS filesystem via SSH. Correct.

### VPS Data API (`src/lib/vps-data-api.ts`)
- **Line 61-94:** `vpsDataFetch()` correctly calls port 5556 on user's VPS hostname with bearer token auth. Reads VPS hostname from Supabase `vps_instances` table (correct -- VPS metadata is Supabase data). Correct.

### No Supabase References Found For (Correct -- These Should Be VPS Only)
- `kb_documents` / `kb_chunks` -- No Supabase references in `src/`. Clean.
- `webhook_deliveries` -- No Supabase references in `src/`. Clean.
- `agent_analytics` -- No Supabase references in `src/`. Clean.
- `chat_messages` / `chat_conversations` -- No Supabase references in `src/`. Clean.

---

## Fallback Pattern Assessment

The codebase uses a consistent "VPS-first, Supabase fallback" pattern for data that should live on VPS. This is documented and acceptable for users whose VPS Data API is not yet configured (checked via `hasVPSDataAPI()`). The 3 violations are routes that skip this pattern entirely and go straight to Supabase.

### The Standard Pattern (Used Correctly in Most Places)
```typescript
if (await hasVPSDataAPI(user.id)) {
  // Primary path: VPS Data API
  const data = await vpsDataFetch(user.id, "/api/...", { ... });
} else {
  // Fallback: Supabase (for users without Data API configured)
  await supabase.from("...").insert({ ... });
}
```

### Routes Missing This Pattern (The 3 Violations)
1. `workload/route.ts` -- reads mc_events from Supabase only
2. `tasks/queue/route.ts` -- writes mc_events to Supabase only
3. `agents/heartbeat/route.ts` -- writes mc_events to Supabase only

---

## Recommendations

1. **Fix the 3 violations** by adding the `hasVPSDataAPI()` check and `vpsDataFetch()` call with Supabase fallback, matching the pattern used in `events/route.ts`.
2. **Import requirements** for the fixes: `workload/route.ts` and `tasks/queue/route.ts` need to import `vpsDataFetch` and `hasVPSDataAPI` from `@/lib/vps-data-api`. The heartbeat route also needs these imports.
3. **Priority:** Medium. The heartbeat route fires frequently (every agent heartbeat with a state change), so it's the highest-volume violator. The queue route fires on every task pickup. The workload route is read-only but still queries the wrong data source.
