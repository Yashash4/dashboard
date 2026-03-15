# Landing Page & Website Overhaul — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 12
**Type:** Content + Design + New Pages (not just code)
**Last updated:** 2026-03-15

---

## CONTEXT: Current Landing Page State

**Files:**
- `src/app/page.tsx` — root page, renders all landing sections
- `src/components/landing/` — 14 section components:
  - `Navbar.tsx`, `Hero.tsx`, `ChannelBar.tsx`, `Stats.tsx`, `HowItWorks.tsx`
  - `Features.tsx`, `Architecture.tsx`, `DashboardShowcase.tsx`, `Pricing.tsx`
  - `Comparison.tsx`, `WhyClawHQ.tsx`, `FAQ.tsx`, `CTA.tsx`, `Footer.tsx`
- `tasks/LANDING_PAGE_CONTENT_PLAN.md` — content written by 8 content agents (very detailed)
- `tasks/LANDING_PAGE_DESIGN_SPEC.md` — design reference with 9 website patterns
- `tasks/LANDING_PAGE_BUILD_CONTEXT.md` — build context with section order

**Current section order (from page.tsx):**
1. Navbar
2. Hero
3. ChannelBar (7 channel icons scrolling)
4. Stats
5. HowItWorks (4 steps)
6. Features (bento grid)
7. Architecture
8. DashboardShowcase
9. Pricing (4 cards)
10. Comparison
11. WhyClawHQ
12. FAQ
13. CTA
14. Footer

**What's WRONG:**
- **No real product visuals** — no screenshots, no mockups, no demos. Users can't see what they're buying.
- **Dead nav links** — "Documentation" and "Blog" go to `href="#"` (nowhere)
- **Feature content is outdated** — we've added 85+ Starter features, 91 Pro features, 98+ Ultra features that aren't reflected
- **No interactive elements** — static text + static cards. No engagement.
- **Terms/Privacy pages are empty placeholders** — created during bug fix, no real content
- **Footer links incomplete** — GitHub link may not exist, social links missing
- **No product tour/demo** — biggest conversion driver missing
- **Pricing doesn't show full feature comparison** — just bullet points per card
- **No social proof beyond placeholder text** — no real testimonials (expected at launch)

---

## PART 1: CONTENT UPDATE

### 1.1 Update Hero Section

**Current:** Generic headline + subtitle + CTA buttons. No product visual.

**Update to:**

```
Headline: "Your AI Agents. Managed."
Subtitle: "Deploy AI agents on WhatsApp, Telegram, Discord, and more.
           Dedicated VPS. Bundled AI models. Zero DevOps."
CTAs: [Get Started — Free Setup] [See It In Action ↓]

Below: Animated dashboard mockup component (see Part 2)
```

**"See It In Action"** scrolls to the product tour section (new).

### 1.2 Update Features Section

**Current:** Bento grid with basic feature descriptions.

**Update with ALL new features organized by category:**

**For Starter ($59) — what EVERY user gets:**
- Dedicated VPS with health monitoring + service status
- 7 messaging channels with real-time connection testing
- Agent Store with 7 pre-built agents + ratings/reviews
- Professional chat with streaming responses + conversation history
- Model management with comparison + 5 switches/month
- Custom domain + SSL management
- Support ticket system with attachments + rich text
- Onboarding checklist + notification center

**For Pro ($129) — show the upgrade value:**
- Agent Builder (AI-assisted + manual)
- Model Playground (side-by-side comparison)
- Knowledge Base with vector search (RAG)
- Webhooks (9 events, delivery logs, auto-retry, transformations, templates)
- API Access (SSE streaming, SDKs, 22 enterprise features)
- Logs Explorer (live streaming, patterns, alerting, 12 features)
- Usage Analytics (funnels, CSAT, resolution rate, 16 features)
- Audit Log (tamper-proof, SIEM streaming, 12 features)
- Channel Analytics + Auto-Responses

**For Ultra ($350) — the command center:**
- Mission Control overview
- Kanban task board with drag-drop, keyboard shortcuts, command palette
- Agent roster with start/stop/restart
- Event feed with live streaming
- Session tracker with Gantt timeline traces
- Task dependencies, automation rules, recurring tasks
- Swimlane view, calendar view, time tracking

### 1.3 Update Pricing Section

**Current:** 4 cards with basic bullet points.

**Add below the cards:** Full feature comparison table (same as billing page 9.1 — 22-row matrix). Interactive: "Show all features" expand.

**Update card bullet points** to reflect actual features built:

**Starter $59:**
- Dedicated VPS (2 vCPU, 8GB RAM)
- 3 AI models included — no API keys
- All 7 messaging channels
- Agent Store with free pre-built agents
- Professional chat with streaming
- Custom domain + SSL
- Health monitoring
- Support with attachments

**Pro $129:**
- Everything in Starter +
- Agent Builder (AI-assisted creation)
- Model Playground (compare models)
- Knowledge Base with AI search
- Webhooks (9 events, auto-retry, templates)
- Full API Access with SDKs
- Logs Explorer with alerting
- Analytics with funnels + CSAT
- 8 vCPU, 32GB RAM

**Ultra $350:**
- Everything in Pro +
- Mission Control command center
- Kanban task board for AI agents
- Agent orchestration + automation
- Session replay with traces
- Time tracking + calendar view
- 16 vCPU, 64GB RAM

### 1.4 Update FAQ Section

**Add FAQs reflecting new features:**
- "What AI models are included?" — Kimi K2.5, MiniMax M2.5, + rotating model. No API keys needed.
- "Can I use my own domain?" — Yes, up to 3 custom domains with free SSL.
- "How does the Agent Builder work?" — Describe what you want or fill in a form. AI generates the agent config. One-click deploy.
- "What channels are supported?" — WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat.
- "Is my data secure?" — Your data stays on YOUR VPS. We don't access your conversations.
- "Can I access my agents via API?" — Pro plan includes full API with SSE streaming, SDKs, and 22 enterprise features.
- "What's Mission Control?" — A command center for managing AI agent teams. Kanban boards, real-time monitoring, task automation.

### 1.5 Update WhyClawHQ Section

**Update differentiators with concrete numbers:**
- "All-inclusive pricing" → "$59 includes VPS + AI models + all channels. Competitors charge $19 hosting + $30-60 API fees separately."
- "Your data, your server" → "All data stays on your VPS. We never access your conversations or documents."
- "7 channels, day one" → list all 7 with icons
- "Zero DevOps" → "We handle setup, updates, backups, crash recovery. Your VPS runs 24/7."
- "Agent Store" → "7 pre-built agents free. Deploy in one click. Build custom agents with AI."
- "Enterprise-grade tools at startup prices" → "Webhooks, API, analytics, audit logs — features that competitors charge $500+ for."

---

## PART 2: PRODUCT VISUALS (Animated Mockup Components)

Since we can't take real screenshots (product may not be fully deployed), build **React components that visually represent the dashboard**. These are NOT the actual dashboard — they're stylized mockup components designed for the landing page, with animations.

### 2.1 Dashboard Preview Component

**What:** An animated mockup of the main dashboard showing the Overview page with stat cards, quick actions, and activity feed. Auto-plays through different states.

```typescript
// src/components/landing/DashboardMockup.tsx

// This is a VISUAL MOCKUP, not the real dashboard.
// It looks like the dashboard but with hardcoded demo data and animations.

// Layout: mimic the real dashboard layout:
// ┌──────────┬──────────────────────────────────────────┐
// │ Sidebar  │ Overview                                  │
// │ (mini)   │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
// │          │ │VPS ✅ │ │Plan  │ │Model │ │128K  │    │
// │ Overview │ │Running│ │Start │ │Kimi  │ │ctx   │    │
// │ VPS      │ └──────┘ └──────┘ └──────┘ └──────┘    │
// │ Agents   │ ┌──────┐ ┌──────┐ ┌──────┐             │
// │ Chat     │ │5 Chan │ │3 Bot │ │1 Tick│             │
// │ Channels │ └──────┘ └──────┘ └──────┘             │
// │ ...      │                                          │
// └──────────┴──────────────────────────────────────────┘

// Animations:
// 1. Fade in from slightly below (on scroll into view)
// 2. Stat numbers count up (0 → 5 channels, 0 → 3 agents)
// 3. Activity feed items slide in one by one
// 4. Health indicator pulses green
// 5. Subtle glow on the card borders

export function DashboardMockup() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection observer — animate when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-border bg-card overflow-hidden shadow-2xl transition-all duration-1000 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="flex">
        {/* Mini sidebar */}
        <div className="w-48 border-r border-border bg-[#161616] p-3 hidden md:block">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-sm font-semibold tracking-wider">ClawHQ</span>
          </div>
          {["Overview", "VPS", "Agents", "Chat", "Channels", "Store", "Support"].map((item, i) => (
            <div
              key={item}
              className={`px-3 py-2 rounded text-sm mb-0.5 ${
                i === 0 ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-bold mb-1">Overview</h3>
          <p className="text-sm text-muted-foreground mb-4">Your ClawHQ dashboard at a glance.</p>

          {/* Stat cards with count-up animation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MockupStatCard label="VPS Status" value="Running" badge="green" delay={200} visible={visible} />
            <MockupStatCard label="Plan" value="Starter" delay={400} visible={visible} />
            <MockupStatCard label="AI Model" value="Kimi K2.5" delay={600} visible={visible} />
            <MockupStatCard label="Context" value="128K" delay={800} visible={visible} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <MockupStatCard label="Channels" value="5" numeric delay={1000} visible={visible} />
            <MockupStatCard label="Agents" value="3" numeric delay={1200} visible={visible} />
            <MockupStatCard label="Tickets" value="0" numeric delay={1400} visible={visible} />
          </div>

          {/* Activity feed (slides in) */}
          <p className="text-sm font-medium mb-2">Recent Activity</p>
          <div className="space-y-2">
            {[
              { text: "Support Bot deployed", time: "2 min ago", icon: "🚀" },
              { text: "Telegram connected", time: "1 hour ago", icon: "📱" },
              { text: "WhatsApp connected", time: "3 hours ago", icon: "💬" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-sm transition-all duration-500 ${
                  visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: `${1600 + i * 200}ms` }}
              >
                <span>{item.icon}</span>
                <span className="flex-1">{item.text}</span>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupStatCard({ label, value, badge, numeric, delay, visible }: {
  label: string; value: string; badge?: string; numeric?: boolean; delay: number; visible: boolean;
}) {
  return (
    <div
      className={`border border-border rounded-lg p-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {badge === "green" ? (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">{value}</span>
        </div>
      ) : (
        <p className={`${numeric ? "text-2xl" : "text-sm"} font-bold`}>{value}</p>
      )}
    </div>
  );
}
```

### 2.2 Chat Preview Component

**What:** Animated mockup of the chat page showing streaming responses.

```typescript
// src/components/landing/ChatMockup.tsx

// Shows a mini chat interface with:
// - Agent selector on left
// - Chat area with messages
// - Typing indicator that resolves into a streaming response
// - Auto-plays: user message appears → typing dots → response streams in

export function ChatMockup() {
  const [stage, setStage] = useState(0);
  const [streamedText, setStreamedText] = useState("");
  const fullResponse = "Of course! Your order #12345 was shipped on March 10 and is expected to arrive by March 17. Would you like me to send you the tracking link?";

  useEffect(() => {
    // Stage 0: show user message
    // Stage 1: show typing indicator (after 1s)
    // Stage 2: stream response (after 2s)
    const timers = [
      setTimeout(() => setStage(1), 1000),
      setTimeout(() => setStage(2), 2000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // Stream text character by character
  useEffect(() => {
    if (stage !== 2) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullResponse.length) {
        setStreamedText(fullResponse.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        // Reset and loop after 3 seconds
        setTimeout(() => {
          setStage(0);
          setStreamedText("");
          setTimeout(() => setStage(1), 1000);
          setTimeout(() => setStage(2), 2000);
        }, 3000);
      }
    }, 30); // 30ms per character

    return () => clearInterval(interval);
  }, [stage]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-lg">🤝</span>
        <div>
          <p className="text-sm font-medium">Support Agent</p>
          <p className="text-xs text-green-500">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 h-48 flex flex-col justify-end space-y-3">
        {/* User message */}
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%] text-sm">
            Where is my order #12345?
          </div>
        </div>

        {/* Typing indicator or streaming response */}
        {stage >= 1 && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%] text-sm">
              {stage === 1 ? (
                <div className="flex gap-1 py-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                </div>
              ) : (
                <span>{streamedText}<span className="animate-pulse">▊</span></span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
            Type a message...
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Send className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2.3 Additional Mockup Components to Build

| Mockup | What it shows | Animation |
|--------|--------------|-----------|
| **Agent Store Mockup** | Grid of agent cards with categories, ratings, "Free" badges | Cards fade in staggered, hover effect lifts card |
| **Channel Connect Mockup** | 7 channel icons with "Connected ✅" status appearing one by one | Icons pulse, status dots turn green sequentially |
| **Kanban Board Mockup** (Ultra) | Mini kanban with 3-4 columns, cards that appear to be dragged | Card slides from one column to another on loop |
| **Analytics Mockup** (Pro) | Charts with animated data lines drawing in | Lines draw from left to right, numbers count up |
| **VPS Health Mockup** | 4 gauge circles filling up (CPU 23%, RAM 45%, etc.) | Circles animate from 0% to target value |
| **Code Block Mockup** (API) | Code snippet with syntax highlighting, typing animation | Characters type in one by one, then "200 OK" badge appears |

Each mockup is a **self-contained React component** in `src/components/landing/mockups/`. They use hardcoded demo data and CSS/Framer Motion animations. They are NOT the real dashboard — just visual representations.

**Design rule:** All mockups use the locked design system colors (#111111 bg, #191919 cards, sage green primary, Geist Mono font). They should feel like a peek into the real product.

### 2.4 COMPONENT LIBRARIES & ANIMATION TOOLS — USE EVERYTHING

**This landing page must be IMPRESSIVE.** Use any library, tool, or component needed. Install whatever you need. Budget: unlimited. Here's what's available and recommended:

**Component libraries to use:**
- `21st.dev` — premium React components. Install: `npx shadcn@latest add "https://21st.dev/r/{author}/{component}"`
- `tweakcn` — enhanced shadcn themes and components
- `Magic UI` (`magicui.design`) — animated components: shimmer buttons, orbit, particles, marquee, dock, globe, etc. Install: `npx shadcn@latest add "https://magicui.design/r/{component}"`
- `Aceternity UI` — 3D cards, spotlight, wavy backgrounds, text reveal, infinite scroll
- `React Elements` — advanced UI primitives

**Animation libraries:**
- `GSAP` (`gsap`) — professional-grade scroll animations, timelines, morphing, text reveal. The industry standard. Install: `npm install gsap @gsap/react`
- `Three.js` + `@react-three/fiber` + `@react-three/drei` — 3D visuals. Use for: hero background (particle field, grid, globe), product showcase (3D phone/laptop showing dashboard). Install: `npm install three @react-three/fiber @react-three/drei`
- `Framer Motion` — already installed. Use for: page transitions, scroll-triggered animations, hover effects, layout animations, stagger children.
- `Lottie` (`lottie-react`) — for micro-animations (loading states, success checkmarks, connection animations)

**Specific components to consider:**

| Library | Component | Use for |
|---------|-----------|---------|
| Magic UI | `AnimatedShinyText` | Hero headline with shimmer effect |
| Magic UI | `DotPattern` or `GridPattern` | Hero background pattern |
| Magic UI | `Marquee` | Channel bar (already have marquee, enhance with Magic UI version) |
| Magic UI | `BentoGrid` | Features section (enhanced version) |
| Magic UI | `NumberTicker` | Stats section (animated counting numbers) |
| Magic UI | `Globe` | "Deploy anywhere" visual (3D globe with connection points) |
| Magic UI | `Dock` | Floating dock nav (alternative to sticky navbar) |
| Magic UI | `SparklesText` | Section headings with sparkle effect |
| Magic UI | `ShimmerButton` | CTA buttons with shimmer animation |
| Aceternity | `SpotlightCard` | Pricing cards with spotlight hover effect |
| Aceternity | `WavyBackground` | Hero section background |
| Aceternity | `TextRevealCard` | Feature descriptions that reveal on scroll |
| Aceternity | `InfiniteMovingCards` | Testimonials (when we have them) |
| Aceternity | `3DCard` | Agent store card previews with tilt effect |
| GSAP | `ScrollTrigger` | Pin sections, parallax, scrub animations, timeline on scroll |
| GSAP | `TextPlugin` | Typewriter text effects (hero subtitle typing) |
| GSAP | `SplitText` | Per-character/word animation on headlines |
| Three.js | Particle field | Hero background (floating particles responding to mouse) |
| Three.js | 3D device mockup | Show dashboard inside a laptop/phone frame with rotation |

**Landing page quality bar:** This must look like a **Linear.app** or **Vercel.com** or **Supabase.com** landing page — not a template. The design spec already references 9 top websites (Replicate, Groq, Linear, Resend, Neon, Stripe, Render, Supabase, Claude). Study them. Match their quality.

**Performance note:** Heavy 3D (Three.js) and GSAP animations can slow mobile. Use:
- `@react-three/fiber`'s `Canvas` with `dpr={[1, 1.5]}` for mobile performance
- GSAP `matchMedia` for responsive — disable heavy animations on mobile
- `prefers-reduced-motion` media query — skip animations for accessibility
- Lazy load all below-fold sections with `next/dynamic` + `loading` skeletons
- Images/3D assets: use `next/image` with proper sizing, lazy loading by default

---

## PART 3: NAVIGATION FIX

### 3.1 In-Page Section Navigation

**Current nav items:** Features, Pricing, FAQ (scroll to sections), Documentation (#), Blog (#), Login, Get Started

**Fix:**

```typescript
// src/components/landing/Navbar.tsx

const NAV_ITEMS = [
  { label: "Features", href: "#features", type: "scroll" },
  { label: "Pricing", href: "#pricing", type: "scroll" },
  { label: "FAQ", href: "#faq", type: "scroll" },
  { label: "Docs", href: "/docs", type: "link" },         // NEW page
];

// Smooth scroll for section links:
function handleNavClick(e: React.MouseEvent, href: string, type: string) {
  if (type === "scroll") {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  // "link" type: normal navigation (Next.js Link)
}

// Active section highlighting:
// Use IntersectionObserver to detect which section is in view
// Highlight the corresponding nav item
```

**Every landing section needs an `id` attribute:**
```typescript
<section id="features">...</section>
<section id="pricing">...</section>
<section id="how-it-works">...</section>
<section id="faq">...</section>
```

**Remove "Blog" from nav** — we don't have a blog. If we build one later, add it back.

### 3.2 Mobile Navigation

**Current:** Hamburger menu → dropdown
**Keep:** Hamburger on mobile. Same items. Smooth scroll works. Close menu after clicking a section link.

### 3.3 Sticky Nav with Scroll Progress

```typescript
// Navbar becomes sticky after scrolling past hero
// Optional: thin progress bar at the top showing scroll position

const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 100);
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

<nav className={`fixed top-0 w-full z-50 transition-all ${
  scrolled ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
}`}>
```

### Files to modify
- `src/components/landing/Navbar.tsx` — fix links, add smooth scroll, sticky behavior, active section highlight
- All landing section components — add `id` attributes

---

## PART 4: NEW PAGES

### 4.1 Documentation Page (`/docs`)

**What:** A proper documentation site for users. Getting started guide, feature docs, API reference.

**Build as:** A Next.js page with MDX content. Not a separate docs site — keep in the same app.

**Structure:**

```
/docs                           ← getting started overview
/docs/getting-started           ← step-by-step setup guide
/docs/dashboard                 ← dashboard overview
/docs/vps                       ← VPS management guide
/docs/models                    ← AI model configuration
/docs/agents                    ← agent deployment + store
/docs/channels                  ← channel setup (per channel type)
/docs/chat                      ← chat features + slash commands
/docs/pro                       ← Pro features overview
/docs/pro/knowledge-base        ← KB + RAG guide
/docs/pro/webhooks              ← webhook setup + events
/docs/pro/api                   ← API reference (links to interactive docs in dashboard)
/docs/pro/agent-builder         ← agent builder guide
/docs/ultra                     ← Ultra / Mission Control guide
/docs/faq                       ← FAQ
```

**Implementation:**

```typescript
// src/app/docs/layout.tsx — docs layout with sidebar

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-6 hidden md:block sticky top-0 h-screen overflow-y-auto">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">C</span>
          </div>
          <span className="font-semibold tracking-wider">ClawHQ Docs</span>
        </Link>

        <DocsSidebar />
      </aside>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10">
        {children}
      </main>

      {/* Table of contents (right side) */}
      <aside className="w-48 p-6 hidden lg:block sticky top-0 h-screen">
        <TableOfContents />
      </aside>
    </div>
  );
}

const DOCS_NAV = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick Start Guide", href: "/docs/getting-started" },
    ],
  },
  {
    title: "Dashboard",
    items: [
      { title: "Overview", href: "/docs/dashboard" },
      { title: "VPS Management", href: "/docs/vps" },
      { title: "AI Models", href: "/docs/models" },
      { title: "Agents", href: "/docs/agents" },
      { title: "Chat", href: "/docs/chat" },
      { title: "Channels", href: "/docs/channels" },
    ],
  },
  {
    title: "Pro Features",
    items: [
      { title: "Overview", href: "/docs/pro" },
      { title: "Knowledge Base", href: "/docs/pro/knowledge-base" },
      { title: "Webhooks", href: "/docs/pro/webhooks" },
      { title: "API Access", href: "/docs/pro/api" },
      { title: "Agent Builder", href: "/docs/pro/agent-builder" },
      { title: "Analytics", href: "/docs/pro/analytics" },
    ],
  },
  {
    title: "Ultra Features",
    items: [
      { title: "Mission Control", href: "/docs/ultra" },
    ],
  },
  {
    title: "Help",
    items: [
      { title: "FAQ", href: "/docs/faq" },
      { title: "Contact Support", href: "/support" },
    ],
  },
];
```

**Content format:** Each doc page is a simple server component with markdown-like JSX content. No MDX library needed — just React components with `prose` styling.

```typescript
// src/app/docs/getting-started/page.tsx

export default function GettingStartedPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Quick Start Guide</h1>
      <p className="lead">Get your AI agents running in 4 steps.</p>

      <h2 id="step-1">Step 1: Choose Your Plan</h2>
      <p>Visit the <Link href="/register">registration page</Link> and select a plan...</p>

      <h2 id="step-2">Step 2: Wait for VPS Setup</h2>
      <p>After signing up, we provision your dedicated VPS. This usually takes 15-30 minutes...</p>

      <h2 id="step-3">Step 3: Connect a Channel</h2>
      <p>Go to the Channels page and connect your first messaging platform...</p>

      <h2 id="step-4">Step 4: Deploy an Agent</h2>
      <p>Browse the Agent Store, add a free agent, and click Deploy...</p>

      <Callout type="tip">
        Your onboarding checklist on the dashboard will guide you through these steps.
      </Callout>
    </article>
  );
}
```

**Search:** Simple client-side search across doc page titles and headings. No Algolia/external needed.

**Design:** Same dark theme as the rest of ClawHQ. `prose-invert` for markdown content. Geist Mono font for headings, regular text for body (readable).

### 4.2 Terms of Service Page (`/terms`)

**Current:** Empty placeholder page created during bug fix.

**Content needed:** Real terms. Add to PLANNER_TASKS.md — legal content is a planner task, not a coding task. The 59 agent builds the page layout, the planner provides the text.

```typescript
// src/app/terms/page.tsx — simple page with legal content
// Same layout as docs but without sidebar
// Content provided by planner in tasks/LEGAL_CONTENT.md
```

### 4.3 Privacy Policy Page (`/privacy`)

**Same as Terms** — layout built by 59 agent, content by planner.

**Key privacy points to include (planner writes the actual text):**
- Your data stays on your VPS — we don't access conversations or documents
- We store: email, name, subscription info in our database
- We don't sell data
- GDPR: right to export (Account → Data Export) and delete (Account → Delete Account)
- Cookies: only essential auth cookies, no tracking

---

## PART 5: NEW LANDING PAGE SECTIONS

### 5.1 Product Tour Section

**What:** Tabbed or scrolling showcase of the main dashboard pages. User clicks a tab → sees the corresponding mockup + description.

```typescript
// src/components/landing/ProductTour.tsx

const TOUR_TABS = [
  {
    id: "overview",
    label: "Dashboard",
    title: "Everything at a glance",
    description: "Your VPS status, connected channels, deployed agents, and recent activity — all in one view. Health monitoring, onboarding checklist, and smart alerts keep you informed.",
    mockup: <DashboardMockup />,
  },
  {
    id: "chat",
    label: "Chat",
    title: "Talk to your AI agents",
    description: "Professional chat with streaming responses, conversation history, file attachments, and code block rendering. Just like ChatGPT — but for YOUR agents.",
    mockup: <ChatMockup />,
  },
  {
    id: "agents",
    label: "Agents",
    title: "Deploy in one click",
    description: "7 pre-built agents ready to go. Support, research, sales, writing, and more. Health monitoring, quick testing, and per-agent analytics.",
    mockup: <AgentStoreMockup />,
  },
  {
    id: "channels",
    label: "Channels",
    title: "Connect everywhere",
    description: "WhatsApp, Telegram, Discord, Slack, Teams, Signal, Webchat — all channels included. Real-time connection testing and health monitoring.",
    mockup: <ChannelMockup />,
  },
  {
    id: "pro",
    label: "Pro Tools",
    title: "Built for builders",
    description: "Agent Builder, Model Playground, Knowledge Base, Webhooks, API Access, Analytics, Audit Log — everything you need to build on top of your AI agents.",
    mockup: <ProToolsMockup />,
  },
  {
    id: "ultra",
    label: "Mission Control",
    title: "Command your AI workforce",
    description: "Kanban task boards, real-time agent monitoring, session traces, automation rules, and time tracking. The dashboard your AI agents deserve.",
    mockup: <KanbanMockup />,
  },
];

export function ProductTour() {
  const [activeTab, setActiveTab] = useState("overview");
  const activeItem = TOUR_TABS.find(t => t.id === activeTab)!;

  return (
    <section id="product-tour" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-2">See it in action</h2>
        <p className="text-muted-foreground text-center mb-10">
          Explore every part of the ClawHQ dashboard
        </p>

        {/* Tab bar */}
        <div className="flex justify-center gap-1 mb-10 flex-wrap">
          {TOUR_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-3">{activeItem.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{activeItem.description}</p>
            <Button className="mt-6" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
          <div>
            {activeItem.mockup}
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 5.2 Before/After Section

**What:** Visual comparison of "Without ClawHQ" vs "With ClawHQ"

```
Without ClawHQ:                    With ClawHQ:
❌ Manage your own VPS              ✅ Managed VPS, 24/7 uptime
❌ Set up API keys per model         ✅ Models included, no API keys
❌ Configure OpenClaw manually       ✅ One-click agent deployment
❌ 2-3 messaging channels            ✅ All 7 channels, day one
❌ No monitoring or analytics        ✅ Health monitoring + analytics
❌ $50-80/mo total (hosting + API)   ✅ $59/mo all-inclusive
```

Styled as two cards side-by-side. Left (red/dark) = pain. Right (green/primary) = solution.

### 5.3 Integration Showcase

**What:** The 7 channel icons with animated connection lines.

Already partially exists as `ChannelBar.tsx` (scrolling marquee). Enhance:
- Show each channel icon larger
- Animated connection line from channel → central ClawHQ hub
- Status dot turns green on each (sequentially)
- "All 7 channels included on every plan" text below

---

## PART 6: UPDATED SECTION ORDER

**New landing page section order:**

```
1.  Navbar (fixed/sticky)
2.  Hero (headline + CTAs + dashboard mockup)
3.  ChannelBar (enhanced — 7 icons with connection animation)
4.  Stats (updated numbers)
5.  Product Tour (NEW — tabbed mockup showcase)
6.  Features (UPDATED — organized by tier with ALL new features)
7.  Before/After (NEW — pain vs solution comparison)
8.  HowItWorks (4 steps — keep, update copy)
9.  Pricing (UPDATED cards + feature comparison table below)
10. WhyClawHQ (UPDATED differentiators with concrete numbers)
11. Comparison (keep — competitor comparison)
12. FAQ (UPDATED with new feature questions)
13. CTA (keep — repeat hero CTA)
14. Footer (UPDATED — fix links, add /docs, remove dead links)
```

---

## BUILD ORDER

```
PHASE 1 — Fix What's Broken:
  Nav links fix (smooth scroll + /docs link)
  Remove dead Blog link
  Add section IDs to all components
  Footer link fixes
  Sticky nav with scroll effect

PHASE 2 — Content Update:
  Update Hero copy
  Update Features section with all new features
  Update Pricing cards + add comparison table
  Update FAQ
  Update WhyClawHQ differentiators

PHASE 3 — Product Visuals:
  DashboardMockup component
  ChatMockup component (with streaming animation)
  Additional mockups (store, channels, VPS health, kanban, analytics, API code)

PHASE 4 — New Sections:
  Product Tour section (tabbed mockup showcase)
  Before/After section
  Enhanced Integration/Channel showcase

PHASE 5 — New Pages:
  /docs — documentation site with sidebar + content pages
  /terms — terms of service (layout ready, content from planner)
  /privacy — privacy policy (layout ready, content from planner)

PHASE 6 — Polish:
  Page load animations (fade-in on scroll for each section)
  Scroll progress indicator (optional)
  Mobile responsive checks on all new sections + mockups
  Performance: lazy load mockup components below the fold
```

Phase 1-2 = fix existing problems. Phase 3-4 = make it impressive. Phase 5 = new pages. Phase 6 = polish.
