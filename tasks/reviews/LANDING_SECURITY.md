# Landing Page, Docs, Terms & Privacy — Security Audit

**Auditor:** Automated Security Review
**Date:** 2026-03-16
**Scope:** `src/components/landing/`, `src/app/docs/`, `src/app/terms/`, `src/app/privacy/`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/middleware.ts`, `next.config.ts`, `vercel.json`

---

## Summary

| Category | Status | Severity |
|---|---|---|
| XSS in user-rendered content | PASS | — |
| CSP headers configured | FAIL | Medium |
| External links have `rel="noopener noreferrer"` | FAIL | Low |
| No secrets/credentials in code | PASS | — |
| Docs code examples use placeholder keys | PASS | — |
| No SSRF via landing page features | PASS | — |
| Form submissions go to HTTPS | PASS (relative paths) | — |
| No mixed content (HTTP resources) | PASS | — |
| Security headers (HSTS, X-Frame-Options, etc.) | FAIL | Medium |

**Overall Risk: LOW — 3 findings, none critical.**

---

## Detailed Findings

### 1. [MEDIUM] No Content-Security-Policy (CSP) Headers

**Location:** `src/middleware.ts`, `next.config.ts`, `vercel.json`

No CSP header is configured anywhere in the project. The middleware handles authentication and URL rewrites but does not set any security headers. `next.config.ts` contains only `serverExternalPackages` and Sentry config. `vercel.json` contains only cron configuration.

**Risk:** Without CSP, if an XSS vulnerability is introduced in the future (e.g., through user-generated content or a dependency), there is no browser-level defense to prevent inline script execution, unauthorized resource loading, or data exfiltration.

**Recommendation:** Add a `Content-Security-Policy` header via either Next.js middleware or `next.config.ts` headers config. A reasonable starting policy:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io;
frame-ancestors 'none';
```

Refine `script-src` to use nonces once `unsafe-inline` and `unsafe-eval` can be eliminated.

---

### 2. [MEDIUM] No Security Response Headers (HSTS, X-Frame-Options, X-Content-Type-Options)

**Location:** `src/middleware.ts`, `next.config.ts`

None of the following standard security headers are set:

- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-DNS-Prefetch-Control`
- `Referrer-Policy`
- `Permissions-Policy`

**Risk:** Without HSTS, browsers may allow downgrade attacks on first visit. Without `X-Frame-Options` / CSP `frame-ancestors`, the site could be embedded in an iframe for clickjacking. Without `X-Content-Type-Options: nosniff`, browsers may MIME-sniff responses.

**Recommendation:** Add these headers in `next.config.ts`:

```ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ];
}
```

---

### 3. [LOW] External Link Missing `rel="noopener noreferrer"`

**Location:** `src/components/landing/Footer.tsx`, line 59

```tsx
<a href="https://github.com/openclaw" className="...">
  OpenClaw on GitHub
</a>
```

This external link to `https://github.com/openclaw` does not have `target="_blank"` or `rel="noopener noreferrer"`. Since it lacks `target="_blank"`, there is no actual security risk from `window.opener` access — the link opens in the same tab. However, for consistency with the project's other external links (e.g., Razorpay link in privacy page which correctly uses `target="_blank" rel="noopener noreferrer"`), consider adding these attributes if the intent is to open in a new tab.

**Other external links audited (all correct):**
- `src/app/privacy/page.tsx` line 86: Razorpay link has `target="_blank" rel="noopener noreferrer"` — PASS
- `src/app/docs/page.tsx` line 16: OpenClaw link has `target="_blank" rel="noopener noreferrer"` — PASS

---

## Passed Checks (No Issues Found)

### XSS — No User-Rendered Content Vulnerabilities

All landing page, docs, terms, and privacy content is statically defined in JSX. There are:
- **Zero** uses of `dangerouslySetInnerHTML` in any audited file (only found in `src/components/ui/chart.tsx`, which is not in scope).
- **No** URL parameter reading or query string rendering on any public page.
- **No** user input fields on any audited page (registration links are simple `<a href="/register">`).
- All text content is hardcoded in component source, not fetched from external sources or databases.

### No Secrets or Credentials in Landing Page Code

Searched all files under `src/components/landing/`, `src/app/docs/`, `src/app/terms/`, `src/app/privacy/` for:
- Real API keys (patterns: `sk-`, `sk_live`, provider-specific prefixes)
- Environment variable values
- Hardcoded credentials

**Result:** No secrets found. Environment variables are referenced only in server-side files (`middleware.ts`, `next.config.ts`) and are accessed via `process.env`, never hardcoded.

### Docs Code Examples Use Placeholder Keys

All API documentation code examples use the placeholder `clw_your_api_key_here` consistently:
- `src/app/docs/api/auth/page.tsx` — cURL, Python, JavaScript examples all use placeholder
- `src/app/docs/api/chat/page.tsx` — All code examples use placeholder
- The format example `clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` is clearly synthetic

### No SSRF Vectors

The landing page, docs, terms, and privacy pages are entirely static React components. There are:
- No server-side data fetching triggered by user input
- No URL parameters that cause server-side requests
- No image URLs constructed from user input
- No form actions that proxy requests

### Form Submissions / Registration Links Use Relative Paths (HTTPS Enforced)

All CTA buttons and registration links use relative paths:
- `href="/register"` (Hero, Navbar, CTA, Pricing, ProductTour, Footer)
- `href="/login"` (Navbar, Footer)
- `href="mailto:hello@clawhq.tech"` (Footer, Enterprise CTA)
- `href="mailto:support@clawhq.tech"` (Terms, Privacy)

Since the application is deployed on Vercel with HTTPS, all relative paths resolve to HTTPS URLs. No absolute HTTP URLs are used anywhere.

### No Mixed Content

Searched all landing page components for `http://` URLs. **Zero found.** All external references use HTTPS:
- `https://github.com/openclaw`
- `https://openclaw.dev`
- `https://razorpay.com/privacy/`
- `https://app.clawhq.tech/api/v1/...` (in docs examples)

### Inline Styles Are Safe

The landing page uses inline `style` attributes extensively (Hero, CTA, Features) but all values are hardcoded color/gradient strings. No dynamic user input flows into any style attribute.

---

## Architecture Notes

- **Static rendering:** `src/app/page.tsx` (landing) imports only static components with no data fetching. Terms and Privacy pages are pure static JSX.
- **Docs pages:** All documentation content is hardcoded JSX, not Markdown rendered at runtime. No MDX processing that could introduce injection.
- **Middleware:** Handles auth redirects only. No security headers are injected. The `getSession()` call reads the JWT from the cookie without a network roundtrip, which is appropriate for route protection (layout calls `getUser()` for full validation).
- **Sentry integration:** Present via `@sentry/nextjs` in `next.config.ts`. Source maps are gated behind `SENTRY_AUTH_TOKEN`. No client-side Sentry DSN was found exposed in the landing page source.

---

## Recommendations (Priority Order)

1. **Add security response headers** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy via `next.config.ts` `headers()`.
2. **Add Content-Security-Policy header** — Start with a report-only policy to identify violations, then enforce.
3. **Add `target="_blank" rel="noopener noreferrer"`** to the GitHub link in Footer.tsx for consistency with other external links.
