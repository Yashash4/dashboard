# DATABASE ADMIN REVIEW -- ClawHQ Supabase Migrations

**Reviewer:** Database Administrator
**Date:** 2026-03-16
**Scope:** All 36 migration files under `dashboard/supabase/migrations/`
**Verdict:** PASS WITH FINDINGS -- 7 Critical, 12 Major, 9 Minor issues

---

## EXECUTIVE SUMMARY

The schema covers 45+ tables across Mission Control, Knowledge Base, API, Webhooks, Analytics, Audit, Logs, and support features. The overall design is sound -- correct use of UUIDs, TIMESTAMPTZ, JSONB, proper RLS on nearly every table, and good indexing discipline. However, there are several critical issues that must be addressed before production confidence is high.

---

## 1. SCHEMA CORRECTNESS

### 1.1 Primary Keys

| Status | Detail |
|--------|--------|
| PASS | Every table has a PRIMARY KEY (UUID or composite) |

All tables use `gen_random_uuid()` for PK generation, which is correct. `idempotency_cache` uses a composite PK `(key, user_id)` which is appropriate. `api_threads` and `api_thread_messages` use TEXT primary keys (application-generated IDs), which is acceptable for API-facing resources.

### 1.2 User Data FK References

| Status | Detail |
|--------|--------|
| CRITICAL | `agent_analytics.user_id` references `public.users(id)` NOT `auth.users(id)` |
| CRITICAL | `channel_credentials` is MISSING `user_id` column entirely |
| CRITICAL | `audit_logs.admin_id` references `public.users(id)` NOT `auth.users(id)` |
| MAJOR | `mc_tasks.user_id` references `public.users(id)` in migration 20260308000000 |
| MAJOR | `mc_events`, `mc_agent_status`, `mc_sessions` also reference `public.users(id)` |

**Details:**

The first migration (`20260307000000`) references `public.users(id)` instead of `auth.users(id)`. All later migrations correctly reference `auth.users(id)`. This inconsistency means:
- If `public.users` is a separate table synced from `auth.users`, the FK chain works but is indirect
- If `public.users` IS the auth table aliased, then it works but is non-standard
- The Mission Control tables (`20260308000000`) also reference `public.users(id)`

**`channel_credentials` has NO `user_id` column at all.** It only has `channel_id` as an FK. This means RLS cannot filter by user -- it is completely open (RLS is enabled but no policies are defined). This is a **data leak vector.**

### 1.3 Data Types

| Status | Detail |
|--------|--------|
| PASS | UUID for all IDs, TIMESTAMPTZ for all dates, TEXT for strings, JSONB for structured data |
| MINOR | `csat_ratings.agent_id` is TEXT instead of UUID -- inconsistent with all other agent references |
| MINOR | `conversation_intents.conversation_id` is TEXT instead of UUID |
| MINOR | `analytics_daily_summary.user_id` has no ON DELETE CASCADE |

### 1.4 NOT NULL Constraints

| Status | Detail |
|--------|--------|
| MAJOR | `agent_analytics.user_id` is nullable (no NOT NULL) -- allows orphan analytics rows |
| MINOR | `agent_analytics.metric_type` is NOT NULL -- good |
| PASS | All newer tables properly use NOT NULL on user_id |

### 1.5 DEFAULT Values

| Status | Detail |
|--------|--------|
| PASS | Sensible defaults throughout: `now()` for timestamps, `0` for counters, `'{}'` for JSONB |
| PASS | `api_keys.status` defaults to 'active', `webhooks.enabled` defaults to true |
| PASS | `idempotency_cache.expires_at` defaults to `now() + 24 hours` |

### 1.6 UNIQUE Constraints

| Status | Detail |
|--------|--------|
| PASS | `mc_agent_status(user_id, agent_id)` -- one status per agent per user |
| PASS | `api_key_usage_daily(key_id, date)` -- one row per key per day |
| PASS | `business_hours(user_id, COALESCE(channel_type, '__all__'))` -- clever NULL handling |
| PASS | `siem_configs(user_id)` -- one config per user |
| PASS | `log_forwarding(user_id)` -- one forwarding config per user |
| PASS | `conversation_intents(conversation_id, message_index)` -- one intent per message |
| PASS | `user_onboarding(user_id)` -- one onboarding record per user |
| MAJOR | `mc_reviews` has NO unique constraint for one review per task per reviewer |
| MINOR | `api_keys.key_hash` has a unique index -- correct |

### 1.7 CHECK Constraints

| Status | Detail |
|--------|--------|
| PASS | `kb_documents.type` IN ('pdf', 'txt', 'md', 'csv', 'url') |
| PASS | `kb_documents.status` IN ('processing', 'indexed', 'error', 'pending_embedding') |
| PASS | `api_keys.status` IN ('active', 'revoked') |
| PASS | `webhooks.last_status` IN ('success', 'failed') with NULL allowed |
| PASS | `auto_responses.type` IN ('greeting', 'away', 'faq') |
| PASS | `mc_reviews.status` IN ('approved', 'rejected', 'needs_changes') |
| PASS | `mc_task_dependencies` CHECK (task_id != depends_on_task_id) -- prevents self-references |
| PASS | `webhooks.retry_max_attempts` BETWEEN 1 AND 10 |
| PASS | `csat_ratings.rating` BETWEEN 1 AND 5 |
| PASS | `kb_feedback.rating` IN (-1, 1) |
| MAJOR | `mc_tasks.column_id` has NO CHECK constraint -- any arbitrary string is accepted |
| MAJOR | `mc_tasks.priority` has NO CHECK constraint -- should be restricted to valid values |
| MAJOR | `mc_events.severity` has NO CHECK constraint |
| MAJOR | `mc_agent_status.status` has NO CHECK constraint |
| MINOR | `api_batches.status` and `api_predictions.status` have no CHECK constraints |
| MINOR | `kb_connectors.sync_status` has no CHECK constraint |

---

## 2. ROW LEVEL SECURITY (RLS)

### 2.1 RLS Enabled

| Table | RLS Enabled | Policies |
|-------|-------------|----------|
| agent_analytics | YES | SELECT only |
| channel_credentials | YES | **NO POLICIES** |
| audit_logs | YES | SELECT for user_id (added later) |
| mc_tasks | YES | ALL for user_id |
| mc_events | YES | SELECT + INSERT for user_id |
| mc_agent_status | YES | ALL for user_id |
| mc_sessions | YES | ALL for user_id |
| mc_comments | YES | ALL for user_id |
| mc_reviews | YES | ALL for user_id |
| mc_task_activities | YES | ALL for user_id |
| mc_task_statuses | YES | ALL for user_id |
| mc_task_dependencies | YES | ALL via parent task ownership check |
| mc_automation_rules | YES | ALL for user_id |
| mc_task_templates | YES | ALL for user_id |
| mc_recurring_tasks | YES | ALL for user_id |
| kb_documents | YES | SELECT only |
| kb_chunks | YES | SELECT only |
| api_keys | YES | SELECT only |
| webhooks | YES | ALL for user_id |
| webhook_deliveries | YES | SELECT only |
| api_key_usage_daily | YES | SELECT only |
| auto_responses | YES | ALL for user_id |
| business_hours | YES | ALL for user_id |
| analytics_daily_summary | YES | SELECT for user + admin |
| idempotency_cache | YES | ALL for user_id |
| api_threads | YES | ALL for user_id |
| api_thread_messages | YES | ALL USING (false) -- admin-only access |
| api_batches | YES | ALL for user_id |
| api_predictions | YES | ALL for user_id |
| kb_feedback | YES | ALL for user_id |
| kb_connectors | YES | ALL for user_id |
| log_saved_views | YES | ALL for user_id |
| log_alert_rules | YES | ALL for user_id |
| log_forwarding | YES | ALL for user_id |
| csat_ratings | YES | ALL for user_id |
| analytics_dashboards | YES | ALL for user_id |
| analytics_cohorts | YES | ALL for user_id |
| analytics_reports | YES | ALL for user_id |
| siem_configs | YES | ALL for user_id |
| user_onboarding | YES | SELECT + UPDATE for user_id |
| user_notifications | YES | SELECT + UPDATE for user_id |
| conversation_intents | YES | ALL for user_id |
| log_alert_history | YES | SELECT only |

### 2.2 RLS Issues

| Severity | Issue |
|----------|-------|
| **CRITICAL** | `channel_credentials` -- RLS enabled but **ZERO policies defined**. This means ALL access is denied, including legitimate reads. If service role is used to access, fine, but if any client-side query attempts it, it silently returns nothing. Need at minimum a policy or document that this is service-role-only. |
| **CRITICAL** | `audit_logs` -- RLS enabled but initially had **no policies**. The `20260309200000` migration adds a SELECT policy for `user_id`, but admin audit logs (where `user_id IS NULL`) are inaccessible to anyone via RLS. Admin read policy is missing. |
| **MAJOR** | `agent_analytics` -- Only has SELECT policy. No INSERT policy. Users cannot insert their own analytics via the Supabase client. Must rely on service role or add INSERT policy. |
| **MAJOR** | `kb_documents` -- Only has SELECT policy. No INSERT/UPDATE/DELETE. Users cannot upload documents via RLS. Must rely on service role. |
| **MAJOR** | `kb_chunks` -- Only has SELECT policy. Same issue as kb_documents. |
| **MAJOR** | `api_keys` -- Only has SELECT policy. Users can view but not create or revoke keys via RLS. Must rely on service role. |
| **MAJOR** | `webhook_deliveries` -- Only has SELECT policy. Appropriate if insertions are server-side only. |
| **MAJOR** | `api_key_usage_daily` -- Only has SELECT policy. Appropriate if upserts are via RPC. |
| **MINOR** | `user_onboarding` -- No INSERT policy. The first onboarding record cannot be created by the user via RLS. Must be service-role created. |
| **MINOR** | `user_notifications` -- No INSERT or DELETE policy. Notifications are server-created, but users cannot dismiss/delete them. |
| **MINOR** | `log_alert_history` -- SELECT only is correct (server-inserted). |
| **MINOR** | `mc_events` -- Has SELECT + INSERT but no UPDATE or DELETE. This is probably intentional for an immutable event log. |

**Note:** Many SELECT-only tables appear intentional -- server-side writes via service role, client reads via RLS. This is a valid pattern but should be documented.

---

## 3. INDEXES

### 3.1 Index Coverage

| Status | Detail |
|--------|--------|
| PASS | `agent_analytics(user_id, agent_id, created_at DESC)` -- composite lookup index |
| PASS | `audit_logs(created_at DESC)`, `(user_id, created_at DESC)`, `(user_id, created_at)` |
| PASS | `mc_tasks(user_id, column_id, position)` -- excellent for board queries |
| PASS | `mc_events(user_id, created_at DESC)`, `(event_type, created_at DESC)` |
| PASS | `mc_sessions(user_id, started_at DESC)`, `(agent_id, started_at DESC)` |
| PASS | `kb_chunks USING GIN (search_vector)` -- full-text search |
| PASS | `kb_chunks USING hnsw (embedding vector_cosine_ops)` -- vector similarity |
| PASS | `api_keys(key_hash)` UNIQUE -- O(1) key lookup |
| PASS | `webhook_deliveries(next_retry_at) WHERE ...` -- partial index for retry cron |
| PASS | `chat_messages(conversation_id, created_at)` -- added in analytics_fixes |
| PASS | `chat_conversations(user_id, updated_at)` -- added in analytics_fixes |
| PASS | `user_notifications(user_id, read) WHERE read = false` -- partial index for unread |

### 3.2 Missing Indexes

| Severity | Missing Index |
|----------|---------------|
| MAJOR | `mc_automation_rules` -- no index on `user_id`. Will full-table scan for user lookups. |
| MAJOR | `mc_task_templates` -- no index on `user_id`. |
| MAJOR | `mc_recurring_tasks` -- no index on `user_id` or `next_run_at`. The `next_run_at` column is critical for cron job performance. |
| MINOR | `mc_task_dependencies` -- no index on `depends_on_task_id` for reverse lookups ("what depends on this task?") |
| MINOR | `kb_feedback` -- no index on `chunk_id` or `document_id` for aggregation queries |
| MINOR | `api_batches` -- no index on `user_id` |
| MINOR | `api_predictions` -- no index on `user_id` |
| MINOR | `analytics_dashboards` -- no index on `user_id` |
| MINOR | `analytics_cohorts` -- no index on `user_id` |
| MINOR | `analytics_reports` -- no index on `user_id` |

---

## 4. FOREIGN KEYS

### 4.1 FK Correctness

| Status | Detail |
|--------|--------|
| PASS | Most FKs use ON DELETE CASCADE appropriately |
| PASS | `mc_tasks.assigned_agent_id` uses ON DELETE SET NULL -- correct, don't delete task if agent removed |
| PASS | `mc_events.task_id/session_id` use ON DELETE SET NULL -- event survives even if parent deleted |
| PASS | `audit_logs.admin_id` uses ON DELETE SET NULL -- audit record survives admin deletion |
| PASS | `mc_comments.parent_id` self-reference with ON DELETE SET NULL -- threaded reply becomes top-level |
| PASS | `mc_task_dependencies` both FKs use ON DELETE CASCADE -- deleting a task cleans up deps |

### 4.2 FK Issues

| Severity | Issue |
|----------|-------|
| **CRITICAL** | `kb_feedback.chunk_id` and `kb_feedback.document_id` have **NO FK constraint**. They are just UUID/UUID columns. If a chunk or document is deleted, orphan feedback rows remain with dangling references. Should be `REFERENCES kb_chunks(id) ON DELETE CASCADE` and `REFERENCES kb_documents(id) ON DELETE CASCADE`. |
| MAJOR | `analytics_daily_summary.user_id` -- has FK reference to `auth.users(id)` but **no ON DELETE CASCADE**. If a user is deleted, their analytics rows become orphans that block the delete or fail depending on FK enforcement mode. |
| MINOR | `mc_task_templates.default_agent_id` is UUID with no FK reference. Can contain stale agent IDs. |
| MINOR | `csat_ratings.conversation_id` is UUID with no FK reference. Acceptable if conversations are on VPS. |

---

## 5. MIGRATION ORDERING

### 5.1 Chronological Order

| Status | Detail |
|--------|--------|
| PASS | Migrations are timestamped in chronological order from 20260307 through 20260316 |
| PASS | Dependencies are respected: `mc_sessions` created before `mc_events` FK added |

### 5.2 Conflicts and Duplicates

| Severity | Issue |
|----------|-------|
| **CRITICAL** | `ALL_NEW_MIGRATIONS.sql` is a **concatenated dump** of multiple individual migration files (auto_responses, webhooks, API, KB, logs, analytics, audit). It duplicates every CREATE TABLE and ALTER TABLE from the individual timestamped migrations. If Supabase runs migrations in filename order, this file (`ALL_...`) sorts AFTER `20260316...` files and will attempt duplicate operations. The `IF NOT EXISTS` / `IF NOT EXISTS` guards prevent hard failures, but duplicate policy creation attempts (wrapped in DO blocks) may error or create duplicate policies. **This file should be deleted.** |
| **CRITICAL** | **Timestamp collision**: `20260315400000` is used for BOTH `multi_model_agent.sql` AND `conversation_intents.sql`. Supabase will only run one, or ordering is undefined. |
| **CRITICAL** | **Timestamp collision**: `20260315500000` is used for BOTH `auto_responses.sql` AND `siem_configs.sql`. Same problem. |
| MAJOR | `webhook_deliveries` table is created in BOTH `20260314100000_pro_tier_features.sql` AND `20260314200000_webhook_deliveries.sql`. The `IF NOT EXISTS` prevents failure, but the schemas differ slightly (indexes are less specific in the second file). |
| MAJOR | `siem_configs` is created in both `20260315500000_siem_configs.sql` and `20260316100000_audit_enhancements.sql`. Different schemas: the first has `enabled`/`updated_at`/no-UNIQUE, the second has `is_enabled`/no-`updated_at`/`UNIQUE(user_id)`. Whichever runs first wins; the second silently does nothing. The `log_alert_rules` table is also created in both with different schemas (first has `conditions JSONB`; second has `condition_type TEXT`, `condition_config JSONB`, etc.). |
| MAJOR | `get_webhook_delivery_stats` function is defined TWICE with **different signatures**: (1) `p_webhook_id UUID, p_days INT` returning JSON, and (2) `p_user_id UUID` returning TABLE. The second `CREATE OR REPLACE` overwrites the first. Callers of the first signature will break. |
| MINOR | `mc_tasks.column_id` default changed from `'inbox'` to `'planning'` in v2 migration, and existing rows are mutated via UPDATE. This is fine for greenfield but risky on existing data. |

### 5.3 Idempotency

| Status | Detail |
|--------|--------|
| PASS | All CREATE TABLE use IF NOT EXISTS |
| PASS | All CREATE INDEX use IF NOT EXISTS |
| PASS | All ALTER TABLE ADD COLUMN use IF NOT EXISTS |
| PASS | All CREATE POLICY wrapped in DO $$ IF NOT EXISTS blocks (in newer migrations) |
| MINOR | Early migrations (20260307, 20260308) create policies without IF NOT EXISTS guard. Re-running will error with "policy already exists". |

---

## 6. TABLE EXISTENCE CHECKLIST

Checking all required tables from the specification:

| Table | Exists | Migration |
|-------|--------|-----------|
| mc_tasks | YES | 20260308000000 |
| mc_agent_status | YES | 20260308000000 |
| mc_events | YES | 20260308000000 |
| mc_sessions | YES | 20260308000000 |
| mc_comments | YES | 20260308000001 |
| mc_reviews | YES | 20260308000001 |
| mc_activities (mc_task_activities) | YES | 20260308000001 |
| mc_task_dependencies | YES | 20260315000001 |
| mc_automation_rules | YES | 20260315000001 |
| mc_task_templates | YES | 20260315000001 |
| mc_recurring_tasks | YES | 20260315000001 |
| mc_task_statuses | YES | 20260315000000 |
| user_onboarding | YES | 20260316200000 |
| user_notifications | YES | 20260316200000 |
| conversation_ratings (as csat_ratings) | YES | 20260316000000 |
| model_change_history | **MISSING** | -- |
| agent_reviews | **MISSING** | -- |
| channel_agent_routing | **MISSING** | -- |
| channel_status_history | **MISSING** | -- |
| custom_domains | **MISSING** | -- |
| scheduled_restarts | **MISSING** | -- |
| ticket_attachments | **MISSING** | -- |
| ticket_status_history | **MISSING** | -- |
| log_alert_rules | YES | 20260315900000 + 20260315500000 |
| log_alert_history | YES | 20260315500000 |
| log_forwarding_config (as log_forwarding) | YES | 20260315900000 |
| audit_log_streams (as siem_configs) | YES | 20260316100000 + 20260315500000 |
| analytics_daily_summary | YES | 20260315300000 |
| saved_log_views (as log_saved_views) | YES | 20260315900000 |
| custom_dashboards (as analytics_dashboards) | YES | 20260316000000 |
| analytics_cohorts | YES | 20260316000000 |
| analytics_report_schedules (as analytics_reports) | YES | 20260316000000 |
| kb_connectors | YES | 20260315800000 |
| kb_feedback | YES | 20260315800000 |
| idempotency_cache | YES | 20260315700000 |
| api_batches | YES | 20260315700000 |
| api_predictions | YES | 20260315700000 |
| api_threads | YES | 20260315700000 |
| api_thread_messages | YES | 20260315700000 |
| auto_responses | YES | 20260315500000 |
| business_hours | YES | 20260315500000 |
| coupons | **MISSING** | -- |
| applied_coupons | **MISSING** | -- |

### 6.1 Missing Tables Summary

**8 tables are completely missing:**
1. `model_change_history` -- for tracking model changes per user
2. `agent_reviews` -- for user reviews of agents (distinct from mc_reviews)
3. `channel_agent_routing` -- for routing rules between channels and agents
4. `channel_status_history` -- for tracking channel connect/disconnect events
5. `custom_domains` -- for user custom domain configuration
6. `scheduled_restarts` -- for VPS scheduled restart configuration
7. `ticket_attachments` -- for support ticket file attachments
8. `ticket_status_history` -- for tracking ticket status changes
9. `coupons` -- for coupon definitions
10. `applied_coupons` -- for tracking which users applied which coupons

---

## 7. SECURITY CONCERNS

### 7.1 SECURITY DEFINER Functions

| Function | Security | Risk |
|----------|----------|------|
| `search_kb_chunks_fts` | DEFINER | Bypasses RLS -- the `WHERE c.user_id = p_user_id` parameter is caller-supplied. A malicious user could pass another user's ID and retrieve their KB chunks. **Should be INVOKER or validate `auth.uid() = p_user_id`.** |
| `search_kb_chunks_vector` | DEFINER | Same vulnerability as above. |
| `get_webhook_delivery_stats` (first version) | DEFINER | Accepts `p_webhook_id` without user ownership check. User could query another user's webhook stats. |
| `get_analytics_usage` | INVOKER | PASS -- correctly changed from DEFINER in the fixes migration. |
| `increment_api_key_usage` | INVOKER | PASS |
| `increment_webhook_failure` | INVOKER | PASS |
| `increment_api_key_daily_usage` | INVOKER | PASS |
| `search_kb_chunks_hybrid` | INVOKER | PASS |

### 7.2 Missing WITH CHECK Clauses

Several `FOR ALL` policies only specify `USING` without `WITH CHECK`:
- `mc_tasks`, `mc_agent_status`, `mc_sessions`, `mc_comments`, `mc_reviews`, `mc_task_activities`
- This means INSERT operations do not validate that the new row's `user_id` matches `auth.uid()`. A user could theoretically insert a row with another user's `user_id`.
- Later migrations (webhooks, auto_responses, business_hours, siem_configs) correctly use both `USING` and `WITH CHECK`. The earlier migrations should be updated.

**Note:** In PostgreSQL, when `WITH CHECK` is omitted for `FOR ALL`, the `USING` expression is used for both. So this is actually safe in practice -- the `USING` clause doubles as `WITH CHECK`. This is not a real vulnerability but worth noting for clarity.

---

## 8. CRITICAL ISSUES SUMMARY

| # | Severity | Issue | Fix Required |
|---|----------|-------|--------------|
| 1 | CRITICAL | `channel_credentials` has no `user_id` and no RLS policies | Add `user_id` column + FK + RLS policy, or document as service-role-only |
| 2 | CRITICAL | `ALL_NEW_MIGRATIONS.sql` is a duplicate concatenation that will cause conflicts | Delete this file |
| 3 | CRITICAL | Timestamp collision: `20260315400000` used by 2 files | Rename one to a unique timestamp |
| 4 | CRITICAL | Timestamp collision: `20260315500000` used by 2 files | Rename one to a unique timestamp |
| 5 | CRITICAL | `kb_feedback.chunk_id` and `document_id` have no FK constraints | Add REFERENCES with ON DELETE CASCADE |
| 6 | CRITICAL | SECURITY DEFINER functions accept `p_user_id` without validation | Change to INVOKER or add `auth.uid()` check |
| 7 | CRITICAL | `siem_configs` and `log_alert_rules` defined twice with conflicting schemas | Reconcile into single authoritative schema |

---

## 9. MAJOR ISSUES SUMMARY

| # | Issue | Fix |
|---|-------|-----|
| 1 | `agent_analytics.user_id` is nullable | Add NOT NULL constraint |
| 2 | `agent_analytics`, `mc_tasks`, etc. reference `public.users(id)` not `auth.users(id)` | Standardize FK references |
| 3 | 10 missing tables from spec | Create migration for missing tables |
| 4 | `mc_tasks.column_id`, `priority`, `mc_events.severity`, `mc_agent_status.status` lack CHECK constraints | Add CHECK constraints |
| 5 | `mc_reviews` lacks UNIQUE constraint per reviewer per task | Add UNIQUE(task_id, reviewer) |
| 6 | `analytics_daily_summary.user_id` missing ON DELETE CASCADE | Add ON DELETE CASCADE |
| 7 | `mc_automation_rules`, `mc_task_templates`, `mc_recurring_tasks` missing user_id indexes | Create indexes |
| 8 | `mc_recurring_tasks` missing `next_run_at` index (critical for cron) | Create index |
| 9 | `webhook_deliveries` created twice with slightly different schemas | Consolidate |
| 10 | `get_webhook_delivery_stats` overwritten with incompatible signature | Reconcile or rename |
| 11 | Several tables (`api_batches`, `api_predictions`, `analytics_*`) missing user_id indexes | Create indexes |
| 12 | `kb_documents` and `kb_chunks` RLS only allows SELECT -- no INSERT/UPDATE/DELETE via client | Add policies or document as service-role-only |

---

## 10. MINOR ISSUES SUMMARY

| # | Issue |
|---|-------|
| 1 | `csat_ratings.agent_id` is TEXT instead of UUID |
| 2 | `conversation_intents.conversation_id` is TEXT instead of UUID |
| 3 | Early migration policies lack IF NOT EXISTS guards -- not idempotent |
| 4 | `mc_task_templates.default_agent_id` has no FK reference |
| 5 | `mc_task_dependencies` missing reverse lookup index on `depends_on_task_id` |
| 6 | `user_onboarding` missing INSERT policy (must be service-role created) |
| 7 | `user_notifications` missing INSERT/DELETE policy |
| 8 | `kb_feedback` missing indexes on `chunk_id` and `document_id` |
| 9 | `api_batches.status` and `api_predictions.status` lack CHECK constraints |

---

## 11. RECOMMENDATIONS

### Immediate (before next deploy)

1. **Delete `ALL_NEW_MIGRATIONS.sql`** -- it will cause duplicate DDL execution
2. **Fix timestamp collisions** -- rename `20260315400000_conversation_intents.sql` to `20260315450000` and `20260315500000_siem_configs.sql` to `20260315550000`
3. **Add FK constraints to `kb_feedback`** for `chunk_id` and `document_id`
4. **Add `user_id` to `channel_credentials`** or add a comment/policy documenting it as service-role-only
5. **Change SECURITY DEFINER functions to INVOKER** or add `IF auth.uid() != p_user_id THEN RAISE EXCEPTION` guards

### Short-term (next sprint)

6. Create migration for the 10 missing tables
7. Add CHECK constraints to MC tables (`column_id`, `priority`, `severity`, `status`)
8. Add missing indexes on `mc_automation_rules`, `mc_task_templates`, `mc_recurring_tasks`, `api_batches`, `api_predictions`, `analytics_*` tables
9. Reconcile duplicate `siem_configs` and `log_alert_rules` schemas
10. Add NOT NULL to `agent_analytics.user_id`
11. Add ON DELETE CASCADE to `analytics_daily_summary.user_id`

### Long-term

12. Standardize all FK references to either `auth.users(id)` or `public.users(id)` consistently
13. Add `updated_at` columns to tables that support mutation but lack them
14. Consider adding `created_at` indexes on high-volume tables for time-range queries
15. Add `UNIQUE(task_id, reviewer)` to `mc_reviews` to prevent duplicate reviews

---

## 12. MIGRATION FILE INVENTORY

| # | Timestamp | Name | Tables Created | Tables Altered |
|---|-----------|------|----------------|----------------|
| 1 | 20260307000000 | analytics_health_credentials_audit | agent_analytics, channel_credentials, audit_logs | channels |
| 2 | 20260308000000 | mission_control | mc_tasks, mc_events, mc_agent_status, mc_sessions | mc_events (FK) |
| 3 | 20260308000001 | mission_control_v2 | mc_comments, mc_reviews, mc_task_activities | mc_tasks |
| 4 | 20260308100000 | add_ultra_plan | -- | subscriptions |
| 5 | 20260308200000 | knowledge_base | kb_documents, kb_chunks | -- |
| 6 | 20260308300000 | kb_fulltext_search | -- | kb_chunks |
| 7 | 20260308400000 | analytics_rpc | -- (RPC only) | -- |
| 8 | 20260308500000 | analytics_fixes | -- (RPC replace + indexes) | -- |
| 9 | 20260308600000 | api_keys | api_keys | agent_analytics |
| 10 | 20260308700000 | api_key_fixes | -- (RPC only) | -- |
| 11 | 20260309100000 | gateway_token | -- | vps_instances |
| 12 | 20260309200000 | audit_log_user_actions | -- | audit_logs |
| 13 | 20260309300000 | gateway_token_repair | -- | vps_instances |
| 14 | 20260309400000 | webhooks | webhooks | -- |
| 15 | 20260309500000 | webhook_helpers | -- (RPC only) | -- |
| 16 | 20260309600000 | cloud_models | -- | available_models |
| 17 | 20260314000000 | ticket_read_tracking | -- | support_tickets |
| 18 | 20260314100000 | pro_tier_features | webhook_deliveries, api_key_usage_daily | kb_chunks, kb_documents |
| 19 | 20260314200000 | webhook_deliveries | webhook_deliveries (dup) | -- |
| 20 | 20260314300000 | kb_retrieval_tracking | -- | kb_documents |
| 21 | 20260315000000 | mc_task_statuses | mc_task_statuses | -- |
| 22 | 20260315000001 | mc_advanced_features | mc_task_dependencies, mc_automation_rules, mc_task_templates, mc_recurring_tasks | -- |
| 23 | 20260315100000 | vps_data_api_token | -- | vps_instances |
| 24 | 20260315200000 | ticket_resolved_at | -- | support_tickets |
| 25 | 20260315300000 | analytics_daily_summary | analytics_daily_summary | -- |
| 26 | 20260315400000 | multi_model_agent | -- | user_agents |
| 27 | 20260315400000 | conversation_intents **(COLLISION)** | conversation_intents | -- |
| 28 | 20260315500000 | auto_responses | auto_responses, business_hours | -- |
| 29 | 20260315500000 | siem_configs **(COLLISION)** | siem_configs, log_alert_rules, log_alert_history | -- |
| 30 | 20260315600000 | webhook_enhancements | -- | webhooks, webhook_deliveries |
| 31 | 20260315700000 | api_enhancements | idempotency_cache, api_threads, api_thread_messages, api_batches, api_predictions | agent_analytics |
| 32 | 20260315800000 | kb_enhancements | kb_feedback, kb_connectors | kb_chunks, kb_documents |
| 33 | 20260315900000 | logs_enhancements | log_saved_views, log_alert_rules (dup), log_forwarding | -- |
| 34 | 20260316000000 | analytics_enhancements | csat_ratings, analytics_dashboards, analytics_cohorts, analytics_reports | -- |
| 35 | 20260316100000 | audit_enhancements | siem_configs (dup) | audit_logs, users |
| 36 | 20260316200000 | onboarding_notifications | user_onboarding, user_notifications | -- |
| -- | N/A | ALL_NEW_MIGRATIONS.sql **(DELETE)** | All from 28-35 duplicated | -- |

---

**END OF REVIEW**
