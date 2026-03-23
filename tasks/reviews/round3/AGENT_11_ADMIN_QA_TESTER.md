# Agent 11 — Admin Panel — QA Tester Review

**Total Issues Found: 14**
- CRITICAL: 3
- HIGH: 4
- MEDIUM: 5
- LOW: 2

---

### [QA-01] — Destructured useState produces broken variable name; all VPS action buttons are permanently disabled/broken
**File:** `src/components/dashboard/admin-customer-detail.tsx:387`
**Description:** The state declaration uses an invalid destructuring with a default value assignment:
```ts
const [checkPendingRef = { current: false }, setActionLoading] = useState<string | null>(null);
```
`checkPendingRef` gets the initial value `null` from useState, then the default `{ current: false }` kicks in (since null is falsy in destructuring). But the variable name `checkPendingRef` is used throughout lines 761-843 with comparisons like `checkPendingRef = { current: false } === "restart_openclaw"` — these are **assignments inside JSX expressions**, not comparisons. Every `disabled={!!checkPendingRef = { current: false }}` is an assignment expression that evaluates to `{ current: false }`, which is always truthy. This means **all VPS action buttons (restart, stop, start, view logs) are permanently disabled** and the loading spinner logic is completely broken.
**Severity:** CRITICAL
**Steps to Reproduce:** Navigate to any customer detail page with a VPS. All action buttons (Restart OpenClaw, Restart Nginx, Stop, Start, View Logs) will be disabled and non-functional.
**Expected vs Actual:** Expected: Buttons are enabled when no action is in progress and show a spinner during execution. Actual: All buttons are permanently disabled because `!!{ current: false }` is always `true`.

---

### [QA-02] — MRR calculation queries missing `billing_cycle` column
**File:** `src/app/admin/page.tsx:54`
**Description:** The Supabase query fetches only `price, plan` for active subscriptions:
```ts
admin.from("subscriptions").select("price, plan").eq("status", "active"),
```
But line 71 accesses `sub.billing_cycle`:
```ts
const cycle = sub.billing_cycle === "annual" ? price / 12 : price;
```
Since `billing_cycle` is not in the SELECT, it will always be `undefined`, so the ternary always takes the `else` branch (`price`). Annual subscriptions are counted at their full annual price as if they were monthly, inflating MRR.
**Severity:** HIGH
**Steps to Reproduce:** Have any customer with an annual subscription. View the admin overview page.
**Expected vs Actual:** Expected: Annual subscription of $599/yr shows as ~$50/mo MRR. Actual: Shows as $599/mo MRR because `billing_cycle` is undefined.

---

### [QA-03] — MRR by plan also ignores billing cycle
**File:** `src/app/admin/page.tsx:77-80`
**Description:** The `mrrByPlan` calculation sums the raw `price` without adjusting for billing cycle:
```ts
mrrByPlan[plan] = (mrrByPlan[plan] || 0) + (Number(sub.price) || 0);
```
Even if QA-02 were fixed (adding `billing_cycle` to the select), this secondary calculation still doesn't divide annual prices by 12. The per-plan MRR figures shown under each plan card would be wrong.
**Severity:** MEDIUM
**Steps to Reproduce:** View admin overview with mixed monthly/annual subscribers.
**Expected vs Actual:** Expected: MRR per plan reflects monthly equivalent. Actual: Annual prices are added as-is.

---

### [QA-04] — Ticket reply response missing `messageId`, client falls back to random UUID
**File:** `src/app/api/admin/tickets/[id]/route.ts:87` and `src/components/dashboard/admin-ticket-thread.tsx:131`
**Description:** The POST handler returns `{ success: true }` but the client code expects `data.messageId`:
```ts
// Client (line 131):
id: data.messageId || crypto.randomUUID(),
```
The API inserts a message and even selects its ID (`select("id").single()` on line 62-66) into `msgData`, but never includes it in the response. The client always falls back to `crypto.randomUUID()`, meaning the optimistic message has a different ID than the database row. If the UI later refetches messages or does any ID-based deduplication, duplicates will appear.
**Severity:** MEDIUM
**Steps to Reproduce:** Reply to any ticket as admin. The optimistic message gets a random UUID instead of the actual database ID.
**Expected vs Actual:** Expected: Server returns `{ success: true, messageId: "actual-db-uuid" }`. Actual: Returns only `{ success: true }`.

---

### [QA-05] — No subdomain input validation before DNS creation
**File:** `src/app/api/admin/provision/route.ts:44-59`
**Description:** The subdomain field is used directly in DNS record creation without any validation or sanitization. A malicious or mistaken admin could supply subdomains with special characters, spaces, or excessively long strings. The `createSubdomain` function in cloudflare.ts directly interpolates it into `${subdomain}.clawhq.tech` and uses it in SSL certificate generation (`-subj '/CN=${config.hostname}'` in provision-v3.ts:246). A subdomain containing a single quote could break the SSH command for SSL cert generation.
**Severity:** HIGH
**Steps to Reproduce:** Call POST `/api/admin/provision` with `subdomain: "test'$(whoami)"` or `subdomain: "a b c"`.
**Expected vs Actual:** Expected: Validation rejects invalid subdomains (must be alphanumeric + hyphens, no leading/trailing hyphens, max 63 chars). Actual: Value is passed through to Cloudflare API and SSH commands unvalidated.

---

### [QA-06] — Provisioning SSH password used in shell command without proper escaping
**File:** `src/lib/provision-v3.ts:290` (nginx config step) and throughout
**Description:** The dashboard password is embedded directly into nginx config map blocks via template strings:
```ts
`    "${embedKey}" 1;`,
```
While the password is generated from `randomBytes(12).toString("base64url")` which avoids shell-dangerous characters, the SSH password provided by the admin in the provision request (`sshPassword`) is passed to `ssh.connect()` via the node-ssh library which handles it properly. However, if the `dashboardPassword` generation ever changes or if `embedKey` contains a double quote, the nginx config would break. More critically, per CLAUDE.md rule #12: "Avoid `!` in passwords over SSH — bash history expansion escapes it" — but there is no validation that the admin-provided `sshPassword` doesn't contain `!`.
**Severity:** MEDIUM
**Steps to Reproduce:** Provision a VPS where the SSH password contains `!` or other bash special characters.
**Expected vs Actual:** Expected: The SSH connection and all commands work correctly. Actual: node-ssh handles the connect password correctly, but if the password is ever used in a shell command string, it could break.

---

### [QA-07] — Provisioning pipeline has no SSH connection timeout cleanup on long-running steps
**File:** `src/lib/provision-v3.ts:70-300+`
**Description:** The SSH connection is opened at step 2 and kept alive through all remaining steps (3-13). Steps like "Pull Docker image" (step 5) or "Install Nginx" (step 9) can take 5-10+ minutes each. If the SSH connection drops mid-provisioning, the error is caught, but the job is marked as failed without attempting any cleanup of partially provisioned state (e.g., a half-configured nginx, a running Docker container with no SSL). There's no rollback mechanism.
**Severity:** MEDIUM
**Steps to Reproduce:** Start provisioning a VPS. Kill the VPS's SSH daemon or cause a network interruption during step 9 (Install Nginx).
**Expected vs Actual:** Expected: Provisioning fails cleanly with rollback or clear indication of partial state. Actual: Job marked failed but VPS is left in a partially configured state. Re-provisioning the same VPS might conflict with existing Docker containers or nginx configs.

---

### [QA-08] — `getActiveJob()` only returns the first running job, concurrent provision attempts could lose track
**File:** `src/lib/provision-store.ts:61-66`
**Description:** The `getActiveJob()` function iterates and returns the first job with `status === "running"`. While the POST handler checks for an active job before creating a new one (line 63-68 of provision route), there is a TOCTOU (time-of-check-time-of-use) race: two near-simultaneous POST requests could both call `getActiveJob()`, both see `undefined`, and both create jobs. The second `createJob` would succeed, but `getActiveJob()` would only return one of them, making the other invisible to the polling UI.
**Severity:** HIGH
**Steps to Reproduce:** Send two POST requests to `/api/admin/provision` simultaneously (e.g., rapid double-click on deploy button).
**Expected vs Actual:** Expected: Only one job runs at a time. Actual: Both could start, and one becomes orphaned with no way to monitor or cancel it.

---

### [QA-09] — Bulk suspend updates subscription but doesn't actually stop VPS processes via SSH
**File:** `src/app/api/admin/customers/bulk/route.ts:40-44`
**Description:** When bulk suspending, the code updates the `vps_instances` table status to "stopped":
```ts
await admin.from("vps_instances").update({ status: "stopped" }).in("user_id", userIds).eq("status", "running");
```
But this only changes the database record. It doesn't SSH into each VPS to actually stop the OpenClaw gateway or Docker container. The VPS continues running, serving traffic, and consuming resources. The database just says "stopped" — a lie.
**Severity:** HIGH
**Steps to Reproduce:** Select multiple customers in the admin panel and click "Suspend". Check if their VPS instances are still accessible.
**Expected vs Actual:** Expected: VPS processes are actually stopped. Actual: Only the database status is changed; the VPS continues running.

---

### [QA-10] — Admin overview page has no error handling for failed Supabase queries
**File:** `src/app/admin/page.tsx:36-66`
**Description:** The admin overview does `Promise.all()` on 14 Supabase queries and destructures the results directly. If any query returns an `error` (e.g., table doesn't exist, RLS issue, network timeout), the destructured `count` or `data` will be `null`/`undefined` but no error is shown to the admin. The page renders with zeros and empty lists, giving the false impression that everything is fine. Worse, if `Promise.all()` throws (unlikely with Supabase client but possible), the entire page crashes with an unhandled server-side error.
**Severity:** MEDIUM
**Steps to Reproduce:** Cause a Supabase query failure (e.g., rename a table, revoke permissions). View the admin overview page.
**Expected vs Actual:** Expected: Admin sees an error message indicating data couldn't be loaded. Actual: Page silently shows 0s and empty lists.

---

### [QA-11] — CSV export doesn't escape commas or quotes in customer data
**File:** `src/components/dashboard/admin-customers.tsx:185`
**Description:** The CSV export wraps values in double quotes:
```ts
const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
```
But if a customer's name or email contains a double quote character (e.g., `John "Johnny" Doe`), the CSV will be malformed. The value `"John "Johnny" Doe"` breaks CSV parsing. Double quotes inside quoted CSV fields must be escaped by doubling them (`""Johnny""`).
**Severity:** LOW
**Steps to Reproduce:** Have a customer with a double quote in their name. Click "Export CSV" on the customers page.
**Expected vs Actual:** Expected: Valid CSV with escaped quotes. Actual: Broken CSV file.

---

### [QA-12] — `useEffect` missing dependency in admin-api-keys and admin-dashboard-auth
**File:** `src/components/dashboard/admin-api-keys.tsx:77-79` and `src/components/dashboard/admin-dashboard-auth.tsx:36-38`
**Description:** Both components have `useEffect` with `fetchKeys`/`fetchCredentials` called inside but not listed in the dependency array. The `useEffect` depends on `[userId]` but the fetch functions are recreated on every render (they're not wrapped in `useCallback`). While this doesn't cause a functional bug (the effect correctly runs when `userId` changes), it violates React's exhaustive-deps rule and could cause stale closure issues if the component is modified later. The ESLint rule would flag this.
**Severity:** LOW
**Steps to Reproduce:** Run `npm run lint` with exhaustive-deps enabled.
**Expected vs Actual:** Expected: No lint warnings. Actual: React hook dependency warnings.

---

### [QA-13] — API keys DELETE route silently swallows SSH errors when re-pushing remaining keys
**File:** `src/app/api/admin/api-keys/route.ts:233-247`
**Description:** After deleting a key from the database, the code re-pushes remaining keys to the VPS via SSH. If this SSH operation fails, the error is completely swallowed — `configureApiKeys` is called with `await` but the result is not checked. The API returns `{ success: true }` even though the VPS still has the old (now-deleted) key configured.
**Severity:** MEDIUM (was noted but only partially fixed by ADMIN_MED_06 which only checks the DB delete, not the SSH push)
**Steps to Reproduce:** Delete an API key when the customer's VPS is unreachable (e.g., stopped). The key is removed from the database but remains configured on the VPS.
**Expected vs Actual:** Expected: Response indicates SSH configuration failed, or at minimum logs a warning. Actual: Returns success with no indication of the SSH failure.

---

### [QA-14] — Provision route POST does not validate `sshPort` type/range
**File:** `src/app/api/admin/provision/route.ts:43-59`
**Description:** The `sshPort` from the request body is typed as `number | undefined` but there's no validation that it's actually a valid port number (1-65535). A value like `0`, `-1`, `99999`, or a string that was coerced would be passed to `ssh.connect()` and fail with a confusing error. The fallback `sshPort || 22` on line 83 would also silently default `0` to `22`, which could mask a misconfiguration.
**Severity:** CRITICAL (port 0 silently becomes port 22, potentially connecting to wrong server or masking admin error)
**Steps to Reproduce:** Call POST `/api/admin/provision` with `sshPort: 0` or `sshPort: "abc"`.
**Expected vs Actual:** Expected: Validation error returned to admin. Actual: `0` silently becomes `22`; non-numeric values could cause SSH connection errors with unclear messages.
