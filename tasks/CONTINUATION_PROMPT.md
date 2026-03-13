# Full Continuation Context — ClawHQ Deploy Page

Paste this entire prompt into a new Claude Code conversation to continue where we left off.

---

## PROJECT OVERVIEW

ClawHQ is a managed OpenClaw hosting SaaS. The admin dashboard (`app.clawhq.tech`) lets admins provision fresh Ubuntu VPS servers into fully running OpenClaw instances via the **Deploy page** (`/admin/deploy`).

The project is a Next.js 15 App Router app with TypeScript, shadcn/ui, Supabase (auth + DB), Tailwind CSS. See `CLAUDE.md` for full conventions.

**CRITICAL**: NEVER expose backend infrastructure (Ollama, Hostinger, Blackbox, vLLM, etc.) in UI, API responses, error messages, or comments.

---

## WHAT'S FULLY WORKING

### Deploy Page UI (`dashboard/src/components/dashboard/admin-deploy.tsx`)
- Customer dropdown (searchable combobox with shadcn Command+Popover)
- Form: VPS IP, SSH User (default: root), SSH Password, SSH Port (default: 22), Subdomain (.clawhq.tech), Email (auto-fills from selected customer)
- Warning if customer already has a VPS

### Polling System (replaces earlier broken SSE approach)
- **POST** `/api/admin/provision` — starts background job, returns `{ jobId }` immediately
- **GET** `/api/admin/provision?jobId=xxx&_t=timestamp` — polls every 2 seconds, returns job with steps array
- `provision-store.ts` uses `globalThis.__provisionJobs` (Map) to survive Next.js dev hot reloads
- `Cache-Control: no-store` headers + `&_t=Date.now()` cache buster on all GET requests
- `export const dynamic = "force-dynamic"` on the route

### Live Progress in Frontend
- 14 step icons (green ✓ / yellow spinner / red ✗ / grey pending)
- Logs panel with auto-scroll, color-coded entries
- Yellow warning banner during provisioning
- `beforeunload` prevents accidental tab close

### Navigate Away + Resume
- On mount, component checks `GET /api/admin/provision` (no jobId) for active jobs
- If found, restores steps + reconstructs logs from server-stored step data
- Polling resumes automatically
- After provisioning COMPLETES, navigating away shows fresh form (no stale data)

### Provisioning Steps 0-14 (15 total steps)
- Step 0: DNS record via Cloudflare API (`lib/cloudflare.ts`)
- Step 1: Open firewall ports (provider API — auto-find VM by IP, open 22/80/443, sync)
- Step 2: Test SSH connection
- Step 3: System update (with `WAIT_APT` for dpkg lock)
- Step 4: Install Node.js 22 (OpenClaw requires ≥22)
- Step 5: Install OpenClaw (official installer + fallbacks)
- Step 6: Generate secure password
- Step 7: Write gateway config to `~/.openclaw/openclaw.json`
- Step 8: Create + enable systemd service
- Step 9: Start gateway (20 retries × 5s for 33-second startup)
- Step 10: Install Nginx (with `WAIT_APT`)
- Step 11: Configure Nginx reverse proxy (WebSocket support, CSP headers)
- Step 12: Setup OS firewall (ufw allow 22,80,443)
- Step 13: Setup SSL via certbot (with `WAIT_APT`)
- Step 14: Verify via `curl https://hostname/`

### Admin Tickets Page (separate from deploy, fully built)
- `/admin/tickets` — list all tickets with status filters + search
- `/admin/tickets/[id]` — thread view with admin reply + status/priority controls
- API at `/api/admin/tickets/[id]` — POST reply, PATCH status/priority

---

## CURRENT ISSUES TO FIX

### Issue 1: Step 8 (Start Gateway) — Timing
**Problem**: The OpenClaw gateway takes ~33 seconds to start listening on port 18789. Previous health check timed out.

**Current fix (needs testing)**: Retry curl 20 times × 5 seconds = up to 105 seconds total wait:
```
systemctl restart openclaw-gateway && sleep 5 && systemctl is-active openclaw-gateway && (for i in $(seq 1 20); do curl -sf http://127.0.0.1:18789/ > /dev/null && exit 0; echo "Waiting for gateway... attempt $i"; sleep 5; done; exit 1) && echo 'Gateway running on port 18789'
```

**VPS gateway startup logs showing the 33-second delay**:
```
Mar 06 00:22:04 srv1301740 systemd[1]: Started openclaw-gateway.service
Mar 06 00:22:37 srv1301740 openclaw[6621]: [gateway] listening on ws://127.0.0.1:18789, ws://[::1]:18789
Mar 06 00:22:37 srv1301740 openclaw[6621]: [gateway] security warning: dangerous config flags enabled: gateway.controlUi.allowInsecureAuth=true, gateway.controlUi.dangerouslyDisableDeviceAuth=true
Mar 06 00:22:37 srv1301740 openclaw[6621]: [browser/server] Browser control listening on http://127.0.0.1:18791/ (auth=password)
```

### Issue 2: OpenClaw UI shows "device identity required"
**Problem**: After all 14 steps complete and `https://yashash.clawhq.tech` is live, the OpenClaw Control UI shows:
- "Disconnected from gateway"
- "device identity required" (red badge)
- "Health Offline"

**What we know from OpenClaw docs**:
1. `dangerouslyDisableDeviceAuth: true` IS set in config (gateway logs confirm it)
2. OpenClaw supports `?password=xxx` in the URL — the Control UI reads the password from URL query params, authenticates, then strips it from the address bar via `history.replaceState`. Password is NOT persisted (unlike token which saves to localStorage). Source: https://github.com/openclaw/openclaw/issues/7978
3. Auth modes from config reference: `none | token | password | trusted-proxy`
   - `token`: shared secret via header, persisted in localStorage
   - `password`: credential-based, NOT persisted
4. `bind` options: `auto | loopback | lan | tailnet | custom`
   - `loopback` = 127.0.0.1 only. We tried this but it broke Step 8 (gateway wouldn't respond to curl).
   - `lan` = 0.0.0.0 (all interfaces). This works for Step 8.

**What we've tried**:
1. `dangerouslyDisableDeviceAuth: true` — set but device identity error persists
2. `auth.mode: "token"` with `auth.token` — didn't fix device identity
3. `auth.mode: "password"` with `auth.password` — current setting
4. `bind: "loopback"` — broke gateway (curl couldn't reach it). Reverted to `bind: "lan"`.
5. Removed `trustedProxies: ["127.0.0.1"]` — current state. Theory: without trustedProxies, gateway sees Nginx connections as local (127.0.0.1) and auto-approves device auth.

**What hasn't been tested yet**:
1. Re-provision with current config (no trustedProxies + bind lan + 20 retries for Step 8) — the user needs to reset VPS and re-provision
2. After provisioning, opening `https://yashash.clawhq.tech/?password=THE_PASSWORD`
3. If `?password=` doesn't work, try `?token=` instead (token mode persists to localStorage)

**Possible root causes**:
- The `trustedProxies` removal might fix device auth by making all connections appear local
- Or the `?password=` URL parameter is needed for browser auth regardless of device auth config
- Or there's a WebSocket-specific auth issue that HTTP curl doesn't catch
- The gateway logs show `Chrome extension relay init failed: Error: extension relay requires gateway auth token` — maybe token auth mode is needed for full functionality

---

## ALL FILES AND THEIR CURRENT COMPLETE CODE

### File: `dashboard/src/lib/provision.ts`
Full current code is in the repo. Key points:
- `WAIT_APT` constant: loops `fuser /var/lib/dpkg/lock-frontend` until lock released
- `runStep()`: no timeout, runs until command succeeds or fails naturally
- Step 4 (Install OpenClaw): `rm -f /usr/local/bin/openclaw` (remove old symlink) → official installer with `|| true` (tty failure) → `command -v openclaw` to find binary → `readlink -f` to resolve symlink → `ln -sf` to `/usr/local/bin/` → verify version. All joined with `;` (not `&&`) so chain doesn't break.
- Gateway config: `bind: "lan"`, `auth.mode: "password"`, `dangerouslyDisableDeviceAuth: true`, no `trustedProxies`
- Step 8: 20 retries × 5 seconds for curl health check

### File: `dashboard/src/lib/provision-store.ts`
```typescript
// Uses globalThis to survive Next.js hot reloads
const globalForJobs = globalThis as unknown as { __provisionJobs: Map<string, ProvisionJob> };
if (!globalForJobs.__provisionJobs) {
  globalForJobs.__provisionJobs = new Map<string, ProvisionJob>();
}
const jobs = globalForJobs.__provisionJobs;
```

### File: `dashboard/src/app/api/admin/provision/route.ts`
- `export const dynamic = "force-dynamic"`
- POST: auth check → create job → start `runProvisioning()` (not awaited) → return `{ jobId }`
- GET: `Cache-Control: no-store` headers. With jobId returns job. Without jobId returns active job or `{ status: "idle" }`.
- `runProvisioning()`: Step 0 DNS → `provisionVPS()` → save to DB on success

### File: `dashboard/src/components/dashboard/admin-deploy.tsx`
- Polling effect: `useEffect` with `[jobId, provisioning, addLog]` deps (NOT `steps`)
- Uses `stepsRef` (ref) for log diffing, not state
- Polls immediately on effect start, then every 2 seconds
- Resume effect: on mount, fetches active job, reconstructs logs from steps
- Customer email auto-fills on selection
- Popover has `z-50` for z-index

### File: `dashboard/src/app/admin/deploy/page.tsx`
Server component fetching customers with `createAdminClient()`.

### File: `dashboard/src/lib/cloudflare.ts`
Creates Cloudflare A records for `subdomain.clawhq.tech`.

---

## ALL ERRORS ENCOUNTERED AND HOW THEY WERE FIXED

1. **Step 4 "openclaw: command not found"**: npm global bin not in SSH PATH → Fixed by symlinking to `/usr/local/bin/`
2. **Step 4 with Node.js 20**: OpenClaw requires ≥22 → Fixed by upgrading to Node.js 22
3. **Step 4 "/dev/tty: No such device or address"**: Installer's onboard step needs TTY → Fixed with `|| true`
4. **Step 4 "Too many levels of symbolic links"**: `ln -sf` on existing symlink creates self-referencing loop → Fixed by `rm -f /usr/local/bin/openclaw` first
5. **Step 4 "openclaw binary not found"**: npm installs binary as symlink, `find -type f` skips symlinks → Fixed by using `command -v` + `readlink -f` instead of `find`
6. **Step 4 `&&` chain breaking**: `command -v` exit code 1 stops `&&` chain → Fixed by joining with `;` instead of `&&`
7. **Frontend not updating (SSE)**: Next.js dev server buffers SSE responses → Replaced with polling approach
8. **Frontend not updating (polling)**: Next.js dev mode gives POST and GET different Map instances → Fixed with `globalThis.__provisionJobs`
9. **Browser caching GET responses**: Same URL returns stale data → Fixed with `Cache-Control: no-store` + `&_t=Date.now()` + `export const dynamic = "force-dynamic"`
10. **Step 9 "dpkg lock"**: `unattended-upgrades` holds apt lock on fresh VPS → Fixed with `WAIT_APT` loop
11. **Step 8 "failed: active"**: Gateway running but curl fails (not ready yet) → Fixed with 20-retry loop (5s intervals)
12. **Step 8 with `bind: loopback`**: Gateway starts but curl to 127.0.0.1:18789 fails → Reverted to `bind: "lan"`
13. **OpenClaw "origin not allowed"** (earlier session): Missing hostname in allowedOrigins → Fixed by adding `https://${config.hostname}`
14. **OpenClaw "device identity required"**: Current unsolved issue — see Issue 2 above

---

## VPS DETAILS
- Test VPS IP: `72.61.232.87`
- Subdomain: `yashash.clawhq.tech`
- Test customer UUID: `47d5ba49-1f5b-4e19-86f2-513d405e81fd`
- Admin user UUID: `bb3f5061`

## DATABASE
- `vps_instances` table: `user_id`, `ip_address`, `ssh_user`, `ssh_password`, `ssh_port`, `hostname`, `openclaw_dashboard_url` (base URL without password), `openclaw_password`, `status`

## WHAT TO DO NEXT
1. **Test current state**: Reset VPS, restart `npm run dev`, re-provision. Step 8 should now pass with the 20-retry fix. After all 14 steps green, try `https://yashash.clawhq.tech/?password=THE_PASSWORD`
2. **If device identity error persists**: Investigate further. Possible fixes:
   - Try `auth.mode: "token"` with `?token=` in URL (token gets persisted in localStorage)
   - Check if Nginx needs to forward specific headers for WebSocket device auth
   - Check OpenClaw logs on VPS: `journalctl -u openclaw-gateway --no-pager -n 100`
   - Consider using `auth.mode: "none"` with firewall-only security (loopback bind + Nginx)
3. **After deploy works end-to-end**: Move to backlog items in `tasks/BACKLOG.md`

## OTHER COMPLETED ADMIN PAGES (for context, not the focus)
- `/admin` — Stats page with cards
- `/admin/customers` — Customer list with search
- `/admin/customers/[id]` — Customer detail
- `/admin/tickets` — Ticket list with status filters
- `/admin/tickets/[id]` — Ticket thread with admin reply
