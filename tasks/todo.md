# Docker Migration — Implementation Plan

Based on verified testing on VPS 76.13.247.128. Every fix below is proven working.

---

## Task 1: Fix `provision-v3.ts` (Provisioning) ✅ DONE
**Files**: `src/lib/provision-v3.ts`

Changes:
- [x] Step 6 (Write config): Add `chown -R 1000:1000 /opt/openclaw` after dir creation, remove `/opt/openclaw/data` dir
- [x] Step 6 (Config): Switch auth mode from `trusted-proxy` to `token` with generated UUID
- [x] Step 6 (Config): Add `http.endpoints.chatCompletions.enabled: true`
- [x] Step 7 (Docker run): Remove command override (use default CMD)
- [x] Step 7 (Docker run): Remove `-v /opt/openclaw/data:/data` volume (single volume only)
- [x] Step 7 (Docker run): Change `--restart=always` to `--restart=unless-stopped`
- [x] Step 7 (Wait): Increase to `sleep 30`
- [x] Step 7 (Health): Use `curl -sf http://127.0.0.1:18789/` (root URL, not `/healthz`)
- [x] Step 7 (Logging): Keep docker logs capture on failure
- [x] Step 10 (Nginx): Add `/v1/` location without Basic Auth for API calls

---

## Task 2: Fix `ssh.ts` core functions ✅ DONE
**Files**: `src/lib/ssh.ts`

Changes:
- [x] `findDataDir()`: Docker → return `/home/node/.openclaw` (not `/data`)
- [x] `writeOpenClawConfig()`: Replace heredoc with base64 encoding + chown for Docker path
- [x] `configureApiKeys()`: Add `chown 1000:1000` after writing to host volume
- [x] `configureApiKeys()`: Change provider key from `model-clawhq` to `clawhq`
- [x] `configureApiKeys()`: Auth mode fallback changed to `token` (preserve existing token)
- [x] `enableChatEndpoint()`: Add `detectRuntime()` + `docker restart openclaw` for Docker
- [x] `getOpenClawToken()`: Add Docker path using `docker exec openclaw openclaw config get gateway.auth.token`
- [x] `deployAgent()`: Replace heredoc with base64 encoding for Docker

---

## Task 3: Fix API routes (gateway-health, uptime, admin health) ✅ DONE
**Files**:
- `src/app/api/vps/gateway-health/route.ts`
- `src/app/api/vps/uptime/route.ts`
- `src/app/api/admin/customers/[id]/health/route.ts`

Changes:
- [x] `gateway-health`: Add runtime detection, use `docker inspect openclaw` for Docker
- [x] `gateway-health`: Use `docker exec openclaw openclaw --version` for Docker
- [x] `uptime`: Add Docker path — use container restart count
- [x] `admin health`: Same Docker detection + inspect

---

## Task 4: Fix `migrate-docker/route.ts` ✅ DONE
**Files**: `src/app/api/admin/customers/[id]/migrate-docker/route.ts`

Changes:
- [x] Docker run: Remove command override (use default CMD)
- [x] Docker run: Remove `/opt/openclaw/data:/data` volume
- [x] Docker run: Change to `--restart=unless-stopped`
- [x] Add `chown -R 1000:1000 /opt/openclaw` after dir creation
- [x] Config: Switch auth mode to `token` with generated UUID
- [x] Config: Add `http.endpoints.chatCompletions.enabled: true`
- [x] Config: Add controlUi settings for lan bind
- [x] Wait: `sleep 30` instead of `sleep 20`
- [x] Health check: Use `/` not `/healthz`
- [x] Copy agents (not /data) to config dir
- [x] Store gateway token in DB after migration

---

## Task 5: Gateway token storage ✅ DONE
**Files**:
- `supabase/migrations/20260309100000_gateway_token.sql`
- `src/lib/provision-v3.ts` (returns token)
- `src/app/api/admin/provision/route.ts` (stores token in DB)
- `src/app/api/chat/send/route.ts` (uses Bearer token for API calls)

Changes:
- [x] Add `gateway_token` column to `vps_instances` table (migration SQL)
- [x] Provision: provision-v3.ts generates UUID token, returns it
- [x] Provision route: stores `gateway_token` in DB after success
- [x] Chat send route: Fetches `gateway_token`, uses as Bearer token
- [x] Nginx config: `/v1/` location bypasses Basic Auth (gateway token handles security)
- [x] Migrate-docker: stores gateway token in DB

---

## Task 6: Model provider branding ✅ DONE
**Files**: `src/lib/ssh.ts` (PROVIDER_OPENCLAW_CONFIG mapping)

Changes:
- [x] Change ollama provider key from `model-clawhq` to `clawhq`
- [x] No other `ollama-cloud` references in code (only in docs/findings)

---

## Build Status
- [x] `next build` passes with 0 errors ✅

## Verification (user testing needed)
- [ ] Fresh provision on test VPS → container running, gateway responds, chat works
- [ ] Model change → config pushed, gateway restarts with new model
- [ ] Telegram connect → hot-reload, bot starts
- [ ] Telegram disconnect → hot-reload, bot stops
- [ ] Agent deploy → files written to correct path
- [ ] Chat API → response from model via Bearer token
- [ ] Gateway health → shows "running" for Docker VPS
- [ ] VPS logs → shows docker logs output
- [ ] Stop/start/restart → all work
