---
name: AGENT_03_59_STARTER_FRONTEND_DEV
description: Frontend Dev review of Starter Dashboard (Area 59) — React, TypeScript, shadcn/ui, React Query, Tailwind, accessibility
type: review
agent_number: 3
area: 59_STARTER
poo: FRONTEND_DEV
---

## Frontend Dev Review — Starter Dashboard (Area 59)

Reviewed files: landing page components, dashboard page + layout, sidebar, overview cards, sparklines, onboarding, notifications, Tailwind config, globals.css.

---

## CRITICAL

### 59F_CRIT_01
**File:** `src/components/dashboard/notification-bell.tsx:65`
**Description:** `refetchInterval` on a React Query `useQuery` hook polls every 30 seconds indefinitely. There is no `enabled` flag to pause polling when the popover is closed, and no cleanup of the interval on unmount.
**Evidence:**
```ts
const { data } = useQuery<{ notifications: Notification[]; unread_count: number }>({
  queryKey: ["notifications"],
  queryFn: async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return { notifications: [], unread_count: 0 };
    return res.json();
  },
  refetchInterval: 30_000,  // <-- polls forever, never stops
  staleTime: 15_000,
});
```
**Recommendation:** Add an `enabled` condition tied to popover open state, or use a shorter `refetchInterval` only when the popover is open via `useState` + `useEffect` to track open state, or use `refetchInterval: false` and trigger a manual refetch via `queryClient.invalidateQueries` on popover open.

---

### 59F_CRIT_02
**File:** `src/components/dashboard/app-sidebar.tsx:165-174`
**Description:** `handleLogout` is async but has no loading state guard. Multiple rapid clicks will fire multiple `signOut` calls.
**Evidence:**
```ts
const handleLogout = async () => {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  } catch {
    toast.error("Failed to sign out. Try again.");
  }
};
```
**Recommendation:** Add a local `isLoggingOut` state and disable the button during logout. Also, `router.refresh()` after `router.push("/login")` may not execute if the component unmounts during navigation.

---

### 59F_CRIT_03
**File:** `src/components/landing/Hero.tsx:20-26`
**Description:** `useEffect` creates a new Supabase browser client on every render (no dependency array on the effect itself — it only depends on the empty array, so the client is created once, but `process.env` access is direct and could be undefined at runtime). The `user` state fetched is typed as `any`.
**Evidence:**
```ts
const [user, setUser] = useState<any>(null);  // <-- any type

useEffect(() => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,  // <-- non-null assertion, no validation
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  supabase.auth.getUser().then(({ data }) => setUser(data.user));
}, []);
```
**Recommendation:** Type the user state properly. Add a check that env vars exist before using them.

---

## HIGH

### 59F_HIGH_01
**File:** `src/components/landing/Navbar.tsx:61`
**Description:** `user` state is typed as `any`. Should use the Supabase `User` type.
**Evidence:**
```ts
const [user, setUser] = useState<any>(null);
```

---

### 59F_HIGH_02
**File:** `src/components/dashboard/navigation-progress.tsx:59`
**Description:** `useEffect` has an eslint-disable comment bypassing the exhaustive-deps rule. The effect completes progress animation when `pathname` changes but omits `isNavigating` from deps.
**Evidence:**
```ts
useEffect(() => {
  if (isNavigating) {
    setProgress(100);
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }
}, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
```
**Recommendation:** Add `isNavigating` to the dependency array or restructure to avoid the disable.

---

### 59F_HIGH_03
**File:** `src/components/landing/Pricing.tsx:149`
**Description:** Trust badge text is hardcoded: "14-day money-back guarantee on all plans". On the Enterprise plan, which is "white glove / custom", this guarantee may not apply in the same way.
**Evidence:**
```tsx
<p className="inline-flex items-center gap-2 text-xs text-primary border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-full mb-8">
  <Shield size={12} />
  14-day money-back guarantee on all plans
</p>
```

---

### 59F_HIGH_04
**File:** `src/components/dashboard/quick-actions.tsx:48-59`
**Description:** `useEffect` with empty dependency array reads from `localStorage` during initial mount. If the stored JSON is corrupt or the key exists with invalid data, the silently swallowed error leaves the component in a default state with no user feedback.
**Evidence:**
```ts
useEffect(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSelectedIds(parsed);
      }
    }
  } catch {
    // Use defaults
  }
}, []);
```

---

### 59F_HIGH_05
**File:** `src/components/dashboard/getting-started-guide.tsx:81`
**Description:** `getting-started-guide.tsx` and `onboarding-checklist.tsx` both independently query the same `["onboarding"]` query key. They will each create their own loading state and render differently during refetches, causing a flash of inconsistent UI if one refetches before the other.
**Evidence:**
```ts
// getting-started-guide.tsx:55
const { data } = useQuery<OnboardingState>({
  queryKey: ["onboarding"],
  // ...

// onboarding-checklist.tsx:58
const { data, isLoading } = useQuery<OnboardingState>({
  queryKey: ["onboarding"],
```
Both components also mutate the same query key via `queryClient.invalidateQueries`.

---

### 59F_HIGH_06
**File:** `src/components/landing/Features.tsx:254-259`
**Description:** `<style>` tag is injected inside a React component's JSX render for the `.vps-bar` and `.chart-bar` CSS transitions. This is a side-effect that runs on every render and creates a new `<style>` DOM element each time.
**Evidence:**
```tsx
return (
  <section id="features" ...>
    <style>{`
      .vps-bar { width: 8%; }
      .group:hover .vps-bar { width: var(--bar-target); }
      .chart-bar { height: 4px; }
      .group:hover .chart-bar { height: var(--bar-target); }
    `}</style>
```
**Recommendation:** Move these CSS rules to `globals.css` or a dedicated CSS module. Currently these rules also exist in `globals.css` at lines 112-115, making them duplicated.

---

### 59F_HIGH_07
**File:** `src/components/landing/Features.tsx:108` and `125`
**Description:** CSS custom properties (`--bar-target`) set via inline `style` objects on animated elements. Tailwind cannot process these dynamically set CSS variables for class-based animations or purge unused classes. They work at runtime but could be missed by Tailwind's JIT purge and cause inconsistencies in production builds.
**Evidence:**
```tsx
style={{ "--bar-target": `${bar.target}%`, transitionDelay: `${i * 120}ms` } as React.CSSProperties}
```

---

### 59F_HIGH_08
**File:** `src/components/landing/ChannelBar.tsx:92-102`
**Description:** The marquee animation uses a duplicated `items` array (channels duplicated for seamless loop). The marquee plays indefinitely with no pause control tied to user interaction beyond hover. The `prefers-reduced-motion` check is respected, but the animation itself has no JS-side pause capability.
**Evidence:**
```ts
const items = [...channels, ...channels];
// ...
<div className="flex animate-marquee items-center">
  {items.map((channel, i) => (
    <div key={`${channel.name}-${i}`} ...>
```
**Note:** The CSS at `globals.css:101-108` pauses on hover via `animation-play-state: paused`, which is good. However, `ChannelBar` is `ssr: false` (dynamic import) but the marquee animation content could still cause layout shift before JS loads.

---

## MEDIUM

### 59F_MED_01
**File:** `src/components/landing/Hero.tsx:21-26`
**Description:** Supabase browser client is created inside a `useEffect` rather than being instantiated once at module level or via a stable singleton. On hot reload, multiple clients could briefly coexist. Also, the effect has no cleanup — if the component unmounts before `getUser()` resolves, `setUser` will be called on an unmounted component (React 18 Strict Mode double-invokes effects in dev).
**Evidence:**
```ts
useEffect(() => {
  const supabase = createBrowserClient(...);
  supabase.auth.getUser().then(({ data }) => setUser(data.user));
}, []);
```
**Recommendation:** Use a `useRef` to track if the component is still mounted before calling `setUser`, or use the `useQuery` pattern with React Query which handles cleanup automatically.

---

### 59F_MED_02
**File:** `src/components/dashboard/notification-bell.tsx:90-101`
**Description:** `handleOpenChange` triggers a 2-second delayed `markRead.mutate()`. If the user rapidly opens/closes the popover multiple times, multiple timeouts are created and only the latest one is tracked via `markTimeoutRef`. Previous timeouts may still fire and send redundant API requests. Also, if `notifications` changes between open and the 2s mark (e.g., a new notification arrives via polling), the wrong IDs could be marked read.
**Evidence:**
```ts
const handleOpenChange = (open: boolean) => {
  if (open && unreadCount > 0) {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      markTimeoutRef.current = setTimeout(() => {
        markRead.mutate({ ids: unreadIds });
      }, 2000);
    }
  }
```

---

### 59F_MED_03
**File:** `src/components/dashboard/vps-health-card.tsx:74-85`
**Description:** `queryKey: ["overview-health"]` is very generic. If other components use the same key or a parent key like `["overview"]`, React Query's cache invalidation could become unpredictable. The `staleTime: 60_000` means if the user navigates away and back within a minute, stale health data could be shown.
**Evidence:**
```ts
const { data: health, isLoading: healthLoading } = useQuery<HealthData | null>({
  queryKey: ["overview-health"],
  queryFn: async () => {
    const res = await fetch("/api/vps/monitoring");
    if (!res.ok) return null;
    return res.json();
  },
  enabled: isRunning,
  staleTime: 60_000,
  refetchOnWindowFocus: false,
  retry: 1,
});
```

---

### 59F_MED_04
**File:** `src/app/page.tsx:23`
**Description:** Skip-to-content link uses `focus:top-4 focus:left-4` which are Tailwind arbitrary values. These work but `focus:inset-4` would be cleaner. The link also uses `focus:rounded-[var(--radius)]` which is fine but the combination of `focus:absolute`, `focus:z-[100]`, and positioning classes could cause the element to appear off-screen in certain scroll positions.
**Evidence:**
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[var(--radius)]">
```

---

### 59F_MED_05
**File:** `src/components/dashboard/recent-activity.tsx:80`
**Description:** Activity items use index `i` as key alongside `item.type` and `item.created_at`. If two activities have the same `type` and `created_at` timestamp (possible with server-side batching), keys will collide causing incorrect React reconcilation.
**Evidence:**
```tsx
{data.slice(0, 10).map((item, i) => {
  const Icon = TYPE_ICONS[item.type] || Clock;
  return (
    <div key={i} className="flex items-start gap-3">  // <-- index key
```

---

### 59F_MED_06
**File:** `src/components/landing/Pricing.tsx:308-326`
**Description:** Comparison table rows use `row.label` as key, but several rows have the same label (e.g., there are two rows with label "Agent Store" — one boolean and one count-based). React will not warn about duplicate string keys.
**Evidence:**
```tsx
{comparisonRows.map((row) => (
  <tr key={row.label} className="border-b border-border/50">  // <-- duplicate key "Agent Store"
```

---

### 59F_MED_07
**File:** `src/components/landing/Features.tsx:295` and `322`
**Description:** Feature card titles use `text-base` for heading inside cards, but the Pro tier features use `text-sm` for headings. This inconsistency within the same section makes the Pro features feel visually subordinate even though they're priced higher.
**Evidence:**
```tsx
// Starter tier
<h3 className="text-base font-semibold mb-2">{feature.title}</h3>  // 16px

// Pro tier
<h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>  // 14px
```

---

### 59F_MED_08
**File:** `src/components/dashboard/navigation-progress.tsx:11-29`
**Description:** `handleClick` is wrapped in `useCallback` with `pathname` as a dependency, but `pathname` changes on every navigation. This means the event listener is removed and re-added on every navigation. While functional, this is inefficient.
**Evidence:**
```ts
const handleClick = useCallback(
  (e: MouseEvent) => {
    // ...
    if (url.origin === window.location.origin && url.pathname !== pathname) {
      // ...
    }
  },
  [pathname]  // <-- changes on every navigation
);
```

---

### 59F_MED_09
**File:** `src/components/dashboard/onboarding-checklist.tsx:68-77`
**Description:** `dismiss.mutate()` has no `onError` handler. If the PATCH request fails silently, the user sees the checklist disappear on the client but it will reappear on next refetch with no error feedback.
**Evidence:**
```ts
const dismiss = useMutation({
  mutationFn: async () => {
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist_dismissed: true }),
    });
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding"] }),
  // no onError
});
```

---

### 59F_MED_10
**File:** `src/components/landing/Footer.tsx:59`
**Description:** GitHub link has `target="_blank"` but is missing `rel="noopener noreferrer"` — the current value is `rel="noopener noreferrer"` on the GitHub link which is correct. However, the Enterprise "Talk to Us" mailto link has no `rel` which is fine since it's not a hyperlink navigation.
**Note:** Actually this is fine — the GitHub link does have `rel="noopener noreferrer"`. No issue here.

---

### 59F_MED_11
**File:** `src/components/dashboard/mini-sparkline.tsx:19`
**Description:** Comment says `// MED_32: Use useId for unique gradient IDs to avoid collisions` — this is a good practice finding that was filed as MED_32 in a previous review, suggesting this issue was known and addressed but the comment referencing MED_32 is a leftover ticket reference.
**Evidence:**
```ts
const id = useId(); // MED_32: Use useId for unique gradient IDs to avoid collisions
```

---

## LOW

### 59F_LOW_01
**File:** `src/components/landing/Features.tsx:35`
**Description:** Feature card text color uses inline style `color: "var(--muted-foreground)"` instead of Tailwind's `text-muted-foreground` class. This works but is inconsistent with the rest of the codebase which uses Tailwind utility classes.
**Evidence:**
```tsx
<span className="text-xs sm:text-sm whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
```

---

### 59F_LOW_02
**File:** `src/app/globals.css:111-115`
**Description:** CSS rules for `.vps-bar` and `.chart-bar` in `globals.css` duplicate the same rules embedded in `Features.tsx` via `<style>` tag. The CSS in `globals.css` uses Tailwind's `@apply` format but the JSX `<style>` uses raw CSS. The `.vps-bar` class in `globals.css` sets `width: 8%` but the `<style>` in Features also sets `width: 8%`. Both are loaded.
**Evidence:**
```css
/* globals.css:112-115 */
.vps-bar { width: 8%; }
.group:hover .vps-bar { width: var(--bar-target); }
.chart-bar { height: 4px; }
.group:hover .chart-bar { height: var(--bar-target); }
```
**Note:** This duplication could cause confusion in maintenance and the `<style>` tag approach should be removed in favor of the CSS file.

---

### 59F_LOW_03
**File:** `src/components/landing/ChannelBar.tsx:71-77`
**Description:** Gradient fade overlays on the marquee use `position: absolute` with `left: 0` and `right: 0` but do not specify `top`/`bottom`. This works but is implicit. Also, the `z-index: 10` on the fade overlays may not be sufficient if sibling elements create stacking contexts.
**Evidence:**
```tsx
<div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10" />
```

---

### 59F_LOW_04
**File:** `src/components/landing/Pricing.tsx:283-285`
**Description:** Mobile scroll indicator uses `aria-hidden="true"` and a text arrow character. This is a cosmetic accessibility enhancement note — the indicator itself is not keyboard accessible but since it's just a hint and not interactive, this is acceptable.
**Evidence:**
```tsx
<div className="md:hidden flex items-center justify-end gap-1 mb-2 text-[10px] text-muted-foreground">
  Scroll <span aria-hidden="true">&rarr;</span>
</div>
```

---

### 59F_LOW_05
**File:** `src/components/dashboard/getting-started-guide.tsx:129`
**Description:** Guide card links use `hover:opacity-80` on the wrapping `<Link>` element. When the user hovers, the entire card dims to 80% opacity. This is a minor UX issue — users may expect the cursor change to indicate a link, but `cursor-pointer` is not applied.
**Evidence:**
```tsx
<Link key={i} href={step.href} className="hover:opacity-80 transition-opacity">
```

---

## SUMMARY

| Category | Count |
|---------|-------|
| CRITICAL | 3 |
| HIGH | 8 |
| MEDIUM | 11 |
| LOW | 5 |
| **Total** | **27** |

The most impactful issues are:
1. **`notification-bell.tsx`** — polling every 30s with no pause mechanism wastes server resources and network bandwidth when the popover is closed
2. **`app-sidebar.tsx`** — logout has no click-debounce guard, allowing rapid repeated calls
3. **`Hero.tsx`** — `useState<any>` for user discards TypeScript safety on a critical auth state object
4. **Duplicate CSS** in `Features.tsx` (`<style>` tag) that mirrors `globals.css` creates maintenance risk
5. **Duplicate `["onboarding"]` query key** across two components causes potential render inconsistency

The overall code quality is good: React Query patterns are consistently applied, Tailwind CSS is used appropriately, accessibility features (skip links, ARIA, reduced-motion) are present, and server/client data fetching is well-separated. The main areas for improvement are around polling efficiency, TypeScript strictness, and CSS maintenance hygiene.
