# Plan: Monitoring Page (Task 22)

Pro-only page at `/dashboard/monitoring` — real-time VPS + gateway monitoring with charts.

## Approach

**Client-side accumulation** — poll every 10s, accumulate data points in React state (last ~30 min). No DB table needed. Charts show trends from the current browser session. Simple, no infra changes.

## What we build

### 1. New API: `/api/vps/gateway-health` (route.ts)
- SSH into VPS, check `systemctl is-active openclaw-gateway`
- Curl `http://127.0.0.1:18789/` for gateway HTTP health
- Return: `{ active: boolean, httpOk: boolean, version: string, pid: number }`

### 2. Monitoring page (server component)
- File: `dashboard/src/app/dashboard/monitoring/page.tsx`
- Fetch subscription (plan gate) + VPS data server-side
- Show `<UpgradePrompt />` for non-Pro users
- Show empty state if no VPS
- Pass initial VPS data to client component

### 3. Monitoring dashboard (client component)
- File: `dashboard/src/components/dashboard/monitoring-dashboard.tsx`
- **Section A: Status bar** — VPS status badge, gateway health badge, uptime
- **Section B: Live stat cards** (4 cards) — CPU %, RAM (used/total), Disk (used/total), Network I/O
- **Section C: Charts** (2 area charts using recharts + shadcn chart wrapper)
  - CPU + RAM % over time (dual line, last 30 min)
  - Network in/out over time (dual line, last 30 min)
- **Section D: Gateway logs** — collapsible terminal panel (reuse existing `/api/vps/logs` endpoint), manual refresh button
- Polls `/api/vps/monitoring` every 10s, accumulates history in state
- Polls `/api/vps/gateway-health` every 30s

### 4. SSH addition: network stats
- Add to `getVPSStats()` in `ssh.ts`: read `/proc/net/dev` for rx/tx bytes
- Return additional fields: `net_rx_bytes`, `net_tx_bytes`
- Client calculates rate (bytes/sec) from delta between polls

## Files to create/modify

| File | Action |
|------|--------|
| `dashboard/src/app/dashboard/monitoring/page.tsx` | Modify (replace stub) |
| `dashboard/src/components/dashboard/monitoring-dashboard.tsx` | Create |
| `dashboard/src/app/api/vps/gateway-health/route.ts` | Create |
| `dashboard/src/lib/ssh.ts` | Modify (add net stats to getVPSStats) |

## Design

- Same dark theme, brutalist style as rest of dashboard
- Charts: area fill with low opacity, primary color for CPU, chart-2 for RAM
- Terminal logs: black bg, green mono text (same as VPS page)
- Responsive: 2-col grid for stat cards, full-width charts
