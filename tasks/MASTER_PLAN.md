# MASTER PLAN: Full Admin Dashboard + Automated VPS Provisioning

## Build Order

- [ ] **Task 1:** Full Admin Dashboard UI (stats, customers, deploy, tickets)
- [ ] **Task 2:** `src/lib/provision.ts` — SSH provisioning functions
- [ ] **Task 3:** `POST /api/admin/provision` — API orchestrator
- [ ] **Task 4:** Wire deploy page to provision API + progress display
- [ ] **Task 5:** Test on fresh VPS
- [ ] **Task 6:** Fix OpenClaw iframe + Chat page

---

## Task 1: Full Admin Dashboard

### Admin Stats Page (`/admin` — overview)
- [ ] Total users, active subscriptions, revenue
- [ ] VPS status summary (running/stopped/provisioning)
- [ ] Recent support tickets
- [ ] Quick action buttons

### Admin Customers Page (`/admin/customers`)
- [ ] User list table: name, email, plan, VPS status, created date
- [ ] Click row → view customer detail (subscription, VPS, agents)
- [ ] Search/filter

### Admin Deploy Page (`/admin/deploy`)
- [ ] Provision form: customer, VPS IP, SSH creds, hostname, email
- [ ] Step-by-step progress display
- [ ] History of past provisioning runs

### Admin Tickets Page (`/admin/tickets`)
- [ ] All support tickets across customers
- [ ] Status filters (open/in-progress/closed)
- [ ] Reply to tickets

---

## Task 2: `src/lib/provision.ts` — OpenClaw Automated Setup

Full automation: fresh Ubuntu → running OpenClaw with Nginx + SSL + iframe support.

### Provisioning Steps (executed via SSH)

| # | Step | Shell Commands | ~Time |
|---|------|---------------|-------|
| 1 | Test SSH | `whoami` | 2s |
| 2 | Update system | `apt-get update -qq && apt-get upgrade -y -qq` | 30-60s |
| 3 | Install Node.js 20 | `curl -fsSL https://deb.nodesource.com/setup_20.x \| bash - && apt-get install -y nodejs` | 15s |
| 4 | Install OpenClaw | `npm install -g openclaw && openclaw --version` | 20s |
| 5 | Generate password | random password for customer's OpenClaw dashboard | instant |
| 6 | Write gateway config | `mkdir -p ~/.openclaw && cat > ~/.openclaw/openclaw.json` | 1s |
| 7 | Create systemd service | write unit file + `systemctl daemon-reload && systemctl enable openclaw-gateway` | 2s |
| 8 | Start gateway | `systemctl start openclaw-gateway && sleep 5 && curl http://127.0.0.1:18789/` | 5s |
| 9 | Install Nginx | `apt-get install -y nginx` | 10s |
| 10 | Configure Nginx | write reverse proxy config + `nginx -t && systemctl reload nginx` | 2s |
| 11 | Setup firewall | `ufw allow 22/80/443 && ufw --force enable` | 2s |
| 12 | Setup SSL | `apt-get install -y certbot python3-certbot-nginx && certbot --nginx -d <hostname>` | 15s |
| 13 | Verify | `curl -sSf https://<hostname>/` | 3s |

**Total: ~2-3 minutes**

### OpenClaw Config (Step 6)
```json
{
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan",
    "auth": { "mode": "password", "password": "<GENERATED_PASSWORD>" },
    "controlUi": {
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true,
      "allowedOrigins": ["<APP_URL>"]
    },
    "trustedProxies": ["127.0.0.1"],
    "http": { "endpoints": { "chatCompletions": { "enabled": true } } }
  }
}
```

### Systemd Service (Step 7)
```ini
[Unit]
Description=OpenClaw Gateway
After=network.target
[Service]
Type=simple
ExecStart=/usr/bin/openclaw gateway --port 18789
Restart=always
RestartSec=10
Environment=OPENCLAW_GATEWAY_PORT=18789
[Install]
WantedBy=default.target
```

### Nginx Config (Step 10)
```nginx
server {
  listen 80;
  server_name <HOSTNAME>;
  location / {
    proxy_pass http://127.0.0.1:18789;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    proxy_hide_header X-Frame-Options;
    proxy_hide_header Content-Security-Policy;
    add_header Content-Security-Policy "frame-ancestors 'self' <APP_URL>" always;
  }
}
```

### Environment
- `NEXT_PUBLIC_APP_URL` env var for dynamic origin (works on localhost, Vercel, any domain)
- DB column: `vps_instances.openclaw_password` (stores customer's OpenClaw dashboard password)

---

## Task 3: `POST /api/admin/provision`

- [ ] Admin-only endpoint
- [ ] Accepts VPS details (IP, SSH creds, hostname, email, customer ID)
- [ ] Runs provisionVPS() from provision.ts
- [ ] Updates DB with password + URL + status

---

## Task 4: Wire Deploy Page

- [ ] Connect deploy form to provision API
- [ ] Show real-time step progress
- [ ] Display success/failure status

---

## Task 5: Test on Fresh VPS

- [ ] Reset VPS → provision from admin dashboard
- [ ] Verify OpenClaw running
- [ ] Verify iframe + chat work

---

## Task 6: Fix Existing Pages

- [ ] OpenClaw iframe with `#password=` or password prompt
- [ ] Chat page API testing (chat completions uses password auth)
- [ ] Generic origins via `NEXT_PUBLIC_APP_URL` env var
