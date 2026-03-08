# Docker Provisioning — Complete Findings (March 8, 2026)

## VPS Tested: 76.13.247.128 — Full clean slate, everything tested from scratch

---

## 1. Docker Run Command (VERIFIED WORKING)

```bash
docker run -d --init \
  --name openclaw \
  --restart=unless-stopped \
  -p 127.0.0.1:18789:18789 \
  -v /opt/openclaw/config:/home/node/.openclaw \
  ghcr.io/openclaw/openclaw:latest
```

### Rules:
- **NO command override** — default CMD `node openclaw.mjs gateway --allow-unconfigured` is correct
- **`--init`** — proper signal handling
- **Single volume** — `/opt/openclaw/config:/home/node/.openclaw`
- **NO `/data` volume** — everything lives in `/home/node/.openclaw`
- **`--restart=unless-stopped`** — auto recovery
- **Port**: `-p 127.0.0.1:18789:18789` (localhost only)

### What was WRONG in our code:
- `node dist/index.js gateway --bind lan --port 18789` — WRONG binary, overrides correct default CMD
- `-v /opt/openclaw/data:/data` — useless, nothing stored there
- `-e HOME=/home/node` — not needed
- `--restart=always` — should be `unless-stopped` (so manual stop stays stopped)

---

## 2. Image Details

- **Image**: `ghcr.io/openclaw/openclaw:latest`
- **ENTRYPOINT**: `docker-entrypoint.sh` (thin wrapper)
- **CMD**: `node openclaw.mjs gateway --allow-unconfigured`
- **User**: `node` (uid 1000)
- **WorkDir**: `/app`

---

## 3. Auth Mode — CRITICAL CHANGE

### Old: `auth.mode: "trusted-proxy"`
- Works for WebSocket Control UI through nginx
- **DOES NOT work for HTTP chat completions API** → returns "Unauthorized"

### New: `auth.mode: "token"`
- Works for HTTP chat completions API (Bearer token)
- Works for Control UI (serves HTML fine)
- Works for WebSocket (token in connect params)
- **Backward compatible** — Control UI still works

### Config:
```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "<generated-uuid>",
      "trustedProxy": { "userHeader": "x-forwarded-user" }
    }
  }
}
```

### Chat API call:
```bash
curl -X POST http://127.0.0.1:18789/v1/chat/completions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"model":"clawhq/kimi-k2.5","messages":[...],"stream":false}'
```

---

## 4. Config Requirements

When `bind: "lan"`, gateway REQUIRES:
- `controlUi.allowedOrigins` — list of origins (crash without it)
- `controlUi.dangerouslyDisableDeviceAuth: true`
- `controlUi.allowInsecureAuth: true`
- `http.endpoints.chatCompletions.enabled: true` — for chat API

### Full Working Config Template:
```json
{
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "trustedProxies": ["127.0.0.1", "::1"],
    "auth": {
      "mode": "token",
      "token": "<uuid>",
      "trustedProxy": { "userHeader": "x-forwarded-user" }
    },
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    },
    "controlUi": {
      "allowedOrigins": ["https://HOSTNAME", "http://HOSTNAME", "APP_URL"],
      "dangerouslyDisableDeviceAuth": true,
      "allowInsecureAuth": true
    }
  },
  "models": {
    "providers": {
      "clawhq": {
        "baseUrl": "...",
        "apiKey": "...",
        "api": "openai-completions",
        "models": [{ "id": "model-id", "name": "Model Name", ... }]
      }
    }
  },
  "agents": {
    "defaults": { "model": { "primary": "clawhq/model-id" } }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "...",
      "dmPolicy": "open",
      "allowFrom": ["*"]
    }
  }
}
```

---

## 5. File Permissions

- Directory: `chown -R 1000:1000 /opt/openclaw` (node user inside container)
- Config: `chmod 600 /opt/openclaw/config/openclaw.json`
- Directory: `chmod 700 /opt/openclaw`

---

## 6. Volume Mapping (Single Volume)

| Host Path | Container Path | Contents |
|-----------|---------------|----------|
| `/opt/openclaw/config` | `/home/node/.openclaw` | ALL data |

Contents of `/home/node/.openclaw/`:
- `openclaw.json` — gateway config
- `agents/` — deployed agents (agents/main/, agents/custom-bot/, etc.)
- `logs/` — gateway logs
- `telegram/` — Telegram channel state
- `canvas/` — canvas UI files
- `cron/` — cron jobs

**NO `/data` volume needed.**

---

## 7. Gateway Startup Time

- Takes ~25-30 seconds to fully start
- Health check via `curl -sf http://127.0.0.1:18789/` works (root URL)
- Container shows `(healthy)` after ~30s
- Use `sleep 30` then check, not `sleep 5` or `sleep 20`

---

## 8. Hot-Reload Behavior

- **Channels**: Hot-reload (no restart needed) — config change detected automatically
- **Models**: Require `docker restart openclaw` — NOT hot-reloaded
- **Gateway settings**: Require restart
- **Agents**: Require restart

---

## 9. ssh.ts Bugs Found

### Bug 1: `findDataDir()` returns `/data` for Docker
- **Wrong**: `/data` is empty inside container
- **Correct**: `/home/node/.openclaw`
- **Affects**: `deployAgent()`, `undeployAgent()`

### Bug 2: `enableChatEndpoint()` uses systemd restart
- Always runs `systemctl restart openclaw-gateway` regardless of runtime
- **Fix**: Use `docker restart openclaw` for Docker

### Bug 3: `gateway-health` route — systemd checks
- Checks `systemctl is-active openclaw-gateway` — returns "inactive" for Docker
- **Fix**: Use `docker inspect openclaw --format '{{.State.Status}}'`

### Bug 4: `vps/uptime` route — systemd timer
- Reads systemd journal for health check history — doesn't exist for Docker
- **Fix**: Use Docker restart count / uptime

### Bug 5: `admin/customers/[id]/health` route — same as gateway-health

### Bug 6: `getOpenClawToken()` — tries CLI binary
- `openclaw config get gateway.auth.token` — binary doesn't exist on host
- **Fix**: Use `docker exec openclaw openclaw config get ...`

### Bug 7: `writeOpenClawConfig()` — HEREDOC escaping
- Uses shell heredoc — breaks with special chars
- **Fix**: Use base64 encoding (like `configureApiKeys` already does)

### Bug 8: `configureApiKeys()` — missing chown after write
- Writes to `/opt/openclaw/config/openclaw.json` but doesn't chown
- Container runs as node (1000), file written as root = permission denied
- **Fix**: Add `chown 1000:1000` after write

### Bug 9: Auth mode
- Config uses `"mode": "trusted-proxy"` — HTTP API returns "Unauthorized"
- **Fix**: Use `"mode": "token"` with a generated token
- Store token in DB or generate on provision

### Bug 10: Model provider naming
- Provider key: `ollama-cloud` → should be `clawhq`
- Primary model: `ollama-cloud/kimi-k2.5` → `clawhq/kimi-k2.5`

---

## 10. Verified Working Operations

| # | Operation | Method | Result |
|---|-----------|--------|--------|
| 1 | SSH connect | ssh root@ip | OK |
| 2 | Docker install | get.docker.com | OK |
| 3 | Image pull | ghcr.io/openclaw/openclaw:latest | OK |
| 4 | Config write (base64) | host volume path | OK |
| 5 | Container start (default CMD) | docker run -d --init | OK |
| 6 | Gateway responds | curl http://127.0.0.1:18789/ | OK |
| 7 | SSL cert generation | openssl self-signed | OK |
| 8 | Nginx install | apt-get | OK |
| 9 | Nginx config + proxy | sites-available | OK |
| 10 | HTTPS through nginx | curl -k https://127.0.0.1 | OK |
| 11 | Read config (docker exec) | docker exec openclaw cat ... | OK |
| 12 | Write config (host volume) | base64 > file + chown | OK |
| 13 | Model config + restart | docker restart openclaw | OK |
| 14 | Telegram connect (hot-reload) | config change → auto detect | OK |
| 15 | Telegram disconnect (hot-reload) | enabled: false → auto detect | OK |
| 16 | Agent deploy (docker exec) | mkdir + base64 write | OK |
| 17 | Agent undeploy (docker exec) | rm -rf | OK |
| 18 | Dashboard password | htpasswd + nginx reload | OK |
| 19 | Auto-restart policy | docker update --restart=always | OK |
| 20 | Chat completions API | POST /v1/chat/completions Bearer token | OK |
| 21 | Chat through nginx | Same via HTTPS | OK |
| 22 | Stop container | docker stop openclaw | OK |
| 23 | Start container | docker start openclaw | OK |
| 24 | Restart container | docker restart openclaw | OK |
| 25 | Container logs | docker logs openclaw --tail N | OK |
| 26 | Process status | docker inspect --format State.Status | OK |
| 27 | VPS stats (host level) | top/free/df | OK |

---

## 11. Code Changes Needed

### provision-v3.ts
1. Remove command override in docker run
2. Remove `/opt/openclaw/data:/data` volume
3. Add `chown -R 1000:1000 /opt/openclaw` after dir creation
4. Change `--restart=always` to `--restart=unless-stopped`
5. Wait 30s (not 5s or 20s)
6. Health check on `/` (not `/healthz`)
7. Config: auth.mode = "token" with generated token
8. Config: add `http.endpoints.chatCompletions.enabled: true`

### ssh.ts
1. `findDataDir()`: Docker → `/home/node/.openclaw` (not `/data`)
2. `enableChatEndpoint()`: add Docker path with `docker restart`
3. `getOpenClawToken()`: add Docker path with `docker exec openclaw openclaw config get...`
4. `writeOpenClawConfig()`: use base64 instead of heredoc
5. `configureApiKeys()`: add `chown 1000:1000` after writing config
6. `configureApiKeys()`: provider key `clawhq` instead of `ollama-cloud`

### API Routes
1. `vps/gateway-health/route.ts`: add detectRuntime + Docker path
2. `vps/uptime/route.ts`: add Docker path
3. `admin/customers/[id]/health/route.ts`: add Docker path (if exists)

### migrate-docker/route.ts
1. Same docker run fixes as provision-v3.ts
2. Auth mode = token
3. Chat endpoint enabled
4. Single volume, chown

### New: Gateway Token Storage
- Generate UUID token on provision
- Store in `vps_instances.gateway_token` column (new column needed)
- Use for chat API calls from dashboard
