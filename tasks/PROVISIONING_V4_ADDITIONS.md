# Provisioning V4 — Additional VPS Setup Steps

**Owner:** Planner
**Status:** Not started — do AFTER current fix rounds
**Blocked by:** FINAL_FIX_TODO.md completion
**Last updated:** 2026-03-16

---

## What's Missing from Current Provisioning

Current `provision-v3.ts` sets up:
- ✅ DNS (Cloudflare)
- ✅ Firewall (Hostinger API)
- ✅ Node.js 22
- ✅ OpenClaw install + gateway config + systemd service (port 18789)
- ✅ Nginx reverse proxy + SSL
- ✅ Basic auth (dashboard password)

**Missing:**
- ❌ ClawHQ Embeddings service setup (port 5555) — uses `@xenova/transformers` (Node.js, NOT Ollama)
- ❌ ClawHQ Data API setup (port 5556)

**NOT needed on VPS:**
- ~~Ollama~~ — the 30 AI models are served via Ollama Cloud API (external). No Ollama install on VPS.
- The embedding model (`all-MiniLM-L6-v2`) runs via `@xenova/transformers` in Node.js — pure JS, no Ollama dependency.

---

## NEW STEP: Setup ClawHQ Embeddings Service (Port 5555)

### What
HTTP service that takes text → returns vector embeddings using `all-MiniLM-L6-v2`. Used by Knowledge Base for RAG search.

### Steps
1. **Create the embeddings service** — Node.js app using `@xenova/transformers`
2. **Write service files to VPS** via SSH (base64 encoded, same pattern as OpenClaw config)
3. **Create systemd service** at `/etc/systemd/system/clawhq-embeddings.service`
   ```ini
   [Unit]
   Description=ClawHQ Embeddings Service
   After=network.target

   [Service]
   Type=simple
   ExecStart=/usr/bin/node /opt/clawhq/embeddings/server.js
   Restart=always
   RestartSec=10
   Environment=PORT=5555
   WorkingDirectory=/opt/clawhq/embeddings

   [Install]
   WantedBy=default.target
   ```
4. **Start + enable**
   ```bash
   systemctl daemon-reload && systemctl enable clawhq-embeddings && systemctl start clawhq-embeddings
   ```
5. **Verify**
   ```bash
   curl -sf http://127.0.0.1:5555/health
   ```

### API Endpoints
- `POST /embed` — `{ text: "..." }` → `{ embedding: [0.1, 0.2, ...] }`
- `POST /embed-batch` — `{ texts: ["...", "..."] }` → `{ embeddings: [[...], [...]] }`
- `GET /health` — `{ status: "ok", model: "all-MiniLM-L6-v2" }`

---

## NEW STEP: Setup ClawHQ Data API (Port 5556)

### What
HTTP service that stores and serves user data locally on VPS. SQLite backend via `better-sqlite3`. This is where events, sessions, audit logs, analytics, KB data, chat history, and webhook deliveries live.

### Steps
1. **Create the Data API service** — Node.js + Express + better-sqlite3
2. **Generate auth token** during provisioning (random 64-char hex)
3. **Store token** in `vps_instances.data_api_token` column in Supabase
4. **Write service files to VPS** via SSH
5. **Create systemd service** at `/etc/systemd/system/clawhq-data-api.service`
   ```ini
   [Unit]
   Description=ClawHQ Data API
   After=network.target

   [Service]
   Type=simple
   ExecStart=/usr/bin/node /opt/clawhq/data-api/server.js
   Restart=always
   RestartSec=10
   Environment=PORT=5556
   Environment=AUTH_TOKEN=<GENERATED_TOKEN>
   Environment=DB_PATH=/opt/clawhq/data/clawhq.db
   WorkingDirectory=/opt/clawhq/data-api

   [Install]
   WantedBy=default.target
   ```
6. **Initialize SQLite database** with all tables:
   - `mc_events` — event_type, severity, agent_id, task_id, session_id, message, payload, created_at
   - `mc_sessions` — agent_id, task_id, started_at, ended_at, duration_ms, tokens_input, tokens_output, success, error_message, trace_data
   - `mc_activities` — task_id, actor, action, old_value, new_value, created_at
   - `audit_logs` — user_id, action, category, entity_type, entity_id, metadata, ip_address, created_at
   - `analytics_detailed` — agent_id, event_type, response_time_ms, tokens_used, created_at
   - `kb_documents` — name, type, size, status, chunk_count, created_at
   - `kb_chunks` — document_id, content, embedding (BLOB), metadata
   - `webhook_deliveries` — webhook_id, event_type, status, response_code, response_time_ms, attempt, created_at
   - `chat_conversations` — agent_id, title, created_at, updated_at
   - `chat_messages` — conversation_id, role, content, created_at
7. **Start + enable**
   ```bash
   systemctl daemon-reload && systemctl enable clawhq-data-api && systemctl start clawhq-data-api
   ```
8. **Verify**
   ```bash
   curl -sf -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:5556/health
   ```

### API Endpoints
- `GET /api/events` — paginated, filterable by type/severity/agent
- `POST /api/events` — create event
- `GET /api/sessions` — paginated
- `GET /api/sessions/:id` — detail with trace data
- `POST /api/sessions` — create session
- `PATCH /api/sessions/:id` — update session (end, add trace)
- `GET /api/activities/:taskId` — task activity history
- `GET /api/audit-log` — paginated, filterable by category
- `POST /api/audit-log` — create entry
- `GET /api/analytics` — detailed usage analytics
- `GET /api/kb/documents` — KB document list
- `POST /api/kb/documents` — upload document
- `GET /api/kb/search` — vector search
- `GET /api/webhook-deliveries/:webhookId` — delivery history
- `GET /api/chat/history` — conversation list
- `GET /api/chat/history/:conversationId` — messages
- `GET /health` — `{ status: "ok", db: "connected", tables: 10 }`

### Security
- Every request must have `Authorization: Bearer <TOKEN>` header
- Token is unique per VPS, generated during provisioning
- Only ClawHQ dashboard server knows the token
- Port 5556 is NOT exposed via nginx — internal only (127.0.0.1)
- ClawHQ dashboard API routes proxy to it via `vpsDataFetch()` using SSH tunnel or direct HTTP if port is open

---

## NEW STEP: Configure Nginx for Embeddings + Data API

### What
Nginx needs to proxy ports 5555 and 5556 for the dashboard to reach them. OR we keep them internal-only and use SSH tunneling / direct IP access from our server.

### Option A: Nginx proxy (simpler)
Add to nginx config:
```nginx
location /clawhq-embed/ {
    proxy_pass http://127.0.0.1:5555/;
    proxy_set_header Authorization $http_authorization;
}

location /clawhq-data/ {
    proxy_pass http://127.0.0.1:5556/;
    proxy_set_header Authorization $http_authorization;
}
```

### Option B: Direct IP + firewall (current approach)
`vpsDataFetch()` in `src/lib/vps-data-api.ts` already calls `https://${hostname}:5556/...` directly. This means port 5556 must be open in firewall. Add to Hostinger firewall step: open ports 5555, 5556.

### Decision needed
- Option A is more secure (ports stay internal)
- Option B is what the code already does
- **Recommend Option A** — add nginx proxy paths, keep ports internal

---

## Updated Provisioning Pipeline (V4)

| Step | What | ~Time |
|------|------|-------|
| 0 | DNS record (Cloudflare) | 2s |
| 1 | Open firewall (Hostinger API — ports 22, 80, 443) | 5s |
| 2 | Test SSH | 2s |
| 3 | System update + apt lock wait | 30-60s |
| 4 | Install Node.js 22 | 15s |
| 5 | Install OpenClaw | 20s |
| 6 | Generate passwords + tokens (gateway password, dashboard password, data API token) | 1s |
| 7 | Write gateway config | 1s |
| 8 | Create + start OpenClaw systemd service | 5s + 30s startup |
| 9 | Install Nginx | 10s |
| 10 | Configure Nginx (gateway + embeddings + data API proxy) | 2s |
| 11 | Setup firewall (ufw) | 2s |
| 12 | Setup SSL (certbot) | 15s |
| **13** | **Deploy ClawHQ Embeddings service (port 5555) — Node.js + @xenova/transformers** | **10s + first model load ~30s** |
| **14** | **Deploy ClawHQ Data API (port 5556) + init SQLite** | **10s** |
| **15** | **Verify all 3 services running** | **5s** |
| 16 | Final verify (curl https://hostname/) | 3s |

**Total: ~3-4 minutes** (up from ~2-3 minutes)

**No Ollama on VPS.** Chat models = Ollama Cloud API (external). Embeddings = `@xenova/transformers` (pure Node.js).

---

## Files to Create/Modify

### New files (deploy to VPS during provisioning)
- `/opt/clawhq/embeddings/server.js` — Embeddings HTTP service
- `/opt/clawhq/embeddings/package.json`
- `/opt/clawhq/data-api/server.js` — Data API HTTP service
- `/opt/clawhq/data-api/package.json`
- `/opt/clawhq/data-api/schema.sql` — SQLite table definitions
- `/etc/systemd/system/clawhq-embeddings.service`
- `/etc/systemd/system/clawhq-data-api.service`

### Modified files (in dashboard codebase)
- `src/lib/provision-v3.ts` → add steps 13-17 (or create `provision-v4.ts`)
- `src/app/api/admin/provision/route.ts` → update step count
- `src/components/dashboard/admin-deploy.tsx` → update step count + icons
- Supabase migration: add `data_api_token` column to `vps_instances`
