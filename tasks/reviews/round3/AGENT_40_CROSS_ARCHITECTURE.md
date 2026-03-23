# Agent 40 — Cross-Cutting — Architecture Review
**Total Issues Found: 14**
- CRITICAL: 2 / HIGH: 5 / MEDIUM: 5 / LOW: 2

---

### [ARCH-01] — No test infrastructure exists
**Files:** `package.json`, entire `src/` directory
**Severity:** CRITICAL
**Description:** The project has zero test files. No unit tests, integration tests, or end-to-end tests. No test runner (Jest, Vitest, Playwright) is configured in `package.json`. The only test script is the default `lint`. With 145+ API route files, 50+ lib modules, and complex SSH provisioning logic, there is no automated verification of any behavior.
**Impact:** Any change can silently break existing functionality. Regressions in critical paths (provisioning, billing, auth) go undetected until production. Refactoring is extremely risky. The codebase is essentially untestable without significant restructuring of business logic out of route handlers.
**Recommendation:** 1) Add Vitest as a test runner. 2) Extract business logic from route handlers into testable service functions. 3) Prioritize tests for `v1-auth.ts`, `rate-limit.ts`, `provision-v3.ts`, `ssh.ts`, `credential-utils.ts`, and `tier.ts`. 4) Add API integration tests for the V1 endpoints using supertest or similar.

---

### [ARCH-02] — Massive auth/plan-check boilerplate duplication across 145+ routes
**Files:** All files under `src/app/api/` (session-based routes)
**Severity:** CRITICAL
**Description:** Every session-authenticated API route repeats the same 10-15 lines of boilerplate: create Supabase server client, call `getUser()`, check for null, return 401. Many routes then also fetch the subscription plan, check `hasAccess()`, and apply rate limiting. This pattern is copy-pasted across 145+ route files with 627 instances of `NextResponse.json({ error:` (ad-hoc error format) vs. only 91 instances of the structured `apiError()` helper. The admin routes additionally repeat a 7-line admin role check pattern in 16+ files.

Concrete example — this exact block appears in nearly every route:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

The Mission Control routes (`mc-route-guard.ts`) show this was recognized as a problem and partially solved, but only for that one feature area.

**Impact:** Inconsistent error response formats between session routes (`{ error: "string" }`) and V1 routes (`{ error: { code, message, type, request_id } }`). Any auth logic change requires editing 100+ files. Easy to forget a check when adding new routes.
**Recommendation:** Create a unified `guardRoute()` middleware similar to `guardMCRoute()` but generalized — accepting plan requirements, rate limit config, and admin flag. All session-based routes should use it. Adopt the structured `apiError()` format uniformly.

---

### [ARCH-03] — No data access layer; Supabase queries scattered across route handlers
**Files:** 117 files calling `createAdminClient()` directly in route handlers
**Severity:** HIGH
**Description:** Every API route directly constructs Supabase queries inline. There is no repository pattern, no service layer, and no data access abstraction. The same queries (e.g., fetching a user's subscription plan, fetching VPS credentials) are duplicated across dozens of files. The subscription plan check — `admin.from("subscriptions").select("plan").eq("user_id", user.id).single()` — appears in 23+ files verbatim.
**Impact:** Table name changes, schema migrations, or switching to a different data store would require editing 100+ files. Query logic is untestable without mocking Supabase. Business rules are tightly coupled to the ORM.
**Recommendation:** Create a `src/lib/repositories/` or `src/lib/services/` layer with functions like `getUserPlan(userId)`, `getVPSForUser(userId)`, `getDeployedAgents(userId)`. Route handlers should only orchestrate — call service, return response.

---

### [ARCH-04] — QueryClient instantiated as module-level singleton in providers.tsx
**Files:** `src/app/providers.tsx` (line 8)
**Severity:** HIGH
**Description:** `const queryClient = new QueryClient()` is defined at module scope outside the component. In a server-side rendering context (Next.js), this means a single QueryClient instance is shared across all requests on the server, potentially leaking data between users.
**Impact:** In production with SSR, one user's cached query data could be served to another user. This is a known anti-pattern documented in the TanStack Query docs.
**Recommendation:** Move QueryClient creation inside the component using `useState` or `useRef`:
```typescript
const [queryClient] = useState(() => new QueryClient());
```

---

### [ARCH-05] — In-memory rate limiter ineffective on serverless
**Files:** `src/lib/rate-limit.ts` (lines 28-82)
**Severity:** HIGH
**Description:** The synchronous `rateLimit()` function uses an in-memory `Map` that resets on every cold start. The code acknowledges this limitation (line 50-55 comment) and provides `rateLimitAsync()` as a durable alternative. However, the V1 auth (`src/lib/v1-auth.ts`, line 105-127) and all session-based routes exclusively use the synchronous `rateLimit()` — the durable `rateLimitAsync()` is never called anywhere in the codebase.
**Impact:** Rate limiting is effectively a no-op on serverless deployments. An attacker can bypass rate limits by waiting for new instances to spawn, or by hitting different instances that don't share state.
**Recommendation:** Switch the V1 auth and critical session routes to use `rateLimitAsync()` for the Supabase-backed rate limiter. At minimum, use it for auth-related endpoints (login, key creation) and the V1 chat endpoint.

---

### [ARCH-06] — In-memory provision job store incompatible with multi-instance deployments
**Files:** `src/lib/provision-store.ts`
**Severity:** HIGH
**Description:** Provision jobs are stored in a `globalThis` Map. While this survives Next.js hot reloads in dev, it fails in production with multiple server instances. The `POST` that creates a job and the `GET` that polls status may hit different instances, causing "Job not found" errors. The `getActiveJob()` function (for resume after navigation) also only sees jobs on its own instance.
**Impact:** Provisioning status polling is unreliable in any multi-instance deployment (Vercel, load-balanced servers). The admin cannot monitor provisioning progress if requests are load-balanced.
**Recommendation:** Store job state in Supabase (a `provision_jobs` table) or Redis. The current architecture only works on a single-instance deployment.

---

### [ARCH-07] — Demo user bypass scattered across 18 API routes without centralization
**Files:** 18 files containing `demo@clawhq.tech` check
**Severity:** HIGH
**Description:** The demo user (`demo@clawhq.tech`) is checked individually in 18 API route files. Each route has its own mock data inline. There is no centralized demo middleware or mock data factory.
**Impact:** Adding or modifying demo behavior requires editing 18+ files. Easy to miss a route, creating inconsistent demo experiences. Demo email is hardcoded as a string literal everywhere.
**Recommendation:** Create a `isDemoUser(email)` utility and a centralized mock data provider. Better yet, handle demo user checks in middleware or the proposed `guardRoute()` function, returning mock responses before the handler executes.

---

### [ARCH-08] — Inconsistent error response formats between session and V1 API routes
**Files:** `src/lib/api-errors.ts` vs. all session-based routes
**Severity:** MEDIUM
**Description:** The V1 API routes use a well-structured error format via `apiError()`: `{ error: { code, message, type, request_id } }` with proper HTTP status codes, request IDs, and rate limit headers. Session-based routes use ad-hoc `{ error: "string message" }` without request IDs or structured codes. This creates two different error contracts for the same application.
**Impact:** Frontend error handling must account for two different error shapes. Logging and monitoring cannot use a unified error parsing strategy. If session routes are ever exposed to external consumers, the error format is inadequate.
**Recommendation:** Extend the `apiError()` pattern to session routes. At minimum, create an `internalError(message, status)` helper that provides a consistent shape.

---

### [ARCH-09] — Business logic embedded in route handlers makes code untestable
**Files:** `src/app/api/v1/chat/route.ts` (429 lines), `src/app/api/admin/provision/route.ts` (323 lines), `src/app/api/keys/route.ts` (189 lines)
**Severity:** MEDIUM
**Description:** Route handlers contain complex business logic mixed with HTTP concerns. The V1 chat route (429 lines) handles auth, idempotency, body validation, agent lookup, VPS lookup, KB search, OpenClaw proxying, SSE streaming, analytics tracking, and webhook dispatch — all in a single function. The provision route runs a 180-line background function with DNS, firewall, SSH, and database operations.
**Impact:** None of this logic can be unit tested without spinning up a full HTTP request. Logic cannot be reused across different endpoints. Functions are too large to reason about.
**Recommendation:** Extract domain logic into service modules: `ChatService.sendMessage()`, `ProvisionService.provision()`, `KeyService.create()`. Route handlers become thin controllers that parse input, call the service, and format the response.

---

### [ARCH-10] — No CSRF protection for state-mutating session-based routes
**Files:** `src/middleware.ts`, all POST/PUT/DELETE session routes
**Severity:** MEDIUM
**Description:** Session-based routes use cookie auth (Supabase session cookies). The middleware checks for a valid user session but does not verify CSRF tokens on state-mutating requests (POST, PUT, DELETE). The V1 API is unaffected since it uses Bearer token auth.
**Impact:** An attacker could craft a malicious page that makes authenticated POST requests to session-based endpoints (e.g., creating tickets, deleting accounts, changing passwords) on behalf of a logged-in user.
**Recommendation:** Add CSRF token verification for non-GET session routes. Supabase auth cookies have `SameSite=Lax` which provides some protection, but explicit CSRF tokens are defense-in-depth for non-idempotent operations. Consider a double-submit cookie pattern or a server-generated token.

---

### [ARCH-11] — Missing Content-Security-Policy header
**Files:** `next.config.ts` (lines 6-30)
**Severity:** MEDIUM
**Description:** The `next.config.ts` sets security headers including `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Strict-Transport-Security`. However, there is no `Content-Security-Policy` header defined. The application loads external scripts (Sentry), uses inline styles (Tailwind), and renders user-provided content in chat/tickets.
**Impact:** Without CSP, injected scripts (via XSS in chat messages, ticket content, or knowledge base documents) execute without restriction. CSP provides a critical defense-in-depth layer.
**Recommendation:** Add a `Content-Security-Policy` header. Start with a report-only policy to identify violations, then enforce. At minimum: `default-src 'self'; script-src 'self' *.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data:`.

---

### [ARCH-12] — `any` type used extensively in API route handlers
**Files:** Multiple route files (e.g., `src/app/api/v1/chat/route.ts` lines 102, 114, 131; `src/app/api/v1/agents/route.ts` line 35; `src/app/api/admin/provision/route.ts` line 220)
**Severity:** MEDIUM
**Description:** API routes frequently use `any` for Supabase query results, especially with joined/nested selects (e.g., `agents(name)` relations). Error catches also use `any` typing. There are no shared TypeScript types for database table rows.
**Impact:** Type safety is lost at the data boundary — the most error-prone part of the application. Refactoring database schemas produces no compile-time errors. TypeScript provides no help catching property access errors on query results.
**Recommendation:** Generate Supabase types using `supabase gen types typescript` and create a `src/types/database.ts`. Use these types for all query results. Replace `catch (err: any)` with `catch (err: unknown)` and type-narrow.

---

### [ARCH-13] — Multiple in-memory caches with no eviction coordination
**Files:** `src/lib/rate-limit.ts` (line 28), `src/lib/vps-data-api.ts` (line 16-28), `src/lib/provision-store.ts` (line 25)
**Severity:** LOW
**Description:** Three separate `Map`-based in-memory caches exist: rate limit timestamps, VPS hostname cache (5-min TTL with 10-min cleanup interval), and provision job store. Each has its own cleanup strategy (or lack thereof). The rate limiter cleans up every 5 minutes; the VPS cache uses `setInterval` (which runs even when idle); the provision store uses `setTimeout` per job.
**Impact:** Memory usage is unbounded in long-running processes. The `setInterval` in `vps-data-api.ts` (line 23) runs unconditionally even when the cache is empty. These caches don't coordinate — under memory pressure, there's no way to evict across all of them.
**Recommendation:** Consider a shared cache utility with LRU eviction and a unified cleanup strategy. For production, move caches to Redis or an external store.

---

### [ARCH-14] — Tailwind content paths include legacy directories that may not exist
**Files:** `tailwind.config.ts` (lines 5-9)
**Severity:** LOW
**Description:** The `content` array includes `./pages/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}` (root-level), which are legacy Next.js Pages Router paths. The project uses the App Router exclusively with all source under `./src/**/*.{ts,tsx}`. The duplicate `./app/**/*.{ts,tsx}` path also doesn't match anything (should be `./src/app/**`).
**Impact:** Minor — Tailwind scans non-existent directories on every build, adding negligible overhead. Could cause confusion about project structure.
**Recommendation:** Remove the unused content paths. Only `"./src/**/*.{ts,tsx}"` is needed.
