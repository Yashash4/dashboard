# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClawHQ is a managed OpenClaw hosting platform. Users sign up, ClawHQ provisions a VPS with OpenClaw installed, configures DNS, nginx, and SSL, then gives them a dashboard at `username.clawhq.tech`. Price: $59/month.

## Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Architecture

**Stack:** Next.js 15, React 18, TypeScript, Supabase (auth + DB), Tailwind CSS, shadcn/ui, TanStack React Query

**`next.config.ts`** — `serverExternalPackages: ["node-ssh", "ssh2"]` is required for SSH to work in API routes.

### Routing & Middleware (`src/middleware.ts`)

Clean URL rewrites: `/vps` → `/dashboard/vps`, `/models` → `/dashboard/models`, etc. The root `/` rewrites to `/dashboard`. Users never see `/dashboard` in the URL.

Protected routes redirect unauthenticated users to `/login`. Admin routes (`/admin/*`) also check `users.role === "admin"` via Supabase.

### Supabase Clients (three variants)

| File | Use In | Notes |
|------|--------|-------|
| `src/lib/supabase.ts` | Client components | `createBrowserClient` |
| `src/lib/supabase-server.ts` | Server components / API routes | `createServerClient` with cookie handling |
| `src/lib/supabase-admin.ts` | API routes only | Service role client, bypasses RLS |

### VPS Provisioning Pipeline

The core product flow. When an admin deploys a customer:

1. **`POST /api/admin/provision`** — Creates a background job, returns job ID immediately
2. **`GET /api/admin/provision?jobId=...`** — Polls job status (steps + progress)
3. Background `runProvisioning()` executes 12 steps:
   - Step 0: Cloudflare DNS (`src/lib/cloudflare.ts`) — creates A record, sets SSL to "Full"
   - Step 1: Hostinger firewall (`src/lib/hostinger.ts`) — opens ports 22, 80, 443
   - Steps 2-11: SSH provisioning (`src/lib/provision-v3.ts`) — installs OpenClaw, configures gateway, nginx, SSL cert
4. On success, saves VPS details to `vps_instances` table

**Job tracking:** `src/lib/provision-store.ts` uses `globalThis` to persist jobs across Next.js hot reloads. Jobs auto-delete after 10 minutes.

### SSH Management (`src/lib/ssh.ts`)

Post-provisioning VPS management. Key functions:
- `getProcessStatus()` / `getVPSStats()` — monitoring
- `startOpenClaw()` / `stopOpenClaw()` / `restartOpenClaw()` — process control
- `deployAgent()` / `undeployAgent()` — agent management
- `configureChannel()` / `removeChannel()` — channel config
- `configureApiKeys()` — writes model provider config to `openclaw.json`
- `updateDashboardPassword()` — changes nginx basic auth password
- Detects Docker vs native OpenClaw runtime automatically

### API Routes

All under `src/app/api/`:
- `vps/` — status, start, stop, restart, logs, monitoring, gateway-health, password, enable-embedding
- `admin/` — provision, tickets, api-keys, vps-password
- `models/change` — switch AI model provider
- `agents/` — deploy, undeploy
- `channels/` — connect, disconnect
- `chat/` — send, messages
- `tickets/` — create, reply
- `account/` — update, password

### Pages

- **Dashboard** (`src/app/dashboard/`): vps, models, agents, channels, chat, monitoring, openclaw, support, billing, account
- **Admin** (`src/app/admin/`): customers, deploy, tickets
- **Landing** (`src/app/page.tsx`): public marketing page with hero, features, architecture sections
- **Auth**: `/login`, `/register`

### UI

shadcn/ui components in `src/components/ui/`. Landing page sections in `src/components/` (HeroSection, FeaturesSection, etc.).

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
HOSTINGER_API_TOKEN=
NEXT_PUBLIC_APP_URL=        # e.g. https://app.clawhq.tech
```

## OpenClaw Provisioning Rules (Critical)

These are hard-won lessons from manual debugging. Violating any of these will break provisioning:

1. **`trusted-proxy` is the ONLY auth mode that fully bypasses device identity** — `auth.mode: "none"` still enforces device pairing
2. **nginx MUST send `X-Forwarded-User` header** — required by trusted-proxy mode
3. **`gateway.trustedProxies: ["127.0.0.1", "::1"]`** — gateway must trust the nginx reverse proxy
4. **Port 443 with self-signed SSL cert is mandatory** — Cloudflare "Full" mode requires HTTPS on origin
5. **WebSocket headers in nginx are critical** — `Upgrade`, `Connection "upgrade"`, `proxy_read_timeout 86400`
6. **`dangerouslyDisableDeviceAuth: true`** and **`allowInsecureAuth: true`** — both required
7. **Gateway port is always 18789**
8. **`openclaw gateway install` fails for root user** — always create systemd service manually at `/etc/systemd/system/openclaw-gateway.service`
9. **Kill stale apt/dpkg processes on fresh VPS** before installing anything — `pkill -f 'apt|dpkg'` + remove lock files
10. **SSH exec sessions have minimal PATH** — always prepend full PATH in commands
11. **Write configs via base64 encoding** to avoid heredoc/escaping issues over SSH
12. **Avoid `!` in passwords over SSH** — bash history expansion escapes it

## Design System — 60-30-10 Color Rule (Critical)

ALL colors MUST come from CSS variables in `src/app/globals.css`. NEVER hardcode colors in components.

**60% Dominant** — `--bg-base`, `--bg-raised`, `--bg-elevated`, `--bg-subtle` (backgrounds, surfaces)
**30% Secondary** — `--text-primary`, `--text-secondary`, `--text-tertiary`, `--border-primary`, `--border-subtle` (text, structure)
**10% Accent** — `--accent`, `--accent-muted`, `--accent-subtle`, `--accent-border` (brand highlights, icons, badges)

**Additional variables:**
- `--cta` / `--cta-foreground` — CTA button colors
- `--success`, `--warning`, `--error`, `--info` — status colors
- `--tier-pro`, `--tier-ultra`, `--tier-enterprise` — plan tier accents

**Rules:**
- Use `var(--variable-name)` in Tailwind classes like `text-[var(--text-secondary)]` or `bg-[var(--accent-muted)]`
- To change the entire site's color, only edit `globals.css` — components stay untouched
- Alternate themes are pre-built as commented blocks in `globals.css`
- The accent color should appear sparingly (10%) — only on key interactive elements, brand moments, active states

## Database Tables

- `users` — id, name, email, role ("user" | "admin")
- `vps_instances` — user_id, ip_address, ssh_user, ssh_password, ssh_port, hostname, status, openclaw_dashboard_url, dashboard_username, dashboard_password, hostinger_vm_id
- `tickets` — support ticket system
