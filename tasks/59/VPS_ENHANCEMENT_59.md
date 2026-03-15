# VPS Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 2
**Total features:** 5 + 1 (monitoring build)
**Last updated:** 2026-03-15

---

## CONTEXT: Current VPS Page

**Files:**
- `src/app/dashboard/vps/page.tsx` — server component, fetches VPS + subscription data
- `src/components/dashboard/vps-controls.tsx` — client component with controls, monitoring, logs
- `src/app/api/vps/status/route.ts` — get VPS status
- `src/app/api/vps/start/route.ts`, `stop/route.ts`, `restart/route.ts` — VPS actions
- `src/app/api/vps/monitoring/route.ts` — CPU/RAM/disk/network via SSH
- `src/app/api/vps/logs/route.ts` — fetch logs via SSH
- `src/app/api/vps/gateway-health/route.ts` — check OpenClaw gateway
- `src/app/api/vps/password/route.ts` — change dashboard password
- `src/app/api/vps/ssl-check/route.ts` — check SSL certificate

**Current layout:**
```
┌──────────────────────────────────────────────────────┐
│ VPS Management                                        │
├──────────┬──────────┬──────────┬──────────────────────┤
│ Status   │ Hostname │ IP       │ Controls             │
│ 🟢 Run   │ user.cl  │ 1.2.3.4  │ [Start][Stop][Rest]  │
├──────────┴──────────┴──────────┴──────────────────────┤
│ Monitoring (CPU, RAM, Disk, Network charts)           │
│ ← Pro-gated: Starter sees upgrade prompt              │
├──────────────────────────────────────────────────────┤
│ Logs viewer (on-demand fetch)                         │
├──────────────────────────────────────────────────────┤
│ SSL Checker | Uptime | Dashboard Password | Open OC   │
└──────────────────────────────────────────────────────┘
```

---

## 2.1 CUSTOM DOMAIN MANAGEMENT

### What it is
Users get `username.clawhq.tech` by default. Many want their own domain (e.g., `ai.mycompany.com`). Currently they contact support. Add a self-service custom domain section.

### Current state
- Custom domain is set during provisioning by admin
- Cloudflare DNS is managed via `src/lib/cloudflare.ts`
- SSL cert is generated via Let's Encrypt during provisioning
- User has no UI to change or add domains

### What to build

**NOT full DNS management** — we don't want users managing DNS records. Just:
1. User enters their desired custom domain
2. We show them DNS instructions ("Point an A record to your VPS IP")
3. We verify the DNS is pointing correctly
4. We provision SSL for the new domain
5. We update nginx config on VPS

**Database:**
```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending_dns', -- 'pending_dns', 'dns_verified', 'ssl_provisioning', 'active', 'error'
  ssl_expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);
```

**API endpoints:**

```typescript
// POST /api/vps/domains
// Body: { domain: "ai.mycompany.com" }
// Validates domain format (not IP, not clawhq.tech subdomain, no path)
// Creates record with status "pending_dns"
// Returns: { domain: {...}, dns_instructions: { type: "A", host: "@", value: "1.2.3.4" } }

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain } = await request.json();

  // Validate domain
  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  const cleanDomain = domain.toLowerCase().trim();

  // Must be a valid domain format
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(cleanDomain)) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
  }

  // Can't use clawhq.tech subdomains
  if (cleanDomain.endsWith(".clawhq.tech")) {
    return NextResponse.json({ error: "Cannot use clawhq.tech subdomains" }, { status: 400 });
  }

  // Get VPS IP for DNS instructions
  const admin = createAdminClient();
  const { data: vps } = await admin
    .from("vps_instances")
    .select("ip_address")
    .eq("user_id", user.id)
    .single();

  if (!vps) return NextResponse.json({ error: "No VPS found" }, { status: 404 });

  // Check max 3 custom domains per user
  const { count } = await admin
    .from("custom_domains")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count || 0) >= 3) {
    return NextResponse.json({ error: "Maximum 3 custom domains per account" }, { status: 400 });
  }

  // Insert domain record
  const { data: domainRecord, error } = await admin
    .from("custom_domains")
    .insert({ user_id: user.id, domain: cleanDomain })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") { // unique violation
      return NextResponse.json({ error: "This domain is already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 });
  }

  return NextResponse.json({
    domain: domainRecord,
    dns_instructions: {
      type: "A",
      host: cleanDomain.split(".")[0] === cleanDomain ? "@" : cleanDomain.split(".")[0],
      value: vps.ip_address,
      note: `Point an A record for "${cleanDomain}" to ${vps.ip_address}. This usually takes 5-30 minutes to propagate.`,
    },
  });
}

// POST /api/vps/domains/[id]/verify
// Checks if DNS is pointing to the VPS IP
// If yes: updates status to "dns_verified", triggers SSL provisioning
// If no: returns error with current DNS state

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Auth + get domain record + get VPS IP
  // ...

  // DNS lookup
  const dns = require("dns").promises;
  try {
    const addresses = await dns.resolve4(domainRecord.domain);
    const pointsToVps = addresses.includes(vps.ip_address);

    if (!pointsToVps) {
      return NextResponse.json({
        verified: false,
        current_dns: addresses,
        expected: vps.ip_address,
        message: `Domain currently points to ${addresses.join(", ")}. Expected: ${vps.ip_address}`,
      });
    }

    // DNS verified — update status
    await admin.from("custom_domains").update({
      status: "dns_verified",
      verified_at: new Date().toISOString(),
    }).eq("id", params.id);

    // Trigger SSL provisioning (async — via SSH to VPS)
    provisionSSLForDomain(vps, domainRecord.domain).catch((err) => {
      admin.from("custom_domains").update({
        status: "error",
        error_message: `SSL provisioning failed: ${err.message}`,
      }).eq("id", params.id);
    });

    // Update status to ssl_provisioning
    await admin.from("custom_domains").update({
      status: "ssl_provisioning",
    }).eq("id", params.id);

    return NextResponse.json({
      verified: true,
      message: "DNS verified! SSL certificate is being provisioned...",
    });
  } catch (err) {
    return NextResponse.json({
      verified: false,
      message: `Could not resolve ${domainRecord.domain}. DNS may not be configured yet.`,
    });
  }
}

// SSL provisioning via SSH
async function provisionSSLForDomain(vps: any, domain: string): Promise<void> {
  const ssh = await connect({
    host: vps.ip_address,
    username: vps.ssh_user,
    password: vps.ssh_password,
    port: vps.ssh_port,
  });

  try {
    // 1. Add server block in nginx for the new domain
    await ssh.execCommand(`
      cat > /etc/nginx/sites-enabled/${domain}.conf << 'NGINXEOF'
      server {
        listen 80;
        server_name ${domain};
        location / {
          proxy_pass http://127.0.0.1:18789;
          proxy_set_header Host $host;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-User $remote_user;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
        }
      }
NGINXEOF
    `);

    // 2. Test nginx config
    await ssh.execCommand("nginx -t");

    // 3. Reload nginx
    await ssh.execCommand("systemctl reload nginx");

    // 4. Get SSL certificate via certbot
    await ssh.execCommand(
      `certbot --nginx -d ${domain} --non-interactive --agree-tos --email admin@clawhq.tech`
    );

    // 5. Update domain status to active
    const admin = createAdminClient();
    await admin.from("custom_domains").update({
      status: "active",
      ssl_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    }).eq("domain", domain);
  } finally {
    ssh.dispose();
  }
}

// GET /api/vps/domains — list user's custom domains
// DELETE /api/vps/domains/[id] — remove domain (also removes nginx config + SSL on VPS)
```

**UI — Custom Domain section in VPS page:**

```
┌──────────────────────────────────────────────────────────┐
│ Custom Domains                            [+ Add Domain]  │
├──────────────────────────────────────────────────────────┤
│ 🟢 ai.mycompany.com        Active    SSL: Valid (89 days) │
│    [Remove]                                               │
├──────────────────────────────────────────────────────────┤
│ 🟡 chat.otherdomain.com    Pending DNS                    │
│    Point A record to 1.2.3.4                              │
│    [Verify DNS] [Remove]                                  │
└──────────────────────────────────────────────────────────┘

// "Add Domain" dialog:
// 1. Domain input: "Enter your custom domain (e.g., ai.mycompany.com)"
// 2. On submit → creates record → shows DNS instructions:
//    "Add an A record in your domain's DNS settings:"
//    Type: A
//    Host: ai
//    Value: 1.2.3.4
//    "Once you've added the record, click 'Verify DNS' below."
// 3. "Verify DNS" button → checks DNS → if good → provisions SSL → Active
```

### Files to create
- `src/app/api/vps/domains/route.ts` (GET, POST)
- `src/app/api/vps/domains/[id]/route.ts` (DELETE)
- `src/app/api/vps/domains/[id]/verify/route.ts` (POST)

### Files to modify
- `src/components/dashboard/vps-controls.tsx` — add Custom Domains section

### Testing
1. Add domain "test.example.com" → see DNS instructions
2. DNS not configured → verify fails with helpful message
3. DNS configured → verify succeeds → SSL provisions → status becomes Active
4. Remove domain → nginx config cleaned up
5. Try adding 4th domain → rejected (max 3)
6. Try adding "something.clawhq.tech" → rejected

---

## 2.2 SSL CERTIFICATE ENHANCEMENT

### What it is
Enhance the existing SSL checker to show more info and add management actions.

### Current state
SSL checker shows: valid/invalid status. That's it. No expiry date, no renewal action.

### What to build

**Enhanced SSL display:**

```typescript
// Fetch SSL details via SSH or existing ssl-check API
interface SSLStatus {
  valid: boolean;
  issuer: string;         // "Let's Encrypt"
  expiresAt: string;      // ISO date
  daysRemaining: number;
  autoRenew: boolean;     // certbot auto-renew enabled?
  domains: string[];      // which domains the cert covers
}
```

**API enhancement:**
Update `src/app/api/vps/ssl-check/route.ts` to return richer data:

```typescript
// SSH into VPS, run:
// openssl x509 -in /etc/letsencrypt/live/{domain}/cert.pem -noout -dates -issuer -subject
// Parse output for expiry date, issuer, subject (domains)

// Also check auto-renewal:
// systemctl is-active certbot.timer (or check crontab for certbot renew)
```

**UI — enhanced SSL card:**

```
┌────────────────────────────────────────────────────┐
│ SSL Certificate                                     │
│ 🟢 Valid — Expires in 67 days (May 21, 2026)       │
│ Issuer: Let's Encrypt                               │
│ Covers: user.clawhq.tech, ai.mycompany.com         │
│ Auto-renew: ✅ Enabled                              │
│                                                     │
│ [Renew Now]  ← only show if expiring within 30 days │
└────────────────────────────────────────────────────┘
```

**Color coding:**
- Green: > 30 days remaining
- Yellow: 7-30 days remaining + "Renewing soon" message
- Red: < 7 days or expired + "Renew Now" prominent button

**"Renew Now" action:**
```typescript
// POST /api/vps/ssl-renew
// SSH into VPS → certbot renew --force-renewal
// Returns success/failure
```

### Files to modify
- `src/app/api/vps/ssl-check/route.ts` — return richer data
- `src/components/dashboard/vps-controls.tsx` — enhanced SSL card
- Create `src/app/api/vps/ssl-renew/route.ts` if needed

---

## 2.3 SERVICE STATUS PANEL

### What it is
Show which services are running on the VPS. Users can see at a glance if OpenClaw, nginx, embedding service, or data API are down.

### Current state
The "Gateway Health" check tells if OpenClaw gateway is responding, but nothing about other services. If nginx is down, the user just sees "can't connect" with no indication of what's wrong.

### What to build

**API endpoint:**

```typescript
// GET /api/vps/services
// SSH into VPS, check each service status
// Returns: array of service statuses

export async function GET(request: NextRequest) {
  // Auth + get VPS credentials
  // ...

  const ssh = await connect(creds);
  try {
    const services = await checkServices(ssh);
    return NextResponse.json({ services });
  } finally {
    ssh.dispose();
  }
}

interface ServiceStatus {
  name: string;
  displayName: string;
  status: "running" | "stopped" | "error" | "not_installed";
  uptime?: string;
  port?: number;
  description: string;
}

async function checkServices(ssh: NodeSSH): Promise<ServiceStatus[]> {
  const services: ServiceStatus[] = [];

  // 1. OpenClaw Gateway
  const ocStatus = await checkServiceStatus(ssh, "openclaw", "openclaw-gateway");
  services.push({
    name: "openclaw",
    displayName: "OpenClaw Gateway",
    status: ocStatus.active ? "running" : "stopped",
    uptime: ocStatus.uptime,
    port: 18789,
    description: "AI agent framework — handles chat, agents, channels",
  });

  // 2. Nginx
  const nginxStatus = await checkServiceStatus(ssh, "nginx", "nginx");
  services.push({
    name: "nginx",
    displayName: "Web Server",
    status: nginxStatus.active ? "running" : "stopped",
    uptime: nginxStatus.uptime,
    port: 443,
    description: "Reverse proxy — handles HTTPS, SSL, routing",
  });

  // 3. Embedding Service
  const embedStatus = await checkServiceStatus(ssh, "clawhq-embeddings", "clawhq-embeddings");
  services.push({
    name: "embeddings",
    displayName: "ClawHQ Embeddings",
    status: embedStatus.active ? "running" : embedStatus.installed ? "stopped" : "not_installed",
    uptime: embedStatus.uptime,
    port: 5555,
    description: "Text embedding for knowledge base search",
  });

  // 4. Data API
  const dataApiStatus = await checkServiceStatus(ssh, "clawhq-data-api", "clawhq-data-api");
  services.push({
    name: "data-api",
    displayName: "ClawHQ Data API",
    status: dataApiStatus.active ? "running" : dataApiStatus.installed ? "stopped" : "not_installed",
    uptime: dataApiStatus.uptime,
    port: 5556,
    description: "Local data storage for analytics, logs, KB",
  });

  return services;
}

async function checkServiceStatus(
  ssh: NodeSSH,
  dockerName: string,
  systemdName: string
): Promise<{ active: boolean; uptime?: string; installed: boolean }> {
  // Try Docker first
  const dockerCheck = await ssh.execCommand(
    `docker inspect --format='{{.State.Status}} {{.State.StartedAt}}' ${dockerName} 2>/dev/null`
  );

  if (dockerCheck.code === 0 && dockerCheck.stdout.trim()) {
    const [status, startedAt] = dockerCheck.stdout.trim().split(" ");
    return {
      active: status === "running",
      uptime: startedAt ? formatUptime(new Date(startedAt)) : undefined,
      installed: true,
    };
  }

  // Try systemd
  const systemdCheck = await ssh.execCommand(
    `systemctl is-active ${systemdName} 2>/dev/null`
  );
  const isActive = systemdCheck.stdout.trim() === "active";

  let uptime: string | undefined;
  if (isActive) {
    const uptimeCheck = await ssh.execCommand(
      `systemctl show ${systemdName} --property=ActiveEnterTimestamp 2>/dev/null`
    );
    const match = uptimeCheck.stdout.match(/ActiveEnterTimestamp=(.+)/);
    if (match) uptime = formatUptime(new Date(match[1]));
  }

  // Check if installed
  const installed = systemdCheck.code === 0 || (await ssh.execCommand(
    `systemctl list-unit-files ${systemdName}.service 2>/dev/null`
  )).stdout.includes(systemdName);

  return { active: isActive, uptime, installed };
}

function formatUptime(startDate: Date): string {
  const diffMs = Date.now() - startDate.getTime();
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
```

**UI — Service Status panel:**

```
┌──────────────────────────────────────────────────────────┐
│ Services                                                  │
├──────────────────────────────────────────────────────────┤
│ 🟢 OpenClaw Gateway       Running  ·  Uptime: 5d 12h    │
│    Port 18789 · AI agent framework                        │
├──────────────────────────────────────────────────────────┤
│ 🟢 Web Server (Nginx)     Running  ·  Uptime: 12d 3h    │
│    Port 443 · HTTPS routing                               │
├──────────────────────────────────────────────────────────┤
│ 🟢 ClawHQ Embeddings      Running  ·  Uptime: 5d 12h    │
│    Port 5555 · Knowledge base search                      │
├──────────────────────────────────────────────────────────┤
│ 🔴 ClawHQ Data API        Stopped                        │
│    Port 5556 · Local data storage                         │
│    [Restart Service]                                      │
├──────────────────────────────────────────────────────────┤
│ ⚪ Certbot Timer           Not checked                    │
│    SSL auto-renewal                                       │
└──────────────────────────────────────────────────────────┘
```

Each service row:
- Status dot (green running, red stopped, gray not installed)
- Name + status text + uptime
- Port + description (muted text)
- If stopped: "Restart Service" button → SSH `systemctl restart {service}`

**Restart service API:**
```typescript
// POST /api/vps/services/[name]/restart
// Auth + verify service name is valid (whitelist: openclaw, nginx, clawhq-embeddings, clawhq-data-api)
// SSH → systemctl restart {service} OR docker restart {container}
// Return success/failure
```

**Polling:** Fetch service status every 30 seconds when VPS page is open. Or manual "Refresh" button.

### Files to create
- `src/app/api/vps/services/route.ts` (GET — list all services)
- `src/app/api/vps/services/[name]/restart/route.ts` (POST — restart specific service)

### Files to modify
- `src/components/dashboard/vps-controls.tsx` — add Service Status panel

### Testing
1. All services running → all green dots
2. Stop embedding service manually → shows red with "Restart" button
3. Click "Restart" → service restarts → status updates to green
4. VPS stopped → all services show "Offline" (don't SSH when VPS is stopped)
5. Service not installed → gray "Not installed" (embedding/data API may not exist on older VPSes)

---

## 2.4 SCHEDULED RESTART

### What it is
Auto-restart the VPS (or just OpenClaw) on a schedule to keep things healthy. Memory leaks, stale connections, etc. get cleared on restart.

### What to build

**Database:**
```sql
CREATE TABLE scheduled_restarts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restart_type TEXT DEFAULT 'openclaw', -- 'openclaw' (just restart OpenClaw) or 'vps' (full VPS reboot)
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ... 6=Saturday
  time_utc TEXT NOT NULL, -- "03:00" (24hr format, UTC)
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id) -- one schedule per user
);
```

**Cron endpoint:**
```typescript
// GET /api/cron/scheduled-restarts
// Runs every 15 minutes
// Checks for schedules where next_run_at <= now and is_enabled
// For each: SSH restart → update last_run_at → calculate next_run_at

export async function GET() {
  const admin = createAdminClient();

  const { data: schedules } = await admin
    .from("scheduled_restarts")
    .select("*, vps_instances!inner(ip_address, ssh_user, ssh_password, ssh_port, status)")
    .eq("is_enabled", true)
    .lte("next_run_at", new Date().toISOString());

  for (const schedule of schedules || []) {
    const vps = schedule.vps_instances;
    if (!vps || vps.status !== "running") continue;

    try {
      if (schedule.restart_type === "openclaw") {
        await restartOpenClaw({
          host: vps.ip_address,
          username: vps.ssh_user,
          password: vps.ssh_password,
          port: vps.ssh_port,
        });
      } else {
        await rebootVPS({
          host: vps.ip_address,
          username: vps.ssh_user,
          password: vps.ssh_password,
          port: vps.ssh_port,
        });
      }

      // Calculate next run
      const nextRun = calculateNextRun(schedule.day_of_week, schedule.time_utc);

      await admin.from("scheduled_restarts").update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRun.toISOString(),
      }).eq("id", schedule.id);

      // Create notification
      await createNotification({
        userId: schedule.user_id,
        type: "vps_status",
        title: `Scheduled ${schedule.restart_type === "openclaw" ? "OpenClaw" : "VPS"} restart completed`,
        message: `Next restart: ${nextRun.toLocaleDateString("en-US", { weekday: "long" })} at ${schedule.time_utc} UTC`,
      });
    } catch (err) {
      // Log error, continue with next
      console.warn(`[cron] Scheduled restart failed for user ${schedule.user_id}:`, err);
    }
  }

  return NextResponse.json({ processed: schedules?.length || 0 });
}

function calculateNextRun(dayOfWeek: number, timeUtc: string): Date {
  const [hours, minutes] = timeUtc.split(":").map(Number);
  const now = new Date();
  const next = new Date(now);

  // Set to the target time today
  next.setUTCHours(hours, minutes, 0, 0);

  // Find the next occurrence of the target day
  const currentDay = now.getUTCDay();
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
    daysUntil += 7;
  }

  next.setUTCDate(next.getUTCDate() + daysUntil);
  return next;
}
```

**API endpoints:**

```typescript
// GET /api/vps/scheduled-restart — get current schedule
// Response: { schedule: { restart_type, day_of_week, time_utc, is_enabled, last_run_at, next_run_at } | null }

// PUT /api/vps/scheduled-restart — create or update schedule
// Body: { restart_type: "openclaw" | "vps", day_of_week: 0, time_utc: "03:00", is_enabled: true }
// Calculates next_run_at automatically
// Returns: { schedule: { ... } }

// DELETE /api/vps/scheduled-restart — disable/remove schedule
```

**UI — Scheduled Restart section:**

```
┌────────────────────────────────────────────────────────┐
│ Scheduled Restart                                       │
│                                                         │
│ [✓] Enable automatic restart                            │
│                                                         │
│ Restart: [OpenClaw ▼]  Every: [Sunday ▼]  At: [03:00 ▼] │
│                                                         │
│ Last restart: Sunday, March 10 at 3:00 AM UTC           │
│ Next restart: Sunday, March 17 at 3:00 AM UTC           │
│                                                         │
│ [Save Schedule]                                         │
└────────────────────────────────────────────────────────┘
```

- Enable toggle
- Restart type: "OpenClaw only" (restart just the agent framework — faster, no downtime for nginx) or "Full VPS reboot" (restarts everything — use for deeper cleanups)
- Day selector: Monday through Sunday
- Time selector: hourly options in UTC (00:00, 01:00, ... 23:00)
- Shows last and next scheduled restart

### Files to create
- `src/app/api/vps/scheduled-restart/route.ts` (GET, PUT, DELETE)
- `src/app/api/cron/scheduled-restarts/route.ts`

### Files to modify
- `src/components/dashboard/vps-controls.tsx` — add Scheduled Restart section

---

## 2.5 RESOURCE UPGRADE BUTTON

### What it is
Simple upsell showing current VPS specs with an upgrade CTA. One card, no new backend.

### What to build

**UI — small card in VPS page:**

```
┌────────────────────────────────────────────────────────┐
│ Your Resources                                          │
│                                                         │
│ CPU: 2 vCPU    RAM: 8 GB    Storage: 100 GB            │
│ Bandwidth: 8 TB                                         │
│                                                         │
│ Need more power? [View Upgrade Options →]               │
└────────────────────────────────────────────────────────┘
```

Data already exists in `vps_instances` table (`cpu_cores`, `ram_gb`, `storage_gb`). Just display it with a link to `/billing`.

**For Pro/Ultra users:** Show their higher specs. For Starter with upgradable resources: show upgrade path.

```typescript
// In VPS controls, add a card:
<Card className="border-border">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">Your Resources</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>CPU: <span className="font-medium">{vps.cpu_cores} vCPU</span></div>
      <div>RAM: <span className="font-medium">{vps.ram_gb} GB</span></div>
      <div>Storage: <span className="font-medium">{vps.storage_gb} GB</span></div>
      <div>Bandwidth: <span className="font-medium">{vps.bandwidth_tb || 8} TB</span></div>
    </div>
    {plan === "starter" && (
      <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
        <Link href="/billing">
          Need more power? View Upgrade Options
          <ArrowRight className="ml-2 h-3 w-3" />
        </Link>
      </Button>
    )}
  </CardContent>
</Card>
```

**No new API needed** — data already fetched in the VPS page.

### Files to modify
- `src/components/dashboard/vps-controls.tsx` — add Resources card

---

## 2.6 MONITORING DASHBOARD (Build from Scratch)

### What it is
The `monitoring-dashboard.tsx` component that doesn't exist. Build basic monitoring for Starter (4 gauge cards with current values). Pro features show upgrade prompt.

### What to build

**Starter gets:**
- 4 gauge/progress cards: CPU %, RAM %, Disk %, Network usage
- Current snapshot only (one-time fetch, not polling)
- Health status text under each gauge
- "Refresh" button to re-fetch

**Pro-gated (show UpgradePrompt):**
- Real-time charts that update over time
- Historical data
- Process list
- Alerts

**Create `src/components/dashboard/monitoring-dashboard.tsx`:**

```typescript
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Cpu, MemoryStick, HardDrive, Network, ArrowUpRight } from "lucide-react";
import { UpgradePrompt } from "./upgrade-prompt";

interface MonitoringData {
  cpu_percent: number;
  ram_used: number;
  ram_total: number;
  disk_used: number;
  disk_total: number;
  network_rx_rate: number;
  network_tx_rate: number;
}

interface MonitoringDashboardProps {
  plan: string;
  hasAccess: boolean; // hasAccess(plan, "pro")
}

export function MonitoringDashboard({ plan, hasAccess }: MonitoringDashboardProps) {
  const { data, isLoading, isError, refetch } = useQuery<MonitoringData>({
    queryKey: ["vps-monitoring"],
    queryFn: async () => {
      const res = await fetch("/api/vps/monitoring");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: false, // Starter: no auto-refresh (one-time snapshot)
    staleTime: 60000, // cache for 1 minute
  });

  const ramPercent = data ? (data.ram_used / data.ram_total) * 100 : 0;
  const diskPercent = data ? (data.disk_used / data.disk_total) * 100 : 0;

  return (
    <div>
      {/* Starter: Basic gauges */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Resources</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-border">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Unable to fetch monitoring data.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GaugeCard
            title="CPU"
            value={data?.cpu_percent || 0}
            unit="%"
            icon={Cpu}
            color={getHealthColor(data?.cpu_percent || 0)}
          />
          <GaugeCard
            title="RAM"
            value={Math.round(ramPercent)}
            unit="%"
            subtitle={`${formatGB(data?.ram_used || 0)} / ${formatGB(data?.ram_total || 0)} GB`}
            icon={MemoryStick}
            color={getHealthColor(ramPercent)}
          />
          <GaugeCard
            title="Disk"
            value={Math.round(diskPercent)}
            unit="%"
            subtitle={`${formatGB(data?.disk_used || 0)} / ${formatGB(data?.disk_total || 0)} GB`}
            icon={HardDrive}
            color={getHealthColor(diskPercent)}
          />
          <GaugeCard
            title="Network"
            value={formatNetworkRate(data?.network_rx_rate || 0)}
            unit=""
            subtitle={`↑ ${formatNetworkRate(data?.network_tx_rate || 0)}`}
            icon={Network}
            color="text-primary"
          />
        </div>
      )}

      {/* Pro-gated: Real-time charts */}
      {!hasAccess && (
        <div className="mt-6">
          <UpgradePrompt
            feature="Real-time Monitoring"
            description="Upgrade to Pro for live CPU, memory, and network charts, process management, historical data, and alerts."
          />
        </div>
      )}
    </div>
  );
}

function GaugeCard({ title, value, unit, subtitle, icon: Icon, color }: {
  title: string;
  value: number | string;
  unit: string;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  const numericValue = typeof value === "number" ? value : 0;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${color}`}>{value}{unit}</p>
        {/* Progress bar */}
        {typeof value === "number" && (
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                numericValue >= 90 ? "bg-red-500" :
                numericValue >= 75 ? "bg-yellow-500" :
                "bg-primary"
              }`}
              style={{ width: `${Math.min(numericValue, 100)}%` }}
            />
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function getHealthColor(percent: number): string {
  if (percent >= 90) return "text-red-500";
  if (percent >= 75) return "text-yellow-500";
  return "text-foreground";
}

function formatGB(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(1);
}

function formatNetworkRate(bytesPerSec: number): string {
  if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSec)} B/s`;
}
```

**Update monitoring page to use this component:**

In `src/app/dashboard/monitoring/page.tsx`:
```typescript
import { MonitoringDashboard } from "@/components/dashboard/monitoring-dashboard";
import { hasAccess } from "@/lib/tier";

// ... existing page code ...

// Replace the current monitoring section with:
<MonitoringDashboard plan={subscription?.plan || "starter"} hasAccess={hasAccess(subscription?.plan, "pro")} />
```

### Files to create
- `src/components/dashboard/monitoring-dashboard.tsx`

### Files to modify
- `src/app/dashboard/monitoring/page.tsx` — use the new component

---

## BUILD ORDER

```
2.6 Monitoring Dashboard (FIRST — the only "must build" from original TODO)
  ↓
2.3 Service Status Panel (quick win, very useful)
  ↓
2.2 SSL Certificate Enhancement (small improvement to existing)
  ↓
2.5 Resource Upgrade Button (tiny, one card)
  ↓
2.1 Custom Domain Management (biggest build — domain setup + DNS verify + SSL provision)
  ↓
2.4 Scheduled Restart (needs cron + DB + UI)
```

2.6 is the only item remaining from the original TODO. Build it first. Then 2.3 (high impact, moderate effort). Then 2.2 and 2.5 (small improvements). Then 2.1 and 2.4 (bigger builds).
