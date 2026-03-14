# Landing Page Design Spec — Inspiration Picks

**Rule:** This file captures LAYOUT and STRUCTURE picks only. Content/copy decisions come later.

---

## 1. Replicate — "How It Works" Section

**What we're taking:** Stacked vertical boxes — each feature is its own full-width card, and inside each card is the content (text + code side by side).

- One big outer box (section container with gradient/colored bg)
- Inside: multiple stacked inner boxes (cards), one per feature
- Each inner box has: left text (heading + description + CTA) | right side is flexible (code block, screenshot, visual, diagram — whatever fits the content)
- Box inside box inside box — nested container feel
- Section heading + description at the very top, then the stacked feature cards below

**Layout pattern:**
```
┌─── Outer Box (gradient bg) ──────────────────┐
│  "How it works"                               │
│  Section description text                     │
│                                               │
│  ┌─── Inner Box 1 (card) ─────────────────┐  │
│  │  Feature heading    │  ┌─────────────┐  │  │
│  │  Description text   │  │ Code block  │  │  │
│  │  [CTA Button]       │  └─────────────┘  │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─── Inner Box 2 (card) ─────────────────┐  │
│  │  Feature heading    │  ┌─────────────┐  │  │
│  │  Description text   │  │ Code block  │  │  │
│  │  [CTA Button]       │  └─────────────┘  │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─── Inner Box 3 (card) ─────────────────┐  │
│  │  Feature heading    │  ┌─────────────┐  │  │
│  │  Description text   │  │ Code block  │  │  │
│  │  [CTA Button]       │  └─────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## 2. Groq

**What we're taking:**

**A) Logo bar with stat number**
- Big number on the left ("3M DEVELOPERS AND TEAMS")
- Scrolling/static company logos beside it (Robinhood, Canva, Riot Games, Dropbox, Vercel, etc.)
- Can go near nav (top) or bottom — placement TBD based on content flow

**Layout pattern:**
```
┌─ Logo Bar ──────────────────────────────────────┐
│  [BIG #] STAT LABEL  │ logo logo logo logo logo │
└─────────────────────────────────────────────────┘
```

## 3. Linear — Hero Background Pattern

**What we're taking:** Full-width dark gradient/textured background with content floating centered on top.

- Dual-tone dark bg — darker edges/top, slightly lighter center zone behind main content (spotlight/vignette effect)
- NOT a single flat gradient — two distinct dark shades creating depth and focus toward center
- Content sits centered on top of that bg — can be anything: heading, subtext, image, SVG, screenshot
- The bg gives depth, content feels like it's layered ON the surface
- Clean nav bar above, then this big atmospheric section

**Layout pattern:**
```
┌─ Nav ───────────────────────────────────────┐
│  Logo          Links...        Login Signup  │
└─────────────────────────────────────────────┘
┌─ Hero (dark gradient/texture bg) ───────────┐
│                                              │
│         Big Heading Text                     │
│         Subtitle / description               │
│                                              │
│      ┌──────────────────────────┐            │
│      │  Product screenshot /    │            │
│      │  image / SVG / anything  │            │
│      └──────────────────────────┘            │
│                                              │
└──────────────────────────────────────────────┘
```

## 3b. Linear — Animated Feature Demo Section

**What we're taking:** Split headline + live product demo that animates like real usage.

- Top: bold headline (left-aligned) + description text (right-aligned) on same row
- Below: two-panel product demo side by side
  - Left panel: chat/input interface (messages typing in, system responding, continuous flow)
  - Right panel: dashboard/board view updating in response
- Pre-scripted animation — NOT interactive. User doesn't type. It plays like a movie:
  - 1st message already written → send → system responds → maybe 1-2 more exchanges auto-play
  - Send button is just visual, nothing is actually interactive
- For ClawHQ: show Mission Control in the background — agent chat on left, dashboard metrics on right, scripted demo playing

**Layout pattern:**
```
┌─────────────────────────────────────────────────┐
│  Bold Headline         │  Description text       │
│  (left)                │  (right)                │
│                        │  Link →                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─ Chat/Input ──────┐  ┌─ Dashboard/Board ──┐  │
│  │  user message      │  │  Card  Card  Card  │  │
│  │  system response   │  │  Card  Card  Card  │  │
│  │  user message      │  │  Card  Card  Card  │  │
│  │  system response   │  │  (updates live)    │  │
│  │  [typing...]       │  │                    │  │
│  └────────────────────┘  └────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

## 3c. Linear — Numbered Feature Deep-Dive Links

**What we're taking:** Clickable numbered feature links below the demo → opens detail sheet/modal.

- Below the animated demo: a row of numbered items (1.1, 1.2, 1.3, 1.4) with feature names
- Clicking one opens a slide-up sheet/modal with:
  - Number label + big feature heading
  - Description paragraph
  - Product screenshot/visual in a contained box
  - Sub-sections below (integrations table, sub-features, more details)
- Sheet has a close (X) button, dark bg, scrollable content
- For ClawHQ: each number = a feature deep-dive (agents, channels, models, monitoring, etc.)

**Layout pattern:**
```
Below the demo:
┌─────────────────────────────────────────────┐
│  1.1 Feature A    │  1.2 Feature B          │
│  1.3 Feature C    │  1.4 Feature D          │
└─────────────────────────────────────────────┘

On click → slides up:
┌─ Detail Sheet ──────────────────────────────┐
│  ──── (drag handle)           X close       │
│                                              │
│  1.1                                         │
│  Feature Name (big heading)                  │
│                                              │
│  Description paragraph...                    │
│                                              │
│  ┌──────────────────────────────┐            │
│  │  Screenshot / visual         │            │
│  └──────────────────────────────┘            │
│                                              │
│  Sub-heading                                 │
│  ┌─ Table/Details ──────────────┐            │
│  │  Item    │  Description      │            │
│  │  Item    │  Description      │            │
│  └──────────────────────────────┘            │
└──────────────────────────────────────────────┘
```

## 3d. Linear — In-App Dashboard Color System (NOT landing page — for dashboard redesign)

**What we're taking for the ClawHQ dashboard app:**

- Background is NOT pure black — dark gray with subtle warmth/tone
- Cards/panels are a slightly lighter shade of dark gray (creates layering)
- Colors used ONLY for limited things: status badges, icons, progress bars, accents
- Everything else is grayscale (white text, gray borders, dark surfaces)
- Depth comes from 3-4 shades of dark, not from color
- Result: feels premium, not "dark mode template"

**Color layering:**
```
Layer 0 (page bg):     very dark gray (not #000, more like #0a0a0c)
Layer 1 (cards/panels): slightly lighter dark gray
Layer 2 (hover/active): one more step lighter
Accent colors:          ONLY for badges, status, icons — sparingly
Text:                   white → light gray → mid gray (3 tiers)
Borders:                very subtle dark gray, barely visible
```

## 3e. Linear — Multi-Scenario Animated Showcase

**What we're taking:** A separate section where multiple agent/tool scenarios cycle through with complex pre-scripted animations.

- Multiple scenarios, each showing a different integration/feature in action
- Each scenario has its own scripted sequence:
  - Agent responds with terminal-like output (Codex: "Kicked off a task in kinetic/kinetic-iOS environment")
  - Dropdowns open, search filters animate (typing "yas" → "yash", results filtering live)
  - Thinking/loading animations play ("Thinking...", "Searching for root AGENTS file")
  - Assign-to panels with avatar lists, checkmarks, Agent badges
- User CAN click to select which scenario to watch (e.g. click Codex, click GitHub Copilot) — that part is interactive
- But once selected, the scenario plays out automatically as a pre-scripted movie — user just watches
- Very complex orchestration — too complex to capture in text
- Reference: linear.app — study the actual code implementation
- For ClawHQ: scripted scenarios cycling through agent deployment, channel setup, chat interaction, monitoring updates

---

## 4. Resend — Navbar with Preview Dropdowns

**What we're taking:** Fixed/sticky navbar with animated dropdown menus that have text links + preview card.

- Navbar sticks to top on scroll
- Dropdown menus are 2-column:
  - Left: text link list (Email API, SMTP, Inbound, Audiences, Broadcasts)
  - Right: preview card with image/visual + label (e.g. "Transactional Emails" / "Marketing Emails" cards, or "New: Introducing the New Email Editor" announcement)
- Each dropdown is UNIQUE — tailored to its content, not one-size-fits-all:
  - **Features**: left = text links, right = product category cards (Transactional Emails, Marketing Emails)
  - **Docs**: left = text links (Getting Started, API Reference, Integrations, Examples, SDKs), right = grid of framework/SDK icons (Next.js, Remix, Astro, PHP, Go, Ruby, etc.)
  - **AI**: left = text links (Cursor, Claude, Codex, Lovable, Replit), right = feature cards (Agents, MCP, Skills) — dark rounded cards
  - **Company**: left = text links (About, Blog, Careers, Customers, Humans), right = branded cards with icon + title + subtitle (Handbook: "How we work", Philosophy: "What we value")
  - Each one communicates its category visually — icons for tech, cards for products, branded for company
- Dropdown has smooth open/close animation
- Dark bg dropdown with subtle border, rounded corners
- Reference: resend.com — study code for dropdown animation

---

## 4b. Resend — Feature Grid with Live Visuals

**What we're taking:** 2-column grid of feature cards, each with a live-looking visual on top and text below.

- Section heading + description text at top (left-aligned, big)
- Below: 2-column grid of cards
- Each card has:
  - Top: live-looking product UI (API responses streaming, event logs, status badges, webhook data — NOT static images)
  - Bottom: small icon + feature title + short description
- The visuals are ANIMATED and continuously running — not static screenshots:
  - Left card example: HTTP 200 responses keep streaming in with new IDs, Send button auto-triggers every few seconds (also clickable)
  - Right card example: event log entries keep appearing (Clicked, Complained, Opened, Bounced) with different data cycling every 2-3 sec
  - Both cards feel like real-time data flowing continuously
- Cards have subtle borders, dark bg, generous padding
- Reference: resend.com — study actual code for animation implementation
- Can be used for ANY feature set — API calls, monitoring, channels, agent stats, etc. Unlimited use cases

**Layout pattern:**
```
  Big Section Heading
  Description text...

  ┌─ Card 1 ──────────────┐  ┌─ Card 2 ──────────────┐
  │  ┌──────────────────┐  │  │  ┌──────────────────┐  │
  │  │  Live visual /   │  │  │  │  Live visual /   │  │
  │  │  product UI      │  │  │  │  product UI      │  │
  │  └──────────────────┘  │  │  └──────────────────┘  │
  │  🔧 Feature Title      │  │  🔧 Feature Title      │
  │  Description text      │  │  Description text      │
  └────────────────────────┘  └────────────────────────┘

  ┌─ Card 3 ──────────────┐  ┌─ Card 4 ──────────────┐
  │  ...                   │  │  ...                   │
  └────────────────────────┘  └────────────────────────┘
```

## 4c. Resend — Centered Feature Highlight

**What we're taking:** Standalone centered section to highlight a single feature/capability.

- Dark bg, everything centered
- Top: icon or logo visual (can be animated/3D-looking)
- Big centered headline (one line, bold)
- Subtitle / description text (1-2 lines, lighter color)
- Dual CTAs side by side ("Get Started >" + "Check the Docs >")
- Lots of vertical padding — the section breathes
- Reusable for any feature callout (agent store, API, open source component, etc.)

**Layout pattern:**
```
┌─────────────────────────────────────────────┐
│                                              │
│              [Icon / Logo]                   │
│                                              │
│        Big Centered Headline                 │
│     Subtitle description text                │
│                                              │
│     [CTA Button >]   [Text Link >]          │
│                                              │
└──────────────────────────────────────────────┘
```

## 4d. Resend — IDE-Style Split Panel

**What we're taking:** Embedded code editor look — file sidebar + code + live preview, all in one component.

- Looks like a real IDE/code editor embedded on the page
- macOS-style window chrome (red/yellow/green dots top-left)
- Left sidebar: clickable file tabs (user-welcome.tsx, reset-password.tsx, user-invite.tsx, etc.)
- Left panel: code editor with syntax highlighting, line numbers, scrollable
- Right panel: live preview of what the code produces (rendered output)
- Clicking different file tabs switches both code and preview
- Top-right: viewport toggle icons (desktop/mobile/dark mode/settings)
- Scrollable in both panels independently
- For ClawHQ: can use for anything — agent configs, API examples, channel setup code, webhook payloads, etc.

**Layout pattern:**
```
┌─ Window Chrome (● ● ●) ──────────── [icons] ─┐
│  ┌─ Files ─┐  ┌─ Code ──────┐  ┌─ Preview ─┐ │
│  │ file1 ← │  │  1  import  │  │  Rendered  │ │
│  │ file2    │  │  2  const   │  │  output    │ │
│  │ file3    │  │  3  return  │  │  of the    │ │
│  │ file4    │  │  4    <div  │  │  code      │ │
│  │          │  │  (scroll)   │  │  (scroll)  │ │
│  └──────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────┘
```

## 4e. Resend — Tabbed Dashboard Showcase

**What we're taking:** Centered heading + clickable tab pills that switch a full embedded dashboard view below.

- Top: 3D/animated icon + centered heading + subtitle
- Below heading: row of clickable tab pills (icon + label each), horizontal
- Below tabs: full embedded dashboard screenshot/mockup that changes based on selected tab
  - Tab 1 (Intuitive Analytics): metrics dashboard with charts, deliverability scores, sent email graph
  - Tab 2 (Full Visibility): email list table with status badges (Delivered, Sent, Bounced), search/filters
  - Tab 3 (Domain Authentication): domain config page with DNS records table, verified badges
- Dashboard mockup has its own sidebar nav, making it look like the actual product
- Selected tab has highlighted/active style
- For ClawHQ: can use for any multi-view showcase — VPS controls, agent management, monitoring, channel setup

**Layout pattern:**
```
┌──────────────────────────────────────────────┐
│              [3D Icon]                        │
│         Centered Heading                      │
│         Subtitle text                         │
│                                               │
│  [Tab 1 pill]  [Tab 2 pill]  [Tab 3 pill]   │
│                                               │
│  ┌─ Full Dashboard Mockup ────────────────┐  │
│  │  Sidebar │  Main content area          │  │
│  │  nav     │  (changes per tab)          │  │
│  │  links   │  Tables, charts, forms...   │  │
│  │          │                              │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## 4f. Resend — CTA + Giant Brand Text with Cursor-Following Light

**What we're taking:** Final CTA section with massive brand name rendered as dark-on-dark background text, plus a cursor-following light/reveal effect.

- CTA block: centered heading ("Email reimagined. Available today.") + dual CTAs ("Get Started >" + "Contact Us >")
- Below: GIANT brand name text spanning full width, rendered in very dark color on dark bg (barely visible by default)
- As user moves cursor over the giant text, a white/light highlight follows the cursor position, "revealing" the text underneath
- Creates a spotlight/flashlight effect — text lights up only where the cursor is
- The glow follows mouse movement smoothly, fading out at edges
- Pure CSS/JS effect — cursor position drives a radial gradient or mask
- Feels premium, interactive, and memorable without being gimmicky
- For ClawHQ: "CLAWHQ" or "OPENCLAW" as the giant text with the cursor light effect

**Layout pattern:**
```
┌──────────────────────────────────────────────┐
│                                               │
│        Heading text (centered)                │
│        Subtitle (lighter)                     │
│                                               │
│     [CTA Button >]   [Text Link >]           │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │                                          │  │
│  │    C  L  A  W  H  Q    ← giant dark     │  │
│  │         text, barely visible             │  │
│  │    (cursor spotlight reveals it)         │  │
│  │                                          │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## 5. Neon — Sticky Section Index Nav

**What we're taking:** A vertical sticky nav on the left side that only appears during a specific range of sections, showing category labels as anchor links.

- Left-side vertical nav, sticky positioned
- Each item = a section/category name (e.g. AI, Advanced Autoscaling, Instant Branching, Auth Included, Production-Grade Features)
- Active section gets a dot/bullet indicator + bold/white text, others are muted gray
- Clicking a label smooth-scrolls to that section
- The nav ONLY appears during sections 2-6 (or whatever range we define) — not on hero, not on footer sections
- Appears on scroll-in, disappears on scroll-out of the defined section range
- For ClawHQ: section labels like "AI Models", "Agent Store", "Channels", "Monitoring", "Security" etc.

**Layout pattern:**
```
┌──────────────────────────────────────────────┐
│                                               │
│  · AI Models        │                         │
│    Agent Store      │   Section content       │
│    Channels         │   (full width right)    │
│    Monitoring       │                         │
│    Security         │                         │
│                     │                         │
│  (sticky, left)     │                         │
└──────────────────────────────────────────────┘
```

---

## 6. Stripe — Cycling Stats with Animated Visual

**What we're taking:** Row of 4 big stat numbers that auto-cycle, each triggering a different animated visualization below.

- Centered section heading at top
- Row of 4 stat items: big number + label text below each
- Stats auto-cycle one at a time — the active stat gets bold/white text + subtle border highlight, others stay faded/muted
- Below the stats row: a large animated visualization area that changes per stat
  - Each stat triggers a completely different animation (data streams, network arcs, globe, particle effects — whatever fits the content)
- Pause/play controls available (small icons, corner)
- Colored gradient background for the entire section (different from main dark bg)
- For ClawHQ: stats like "500+ AI Models", "8 Channels", "99.9% Uptime", "1000+ Agents" — each with a unique visual

**Layout pattern:**
```
┌─ Gradient bg section ────────────────────────┐
│                                               │
│        Section Heading (centered)             │
│                                               │
│  ┌──────────────────────────────────────────┐ │
│  │ [Stat 1]  │ [Stat 2*] │ [Stat 3] │ [4]  │ │
│  │  faded    │  ACTIVE   │  faded   │ faded │ │
│  │  label    │  label    │  label   │ label │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  ┌──────────────────────────────────────────┐ │
│  │                                           │ │
│  │    Animated visualization                 │ │
│  │    (changes per active stat)              │ │
│  │                                           │ │
│  └──────────────────────────────────────────┘ │
│                                     [⏸] [🌙] │
└───────────────────────────────────────────────┘
```

---

## 7. Render — Floating Icons CTA with Scroll Parallax

**What we're taking:** CTA section with scattered tech/brand icons as background, and a centered CTA card floating on top. Icons zoom in/out on scroll (parallax depth effect).

- Full-width dark section
- Background: scattered square icon tiles (tech logos — JS, Go, Python, PHP, Docker, Django, React, Vue, Rust, etc.) placed randomly across the area
- As user scrolls, icons zoom in (or out) creating parallax depth — feels like flying through the icons
- Centered on top: a clean white CTA card with heading + subtitle + button
- The CTA card stays centered/stable while icons move behind it
- For ClawHQ: icons could be AI model logos, channel logos (WhatsApp, Telegram, Discord, Slack), tool icons, etc.

**Layout pattern:**
```
┌──────────────────────────────────────────────┐
│                                               │
│    [icon]        [icon]           [icon]      │
│         [icon]          [icon]                │
│   [icon]     ┌─────────────────┐    [icon]   │
│              │  Big Heading     │             │
│    [icon]    │  Subtitle text   │   [icon]   │
│              │  [CTA Button >]  │             │
│   [icon]     └─────────────────┘    [icon]   │
│        [icon]          [icon]                 │
│   [icon]         [icon]          [icon]       │
│                                               │
│  ← icons zoom in/out on scroll (parallax) →  │
└───────────────────────────────────────────────┘
```

---

## 8. Supabase — Bento Grid with Hover-Interactive Cards

**What we're taking:** Mixed-size bento grid of feature cards, each with unique visuals that animate on hover.

- Top row: 1 large card (spans ~2 columns) + 2 medium cards side by side
- Bottom row: 4 equal-width cards
- Each card has:
  - Top-left: small icon + feature title (bold)
  - Below title: description text (some words highlighted/bold in accent color)
  - Lower area: unique visual/illustration tailored to that feature
- On HOVER, each card's visual comes alive:
  - Illustrations get accent color highlights (green glow on outlines)
  - Data starts flowing/animating (login rows appearing, cursors moving, API routes connecting)
  - Each card's hover animation is UNIQUE — not the same effect on all cards
- Dark cards with subtle borders, slightly lighter bg than page bg
- Grid has consistent gaps between cards
- For ClawHQ: features like "AI Models", "Agent Deployment", "Multi-Channel", "Real-Time Chat", "Monitoring", "Agent Store", "API Access"

**Layout pattern:**
```
┌─ Large Card ──────────────┐ ┌─ Med Card ──┐ ┌─ Med Card ──┐
│ 🔧 Feature Title           │ │ 🔒 Title     │ │ ⚡ Title     │
│ Description text...        │ │ Desc text   │ │ Desc text   │
│                            │ │             │ │             │
│  ┌─ Unique Visual ──────┐  │ │ ┌─ Visual ┐ │ │ ┌─ Visual ┐ │
│  │  (animates on hover) │  │ │ │ (hover) │ │ │ │ (hover) │ │
│  └──────────────────────┘  │ │ └─────────┘ │ │ └─────────┘ │
│ ✓ bullet  ✓ bullet        │ │             │ │             │
└────────────────────────────┘ └─────────────┘ └─────────────┘

┌─ Card ─────────┐ ┌─ Card ─────────┐ ┌─ Card ─────────┐ ┌─ Card ─────────┐
│ 📦 Title        │ │ ✨ Title        │ │ 🔮 Title        │ │ 🔗 Title        │
│ Desc text      │ │ Desc text      │ │ Desc text      │ │ Desc text      │
│ ┌─ Visual ───┐ │ │ ┌─ Visual ───┐ │ │ ┌─ Visual ───┐ │ │ ┌─ Visual ───┐ │
│ │ (hover)    │ │ │ │ (hover)    │ │ │ │ (hover)    │ │ │ │ (hover)    │ │
│ └────────────┘ │ │ └────────────┘ │ │ └────────────┘ │ │ └────────────┘ │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

## 8b. Supabase — Tabbed Dashboard with Dynamic Feature Bullets

**What we're taking:** Tab pills that switch BOTH a row of checkmark feature bullets AND a full embedded dashboard mockup below.

- Top: row of clickable tab pills (Table Editor, SQL Editor, RLS Policies — or whatever categories)
- Below tabs: row of checkmark (✓) feature bullet points — these CHANGE per selected tab
  - Each tab has its own unique set of 4-5 feature bullets
  - Tab 1 bullets are completely different from Tab 2 bullets
- Below bullets: full embedded dashboard mockup (macOS window chrome with ● ● ●) that also switches per tab
  - Each tab shows a completely different product view (table editor UI, code editor UI, policy config UI)
- The tab switch updates BOTH the bullet list AND the dashboard simultaneously
- Similar to 4e (Resend tabbed showcase) but with the added dynamic checkmark bullet row
- For ClawHQ: tabs like "Agent Chat", "Model Config", "Channel Setup" — each with unique feature bullets + dashboard mockup

**Layout pattern:**
```
┌──────────────────────────────────────────────────┐
│                                                   │
│  [Tab 1 pill]   [Tab 2 pill*]   [Tab 3 pill]    │
│                                                   │
│  ✓ Bullet A   ✓ Bullet B   ✓ Bullet C   ✓ D    │
│  ← these change per selected tab →                │
│                                                   │
│  ┌─ ● ● ● ──────────────────────────────────┐   │
│  │  Dashboard Title         Feedback  ☐  ⓘ  │   │
│  │  ┌─ Sidebar ─┐  ┌─ Main Content ───────┐ │   │
│  │  │ Nav items  │  │  (changes per tab)   │ │   │
│  │  │            │  │                      │ │   │
│  │  │            │  │  Tables / Code /     │ │   │
│  │  │            │  │  Policies / etc.     │ │   │
│  │  └────────────┘  └──────────────────────┘ │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

## 9. Claude — In-Window Tab Toggle

**What we're taking:** A tab toggle (pill switcher) placed INSIDE an embedded product mockup window, switching the content within the window.

- Dark embedded product window with subtle grid background
- Inside the window: a centered pill toggle with 2+ options (e.g. Chat / Cowork)
- Clicking a tab switches the content displayed inside the window — panels, layouts, visuals all change
- The toggle is part of the product UI itself, NOT outside the window
- Different from 8b where tabs are outside the mockup — here the toggle lives within the embedded demo
- For ClawHQ: inside a Mission Control / dashboard mockup, toggle between views like "Agent Chat" / "Monitoring" / "Deploy"

**Layout pattern:**
```
┌─ ● ● ● ─── Embedded Window ─────────────────┐
│                                               │
│         [ Tab A | Tab B* ]                    │
│                                               │
│   ┌─ Content ──────────────────────────────┐  │
│   │                                         │  │
│   │  (switches based on selected tab)       │  │
│   │                                         │  │
│   └─────────────────────────────────────────┘  │
│                                               │
└───────────────────────────────────────────────┘
```

---

## Final Design Decisions

### DESIGN SYSTEM — LOCKED IN

Built from 3 theme sources + creative additions. Dark mode only.

---

#### FONTS (from Dark Matter / tweakcn)

```css
--font-sans: Geist Mono, ui-monospace, monospace;   /* Body text — monospace everywhere = hacker/terminal aesthetic */
--font-mono: JetBrains Mono, monospace;              /* Code blocks, technical content */
--font-serif: serif;                                  /* Not used */
```

**Why Geist Mono for body:** Sets ClawHQ apart from every SaaS using Inter/Geist Sans. Entire page feels like a terminal/dev tool. Perfectly matches the "managed infrastructure" product identity.

---

#### BACKGROUNDS (from Caffeine / 21st.dev)

```css
/* Dark mode backgrounds — warm dark, NOT cold gray */
--background: #111111;           /* Page bg — warm near-black */
--card: #191919;                 /* Cards, panels — lifted layer */
--popover: #191919;              /* Popover/dropdown bg */
--muted: #222222;                /* Muted areas, secondary surfaces */
--accent: #2a2a2a;               /* Hover states, tertiary surface */
--border: #201e18;               /* Borders — warm dark, barely visible */
--input: #484848;                /* Input field borders */
--sidebar: #18181b;              /* Sidebar bg (if needed) */
```

**Depth layering system:**
```
Layer 0: #111111  (page bg)
Layer 1: #191919  (cards, panels)
Layer 2: #222222  (muted areas, nested cards)
Layer 3: #2a2a2a  (hover states, active surfaces)
Border:  #201e18  (warm dark — NOT cold gray)
```

---

#### COLORS (from Kodama Grove / tweakcn — adapted for dark mode)

```css
/* Primary — muted sage green. Nature/organic feel, NOT corporate blue */
--primary: oklch(0.6762 0.0567 132.4479);            /* ≈ #6b8f71 — sage green */
--primary-foreground: oklch(0.2686 0.0105 61.0213);  /* Dark text on primary */

/* Secondary — warm earth tone */
--secondary: oklch(0.4448 0.0239 84.5498);           /* ≈ #5a5344 — warm dark brown */
--secondary-foreground: oklch(0.9217 0.0235 82.1191); /* Light text */

/* Accent — warm golden/amber from Caffeine, NOT Kodama's muted accent */
--accent: #ffe0c2;               /* Warm cream/peach — from Caffeine primary */
--accent-foreground: #081a1b;    /* Dark text on accent */

/* Text hierarchy */
--foreground: #eeeeee;           /* Primary text — near white */
--muted-foreground: #b4b4b4;     /* Secondary text — warm gray */
/* Tertiary text: #808080 */     /* Use for timestamps, metadata */

/* Ring/focus */
--ring: oklch(0.6762 0.0567 132.4479);  /* Matches primary green */

/* Destructive */
--destructive: #e54d2e;          /* Red — from Caffeine */
--destructive-foreground: #ffffff;
```

**Color usage rules:**
- `--accent` (#ffe0c2 warm cream) = CTAs, pricing highlights, "Get Started" buttons, important badges
- `--primary` (sage green) = success states, active indicators, secondary buttons, links
- `--foreground` (#eeeeee) = all body text, headings
- `--muted-foreground` (#b4b4b4) = descriptions, subtitles
- `--destructive` (#e54d2e) = errors only
- NO color on backgrounds or large areas. Color is for accents, badges, buttons, small highlights ONLY

---

#### CHART/ACCENT COLORS (for pricing tiers, feature categories, stats)

```css
--chart-1: oklch(0.6762 0.0567 132.4479);  /* Sage green — Starter tier */
--chart-2: #ffe0c2;                          /* Warm cream — Pro tier */
--chart-3: oklch(0.7214 0.1337 49.9802);    /* Amber/orange from Dark Matter — Ultra tier */
--chart-4: oklch(0.5940 0.0443 196.0233);   /* Teal from Dark Matter — Enterprise tier */
--chart-5: oklch(0.5183 0.0390 137.1892);   /* Deep forest green — extra accent */
```

---

#### RADIUS & SHADOWS

```css
--radius: 0.625rem;             /* Slightly rounded — NOT sharp brutalist, NOT pill-shaped */

/* Shadows — very subtle, dark warm tone */
--shadow-sm: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 0px 1px 2px -1px hsl(0 0% 0% / 0.05);
--shadow-md: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 0px 2px 4px -1px hsl(0 0% 0% / 0.05);
--shadow-lg: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 0px 4px 6px -1px hsl(0 0% 0% / 0.05);
```

---

#### COMPLETE CSS (copy-paste ready for globals.css)

```css
.dark {
  /* Backgrounds (Caffeine) */
  --background: #111111;
  --card: #191919;
  --card-foreground: #eeeeee;
  --popover: #191919;
  --popover-foreground: #eeeeee;
  --muted: #222222;
  --muted-foreground: #b4b4b4;
  --accent: #2a2a2a;
  --accent-foreground: #eeeeee;
  --border: #201e18;
  --input: #484848;
  --ring: oklch(0.6762 0.0567 132.4479);

  /* Colors (Kodama Grove + Caffeine accent) */
  --primary: oklch(0.6762 0.0567 132.4479);
  --primary-foreground: oklch(0.2686 0.0105 61.0213);
  --secondary: oklch(0.4448 0.0239 84.5498);
  --secondary-foreground: #eeeeee;
  --destructive: #e54d2e;
  --destructive-foreground: #ffffff;

  /* Charts (tier colors) */
  --chart-1: oklch(0.6762 0.0567 132.4479);
  --chart-2: #ffe0c2;
  --chart-3: oklch(0.7214 0.1337 49.9802);
  --chart-4: oklch(0.5940 0.0443 196.0233);
  --chart-5: oklch(0.5183 0.0390 137.1892);

  /* Sidebar */
  --sidebar: #18181b;
  --sidebar-foreground: #eeeeee;
  --sidebar-primary: oklch(0.6762 0.0567 132.4479);
  --sidebar-primary-foreground: oklch(0.2686 0.0105 61.0213);
  --sidebar-accent: #2a2a2a;
  --sidebar-accent-foreground: #eeeeee;
  --sidebar-border: #222222;
  --sidebar-ring: oklch(0.6762 0.0567 132.4479);

  /* Typography (Dark Matter) */
  --font-sans: Geist Mono, ui-monospace, monospace;
  --font-mono: JetBrains Mono, monospace;
  --font-serif: serif;

  /* Radius */
  --radius: 0.625rem;

  /* Shadows */
  --shadow-2xs: 0px 1px 4px 0px hsl(0 0% 0% / 0.03);
  --shadow-xs: 0px 1px 4px 0px hsl(0 0% 0% / 0.03);
  --shadow-sm: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 0px 1px 2px -1px hsl(0 0% 0% / 0.05);
  --shadow: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 0px 1px 2px -1px hsl(0 0% 0% / 0.05);
  --shadow-md: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 0px 2px 4px -1px hsl(0 0% 0% / 0.05);
  --shadow-lg: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 0px 4px 6px -1px hsl(0 0% 0% / 0.05);
  --shadow-xl: 0px 1px 4px 0px hsl(0 0% 0% / 0.05), 0px 8px 10px -1px hsl(0 0% 0% / 0.05);
  --shadow-2xl: 0px 1px 4px 0px hsl(0 0% 0% / 0.13);
}
```

---

#### SPECIAL ACCENT COLOR: WARM CREAM (#ffe0c2)

This is the "hero" accent color from Caffeine. Use it for:
- CTA buttons ("Get Started", "Deploy Now")
- Pricing card highlights (recommended tier border/glow)
- Important badges, labels
- Hover underlines on links
- Stats/numbers that need to pop

It contrasts beautifully against #111111 bg and pairs with the sage green primary.

---

#### COMPONENT SOURCES

Components can come from ANY library — not limited to shadcn. Pick whatever looks best:
- **21st.dev** — 284+ hero components, pricing, features, testimonials, CTAs, backgrounds
- **shadcn/ui** — base components already in the project
- **tweakcn** — themed shadcn components
- **Magic UI** — animated components (number tickers, orbit, particles, shimmer)
- **Aceternity UI** — spotlight effects, 3D cards, moving borders, background beams
- **Framer Motion** — custom animations
- **Any other library** — if it looks good, use it

Install 21st.dev components via: `npx shadcn@latest add "https://21st.dev/r/{author}/{component}"`

---

### OVERALL VIBE

**Terminal-luxury SaaS.** Geist Mono everywhere gives it a raw, developer-first feel. Warm Caffeine darks (#111111, #191919) keep it cozy, not cold. Kodama Grove sage green for organic/natural accents. Warm cream (#ffe0c2) for CTAs that pop. The page should feel like a premium developer tool — not a corporate marketing site.

### AFTER CONTENT DECISIONS:
- **Section order:** TBD — decide after content/copy is reviewed. Will match design patterns to content.
- **Animations:** TBD — decide which sections get complex animations (3b, 3e, 4b, 6) vs simple ones.
- **Which pattern fits which content:** TBD — can mix 2-3 reference ideas into one section as needed.
