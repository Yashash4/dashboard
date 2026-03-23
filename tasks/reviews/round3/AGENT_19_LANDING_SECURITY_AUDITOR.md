# Agent 19 — Landing Page — Security Auditor Review

**Total Issues Found: 11**
- CRITICAL: 0 / HIGH: 2 / MEDIUM: 5 / LOW: 4

---

## HIGH

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| H-1 | `next.config.ts:6-30` | No Content-Security-Policy header configured. The application sets `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, and `Referrer-Policy`, but has no CSP header whatsoever. This leaves the application vulnerable to XSS via injected inline scripts or rogue third-party resources. A CSP policy (at minimum `default-src 'self'`) would significantly reduce XSS impact. | A03:2021 Injection | The `headers()` function in `next.config.ts` defines two route groups, neither includes a `Content-Security-Policy` header. Grep for `Content-Security-Policy` across the entire codebase returns zero matches in config/middleware files (only found in an unrelated SSH context). |
| H-2 | `src/app/register/page.tsx:68-91` | Registration form has no client-side or server-side rate limiting. The `onSubmit` handler calls `supabase.auth.signUp()` directly with no throttling, CAPTCHA, or abuse-prevention mechanism. An attacker can automate mass account creation by scripting POST requests. Supabase has basic built-in rate limits, but these are generous (e.g., 30 signups/hour per IP) and the app adds no additional protection. | A07:2021 Identification and Authentication Failures | `onSubmit` at line 68 immediately calls `supabase.auth.signUp()` with no rate-limit check, no CAPTCHA integration (e.g., hCaptcha/reCAPTCHA), and no honeypot field. Similarly, `handleGoogleSignup` at line 93 has no abuse control. |

## MEDIUM

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| M-1 | `src/app/register/page.tsx:25-28` | Weak password policy. The Zod schema at line 27 only enforces `min(8)` character length. No requirements for uppercase, lowercase, digits, or special characters. This allows trivially weak passwords like `aaaaaaaa` or `password`. | A07:2021 Identification and Authentication Failures | `z.string().min(8, "Password must be at least 8 characters")` — no complexity constraints. |
| M-2 | `src/app/register/page.tsx:82-89` | User-controlled query parameters `plan` and `cycle` from `searchParams` are forwarded into the redirect URL without validation or allowlisting. While `URLSearchParams` encodes values (preventing direct XSS), an attacker could craft a registration link with arbitrary parameter values that persist through the flow, potentially causing confusion or UI inconsistencies in the pricing page. | A01:2021 Broken Access Control | Lines 82-89: `searchParams.get("plan")` and `searchParams.get("cycle")` are read and passed through to the redirect at line 89 with no validation against the known plan names (`starter`, `pro`, `ultra`, `enterprise`) or cycle values (`monthly`, `annual`). |
| M-3 | `next.config.ts:6-15` | The `/dashboard-demo/*` route uses `X-Frame-Options: SAMEORIGIN` instead of `DENY`, and the Pricing component (`src/components/landing/Pricing.tsx:282-288`) embeds it in an iframe. While this is intentional for the landing page demo, the demo page at `/dashboard-demo` loads real dashboard components (`vps-status`, `system-alerts`, `quick-actions`, etc.) and could leak internal component structure or behavior to an attacker who frames it on a same-origin page. The demo should be a purely static/mock component, not reuse real dashboard code. | A04:2021 Insecure Design | `Pricing.tsx:284`: `<iframe src={'/dashboard-demo?plan=${previewPlan}'}` loads a route that imports from `@/components/dashboard/system-alerts`, `@/components/dashboard/vps-health-card`, etc. (seen in `dashboard-demo/page.tsx`). |
| M-4 | `next.config.ts:6-30` | No `Permissions-Policy` header configured. This header restricts browser features (camera, microphone, geolocation, payment) that the page can access. Without it, any injected script could request access to sensitive device APIs. | A05:2021 Security Misconfiguration | Grep for `Permissions-Policy` across the codebase returns zero matches. |
| M-5 | `src/components/landing/Features.tsx:275-326` | Inline `<style>` tag with raw CSS injected via JSX. While the content is static (hardcoded strings, no user input), this pattern is fragile — if any dynamic data were ever interpolated into this template literal, it would create a CSS injection vector. Additionally, inline styles bypass any future CSP `style-src` directive that doesn't include `'unsafe-inline'`. | A03:2021 Injection | Line 275: `<style>{\`...CSS keyframes...\`}</style>` — 50+ lines of inline CSS injected via template literal in JSX. |

## LOW

| ID | File:Line | Description | OWASP Category | Evidence |
|----|-----------|-------------|----------------|----------|
| L-1 | `src/components/landing/Hero.tsx:175` | Information disclosure in mock dashboard. The hero section's browser mockup hardcodes a real person's name: `"Welcome back, Yash"`. While this is cosmetic/demo content, it discloses a real team member's name which could be used in social engineering. | A01:2021 Broken Access Control | Line 175: `<p className="text-[9px]...">Welcome back, Yash</p>` |
| L-2 | `src/components/landing/Hero.tsx:123` | Mock dashboard shows a specific hostname `dashboard.clawhq.tech` in the browser chrome URL bar. If this is not the actual production URL pattern, it could mislead users. If it is, it exposes the subdomain scheme used for customer dashboards. | A04:2021 Insecure Design | Line 122-124: `<div className="...font-mono">dashboard.clawhq.tech</div>` |
| L-3 | `src/app/register/page.tsx:97-100` | OAuth redirect URL constructed using `window.location.origin`. On a compromised or spoofed origin (e.g., if the page is somehow served from a different domain), this could redirect the OAuth callback to an attacker-controlled URL. Best practice is to use a server-configured, hardcoded redirect URL from environment variables (`NEXT_PUBLIC_APP_URL`). | A07:2021 Identification and Authentication Failures | Line 98: `redirectTo: \`${window.location.origin}/auth/callback\`` uses runtime origin instead of the environment variable `NEXT_PUBLIC_APP_URL` which is already defined in the project. |
| L-4 | `src/app/register/page.tsx:108` | Hardcoded background color `bg-[#111111]` (also at lines 166, 261) instead of using the design system CSS variable `var(--bg-base)`. While not a direct security issue, deviating from the centralized color system means these elements cannot be controlled via the single `globals.css` theme file, which could matter if a high-contrast accessibility theme is needed for compliance. | A04:2021 Insecure Design | Lines 108, 166, 261: `bg-[#111111]` hardcoded instead of `bg-[var(--bg-base)]`. |

---

## Summary

The landing page and registration flow have **no critical vulnerabilities**. All content is statically defined with no `dangerouslySetInnerHTML` usage, no unsanitized user input rendering, and no third-party scripts loaded on the landing page.

The two highest-priority items are:

1. **Missing CSP header (H-1)**: This is the single most impactful gap. Adding a Content-Security-Policy header would provide defense-in-depth against XSS across the entire application.

2. **No registration rate limiting (H-2)**: The registration form relies entirely on Supabase's built-in rate limits. Adding a CAPTCHA (hCaptcha, Cloudflare Turnstile) or server-side rate limiter would prevent automated account creation abuse.

The password policy (M-1) should also be strengthened to require mixed character types, and the OAuth redirect URL (L-3) should use `NEXT_PUBLIC_APP_URL` instead of `window.location.origin`.
