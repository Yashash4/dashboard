# Billing Page Enhancement — Full Implementation Guide

**Owner:** Plan 59 Agent
**Referenced from:** `TODO_59_STARTER.md` Section 9
**Total features:** 10
**Last updated:** 2026-03-15

---

## CONTEXT: Current Billing Page

**Files:**
- `src/app/dashboard/billing/page.tsx` — server component, fetches subscription + payments
- `src/components/dashboard/billing-overview.tsx` — client component with plan display, payment history, upgrade buttons

**Current layout:**
```
┌──────────────────────────────────────────────────────┐
│ Billing & Subscription                                │
├──────────────────────────────────────────────────────┤
│ Current Plan: Starter                                 │
│ Status: Active ✅                                     │
│ Billing Cycle: Monthly                                │
│ Price: $59/mo                                         │
│ Renews: April 15, 2026                                │
├──────────────────────────────────────────────────────┤
│ Upgrade                                               │
│ [Pro $129/mo] [Ultra $350/mo] [Enterprise →]         │
├──────────────────────────────────────────────────────┤
│ Payment History                                       │
│ Mar 15 — $59.00 — Paid ✅                             │
│ Feb 15 — $59.00 — Paid ✅                             │
└──────────────────────────────────────────────────────┘
```

**What's bad:**
- Upgrade buttons show price but NOT what you get (no feature list)
- No invoice download
- No payment method management
- Plan data hardcoded in the component (PLANS array)
- No usage summary (no value reinforcement)
- No billing cycle switch
- No next invoice preview
- Payment history is basic (date + amount + status)

---

## 9.1 PLAN COMPARISON ON BILLING PAGE

### What it is
Feature matrix showing what the user's current plan includes vs what they'd get by upgrading. THE #1 driver of upgrades.

### Current state
Upgrade section shows plan cards with price and a few bullet points. No side-by-side comparison. User doesn't know specifically what they're missing.

### What to build

**Feature comparison table below upgrade cards:**

```typescript
// src/components/dashboard/plan-comparison.tsx

const PLAN_FEATURES = [
  // { feature, starter, pro, ultra, enterprise }
  { feature: "Dedicated VPS", starter: "2 vCPU / 8GB", pro: "8 vCPU / 32GB", ultra: "16 vCPU / 64GB", enterprise: "Custom" },
  { feature: "AI Models Included", starter: "3 models", pro: "3+ models", ultra: "All models", enterprise: "Custom" },
  { feature: "Model Changes/Month", starter: "5", pro: "Unlimited", ultra: "Unlimited", enterprise: "Unlimited" },
  { feature: "Messaging Channels", starter: "All 7", pro: "All 7", ultra: "All 7", enterprise: "All 7 + Custom" },
  { feature: "Agent Store", starter: true, pro: true, ultra: true, enterprise: true },
  { feature: "Agent Chat", starter: true, pro: true, ultra: true, enterprise: true },
  { feature: "Agent Builder", starter: false, pro: true, ultra: true, enterprise: true },
  { feature: "Model Playground", starter: false, pro: true, ultra: true, enterprise: true },
  { feature: "Logs Explorer", starter: false, pro: true, ultra: true, enterprise: true },
  { feature: "Usage Analytics", starter: "Basic", pro: "Full", ultra: "Full + MC", enterprise: "Full + Custom" },
  { feature: "Knowledge Base (RAG)", starter: false, pro: true, ultra: true, enterprise: true },
  { feature: "Webhooks", starter: false, pro: "10 endpoints", ultra: "10 endpoints", enterprise: "Unlimited" },
  { feature: "API Access", starter: false, pro: "5 keys", ultra: "5 keys", enterprise: "Unlimited" },
  { feature: "Audit Log", starter: false, pro: true, ultra: true, enterprise: true },
  { feature: "Mission Control", starter: false, pro: false, ultra: true, enterprise: true },
  { feature: "Task Board (Kanban)", starter: false, pro: false, ultra: true, enterprise: true },
  { feature: "Agent Roster", starter: false, pro: false, ultra: true, enterprise: true },
  { feature: "Monitoring", starter: "Basic", pro: "Real-time", ultra: "Full + Alerts", enterprise: "Custom" },
  { feature: "Support", starter: "Tickets", pro: "Priority", ultra: "Priority", enterprise: "Dedicated" },
  { feature: "Custom Domain", starter: "3 domains", pro: "3 domains", ultra: "3 domains", enterprise: "Unlimited" },
  { feature: "Auto-Responses", starter: false, pro: true, ultra: true, enterprise: true },
  { feature: "Channel Analytics", starter: false, pro: true, ultra: true, enterprise: true },
];

interface PlanComparisonProps {
  currentPlan: string;
}

export function PlanComparison({ currentPlan }: PlanComparisonProps) {
  const [showAll, setShowAll] = useState(false);
  const displayFeatures = showAll ? PLAN_FEATURES : PLAN_FEATURES.slice(0, 10);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Plan Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-muted">
              <th className="text-left px-4 py-3 font-medium">Feature</th>
              <th className={`px-4 py-3 font-medium text-center ${currentPlan === "starter" ? "bg-primary/10 text-primary" : ""}`}>
                Starter $59
                {currentPlan === "starter" && <span className="block text-xs">(Your Plan)</span>}
              </th>
              <th className={`px-4 py-3 font-medium text-center ${currentPlan === "pro" ? "bg-primary/10 text-primary" : ""}`}>
                Pro $129
                {currentPlan === "pro" && <span className="block text-xs">(Your Plan)</span>}
              </th>
              <th className={`px-4 py-3 font-medium text-center ${currentPlan === "ultra" ? "bg-primary/10 text-primary" : ""}`}>
                Ultra $350
                {currentPlan === "ultra" && <span className="block text-xs">(Your Plan)</span>}
              </th>
              <th className="px-4 py-3 font-medium text-center">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {displayFeatures.map((row, i) => (
              <tr key={i} className="border-t border-border/50 even:bg-muted/20">
                <td className="px-4 py-2.5 font-medium">{row.feature}</td>
                {["starter", "pro", "ultra", "enterprise"].map(plan => {
                  const value = row[plan as keyof typeof row];
                  return (
                    <td key={plan} className={`px-4 py-2.5 text-center ${currentPlan === plan ? "bg-primary/5" : ""}`}>
                      {value === true ? <Check className="h-4 w-4 text-green-500 mx-auto" /> :
                       value === false ? <X className="h-4 w-4 text-muted-foreground/30 mx-auto" /> :
                       <span className="text-sm">{value}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showAll && PLAN_FEATURES.length > 10 && (
        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShowAll(true)}>
          Show all {PLAN_FEATURES.length} features
        </Button>
      )}
    </div>
  );
}
```

**Current plan column is highlighted** with primary color background. Features the user doesn't have show as ✗ (grayed out) — clearly showing what they're missing.

### Files to create
- `src/components/dashboard/plan-comparison.tsx`

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — add PlanComparison below upgrade cards

---

## 9.2 INVOICE DOWNLOAD

### What it is
Download a PDF invoice for each payment. Businesses need this for accounting and tax.

### What to build

**Generate invoice on demand:**

```typescript
// GET /api/billing/invoice/[paymentId]
// Auth + verify payment belongs to user
// Generate PDF or return structured invoice data
// Option A: return HTML that browser can print as PDF
// Option B: generate PDF server-side with a library

// Option A is simpler — return an HTML page styled for printing:

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Auth + get payment + get user + get subscription

  const invoiceData = {
    invoiceNumber: `INV-${payment.created_at.substring(0, 7).replace("-", "")}-${String(payment.id).substring(0, 6).toUpperCase()}`,
    // e.g., INV-202603-ABC123
    date: new Date(payment.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    customer: {
      name: user.name || user.email,
      email: user.email,
    },
    items: [
      {
        description: `ClawHQ ${subscription.plan} Plan — ${subscription.billing_cycle === "annual" ? "Annual" : "Monthly"} Subscription`,
        period: `${formatDate(payment.period_start)} — ${formatDate(payment.period_end)}`,
        amount: payment.amount,
      },
    ],
    total: payment.amount,
    status: payment.status,
    paymentMethod: payment.payment_method || "Card ending in ****",
  };

  // Return as HTML with print-friendly CSS
  const html = generateInvoiceHTML(invoiceData);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

function generateInvoiceHTML(invoice: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Geist Mono', monospace; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; letter-spacing: 4px; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; font-weight: 600; }
    .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
    .status-paid { background: #dcfce7; color: #166534; }
    .footer { margin-top: 60px; font-size: 12px; color: #999; text-align: center; }
    @media print { body { margin: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">CLAWHQ</div>
      <p>Managed OpenClaw Hosting</p>
    </div>
    <div class="invoice-info">
      <div class="invoice-number">${invoice.invoiceNumber}</div>
      <p>${invoice.date}</p>
      <span class="status status-paid">${invoice.status}</span>
    </div>
  </div>

  <div>
    <strong>Bill To:</strong><br>
    ${invoice.customer.name}<br>
    ${invoice.customer.email}
  </div>

  <table>
    <thead><tr><th>Description</th><th>Period</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${invoice.items.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.period}</td>
          <td style="text-align:right">$${item.amount.toFixed(2)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="total">Total: $${invoice.total.toFixed(2)} USD</div>

  <p style="margin-top: 20px; font-size: 14px;">Payment method: ${invoice.paymentMethod}</p>

  <button class="no-print" onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; cursor: pointer;">
    Download as PDF (Print)
  </button>

  <div class="footer">
    ClawHQ · clawhq.tech · Managed AI Agent Hosting
  </div>
</body>
</html>`;
}
```

**UI — download button per payment:**

In payment history, add a download icon button on each row:

```typescript
// In billing-overview.tsx payment history section:
<tr>
  <td>{formatDate(payment.created_at)}</td>
  <td>${payment.amount.toFixed(2)}</td>
  <td><Badge ...>{payment.status}</Badge></td>
  <td>
    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
      <a href={`/api/billing/invoice/${payment.id}`} target="_blank" rel="noopener noreferrer" title="Download Invoice">
        <Download className="h-3.5 w-3.5" />
      </a>
    </Button>
  </td>
</tr>
```

Opens in new tab → user clicks "Download as PDF" (browser print dialog) → saves as PDF.

### Files to create
- `src/app/api/billing/invoice/[id]/route.ts`

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — add download button per payment

---

## 9.3 PAYMENT METHOD DISPLAY + UPDATE

### What it is
Show current payment method (card last 4 digits, expiry). Allow updating the card without contacting support.

### What to build

**This depends on the payment provider.** If using Razorpay/Stripe, they provide APIs to:
1. Get saved payment method details
2. Create a session for updating payment method

**Display:**
```
┌──────────────────────────────────────┐
│ Payment Method                        │
│ 💳 Visa ending in 4242 · Exp 12/27  │
│ [Update Card]                         │
└──────────────────────────────────────┘
```

**Update flow:**
1. User clicks "Update Card"
2. Open payment provider's hosted form (Stripe Checkout, Razorpay form)
3. User enters new card details
4. Card saved to payment provider
5. Dashboard refreshes to show new card

```typescript
// GET /api/billing/payment-method
// Auth + get user's payment method from payment provider
// Returns: { card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2027 } | null }

// POST /api/billing/update-payment-method
// Creates a checkout/update session with payment provider
// Returns: { redirect_url: "https://..." } or { client_secret: "..." }
```

**If payment provider doesn't support saved cards:** Show "Contact support to update your payment method" with a link to create a support ticket.

### Files to create
- `src/app/api/billing/payment-method/route.ts` (GET)
- `src/app/api/billing/update-payment-method/route.ts` (POST)

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — add payment method card

---

## 9.4 USAGE SUMMARY (Value Reinforcement)

### What it is
Show users what they're getting for their money. "245 messages this month, 3 agents running, 5 channels connected." Reinforces value, reduces churn.

### What to build

**Aggregate stats for the current billing period:**

```typescript
// In billing page, alongside plan info:
const usageStats = {
  messages: 245,         // from chat analytics
  conversations: 34,     // unique conversations
  agents: 3,             // deployed agents count
  channels: 5,           // connected channels
  vpsUptime: "99.8%",    // calculated from status history
  daysActive: 28,        // days since subscription started
};
```

**UI — usage card below plan info:**

```
┌──────────────────────────────────────────────────────────┐
│ Your Usage This Month                                     │
│                                                           │
│ 💬 245 messages     🤖 3 agents     📱 5 channels         │
│ 📊 34 conversations ⏱ 99.8% uptime  📅 28 days active    │
│                                                           │
│ You're getting great value from your Starter plan! 🎉     │
│ ── or ──                                                  │
│ Unlock more with Pro: Analytics, API Access, Agent Builder │
│ [Compare Plans ↓]                                         │
└──────────────────────────────────────────────────────────┘
```

**Tone:** Positive reinforcement. "You're using X" not "You have X left." No scarcity language.

If usage is low: "Get more from your plan — try connecting a new channel or deploying another agent!"

### Files to modify
- `src/app/dashboard/billing/page.tsx` — fetch usage stats
- `src/components/dashboard/billing-overview.tsx` — add usage card

---

## 9.5 BILLING CYCLE TOGGLE (Monthly ↔ Annual)

### What it is
Switch between monthly and annual billing from the dashboard. Annual saves ~15%.

### What to build

**Display current cycle + switch option:**

```
┌──────────────────────────────────────┐
│ Billing Cycle: Monthly ($59/mo)      │
│                                       │
│ 💡 Save $109/year with annual billing │
│    Annual: $599/year ($49.92/mo)     │
│    [Switch to Annual →]               │
└──────────────────────────────────────┘
```

**Switch flow:**
1. User clicks "Switch to Annual"
2. Confirmation dialog: "Switch to annual billing? You'll be charged $599 for the next 12 months (saving $109 vs monthly). Effective from your next billing date."
3. On confirm: API calls payment provider to update subscription to annual
4. Proration handled by payment provider (or we calculate)

```typescript
// POST /api/billing/switch-cycle
// Body: { cycle: "annual" | "monthly" }
// Auth + verify user has active subscription
// Call payment provider to update billing cycle
// Update subscription record in Supabase
// Returns: { success: true, new_cycle: "annual", next_charge: { amount: 599, date: "2026-04-15" } }
```

**Annual pricing:**
| Plan | Monthly | Annual | Savings |
|------|---------|--------|---------|
| Starter | $59/mo | $599/yr ($49.92/mo) | $109/yr (15%) |
| Pro | $129/mo | $1,299/yr ($108.25/mo) | $249/yr (16%) |
| Ultra | $350/mo | $3,499/yr ($291.58/mo) | $701/yr (17%) |

### Files to create
- `src/app/api/billing/switch-cycle/route.ts`

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — add cycle display + switch button

---

## 9.6 NEXT INVOICE PREVIEW

### What it is
Show what the user will be charged next and when. Transparency = trust.

### What to build

```
┌──────────────────────────────────────┐
│ Next Invoice                          │
│                                       │
│ Amount: $59.00                        │
│ Date: April 15, 2026                  │
│ Plan: Starter (Monthly)               │
│                                       │
│ Auto-renew is ON                      │
└──────────────────────────────────────┘
```

**Data:** From subscription record: `plan`, `price`, `billing_cycle`, `expires_at` (next billing date).

If the user has a pending plan change (upgrade scheduled): show the new amount.

```typescript
// Already have this data in subscription record
const nextInvoice = {
  amount: subscription.billing_cycle === "annual" ? annualPrice : monthlyPrice,
  date: subscription.expires_at,
  plan: subscription.plan,
  cycle: subscription.billing_cycle,
};
```

No new API needed — data already fetched in the billing page.

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — add next invoice card

---

## 9.7 PLAN CHANGE CONFIRMATION

### What it is
Before upgrading, show exactly what changes: new features, new price, prorated charge, effective date.

### What to build

**Upgrade confirmation dialog:**

```
┌──────────────────────────────────────────────────────┐
│ Upgrade to Pro?                                       │
├──────────────────────────────────────────────────────┤
│ Price: $59/mo → $129/mo                              │
│ Effective: Immediately                                │
│ Prorated charge today: $47.00 (remaining days)       │
│                                                       │
│ What you'll get:                                      │
│ ✅ Logs Explorer — real-time log viewer               │
│ ✅ Usage Analytics — charts and insights              │
│ ✅ Knowledge Base — RAG-powered AI agents             │
│ ✅ Webhooks — 10 endpoints, auto-retry                │
│ ✅ API Access — SSE streaming, SDKs                   │
│ ✅ Audit Log — tamper-proof activity tracking          │
│ ✅ Agent Builder — create custom agents               │
│ ✅ Model Playground — compare models side-by-side     │
│ ✅ 8 vCPU / 32GB RAM (4x current resources)           │
│                                                       │
│ [Cancel]                    [Upgrade to Pro — $47.00] │
└──────────────────────────────────────────────────────┘
```

**Feature diff per upgrade path:**

```typescript
const UPGRADE_FEATURES: Record<string, Record<string, string[]>> = {
  "starter_to_pro": [
    "Logs Explorer — real-time log viewer",
    "Usage Analytics — full charts and insights",
    "Knowledge Base — RAG-powered agents with your documents",
    "Webhooks — 10 endpoints with auto-retry and delivery logs",
    "API Access — SSE streaming, SDKs, interactive docs",
    "Audit Log — tamper-proof activity tracking",
    "Agent Builder — create custom agents with AI",
    "Model Playground — compare models side-by-side",
    "8 vCPU / 32GB RAM (4x current resources)",
    "Instant model switching (no more waiting)",
    "Channel Analytics + Auto-Responses",
  ],
  "starter_to_ultra": [
    // all pro features +
    "Mission Control — command center for AI agents",
    "Task Board — Kanban for agent workflows",
    "Agent Roster — real-time agent monitoring",
    "Session Tracker — step-by-step execution traces",
    "16 vCPU / 64GB RAM (8x current resources)",
  ],
  "pro_to_ultra": [
    "Mission Control — command center for AI agents",
    "Task Board — Kanban with drag-drop, dependencies, automation",
    "Agent Roster — start/stop/restart agents, workload management",
    "Event Feed — real-time activity stream",
    "Session Tracker — execution traces with Gantt timeline",
    "16 vCPU / 64GB RAM (2x current resources)",
  ],
};
```

**Proration calculation:**
```typescript
function calculateProration(currentPrice: number, newPrice: number, daysRemaining: number, daysInCycle: number): number {
  const dailyDiff = (newPrice - currentPrice) / daysInCycle;
  return Math.max(0, Math.round(dailyDiff * daysRemaining * 100) / 100);
}
```

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — upgrade confirmation dialog with feature list + proration

---

## 9.8 BILLING ALERTS

### What it is
Notifications for billing events: payment failed, card expiring, plan renewing soon.

### What to build

**Ties into Notification Center (1.6).** Create billing-specific notifications:

```typescript
// Billing alert types:
// "payment_failed" — payment charge failed → "Your payment of $59.00 failed. Please update your payment method."
// "card_expiring" — card expires within 30 days → "Your card ending in 4242 expires next month. Update it to avoid service interruption."
// "plan_renewing" — 3 days before renewal → "Your Starter plan renews in 3 days ($59.00)."

// Check these via cron:
// GET /api/cron/billing-alerts
// Runs daily
// For each user:
//   - Check card expiry (if we have it from payment provider)
//   - Check subscription renewal date (if within 3 days)
//   - Check for failed payments
```

**UI:** These appear in the Notification Center bell icon (1.6) and optionally as email notifications.

**Also show on billing page itself:**

```
⚠️ Your card ending in 4242 expires next month. [Update Card →]
```

### Files to create
- `src/app/api/cron/billing-alerts/route.ts`

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — show alert banners
- Notification center integration

---

## 9.9 BILLING HISTORY WITH STATUS BADGES

### What it is
Color-coded status badges on each payment in the history list.

### What to build

```typescript
const PAYMENT_STATUS = {
  paid: { label: "Paid", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  failed: { label: "Failed", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  refunded: { label: "Refunded", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

// Already partially exists — the current code defaults unknown statuses to "Paid" (bug that was fixed).
// Just need proper color badges:

<Badge className={PAYMENT_STATUS[payment.status]?.className || PAYMENT_STATUS.pending.className}>
  {PAYMENT_STATUS[payment.status]?.label || payment.status}
</Badge>
```

**Enhanced payment history row:**

```
┌──────────────────────────────────────────────────────┐
│ Payment History                                       │
├──────────┬────────────┬──────────┬──────────┬────────┤
│ Date     │ Description│ Amount   │ Status   │        │
├──────────┼────────────┼──────────┼──────────┼────────┤
│ Mar 15   │ Starter    │ $59.00   │ 🟢 Paid  │ [📥]  │
│          │ Monthly    │          │          │        │
├──────────┼────────────┼──────────┼──────────┼────────┤
│ Feb 15   │ Starter    │ $59.00   │ 🟢 Paid  │ [📥]  │
│          │ Monthly    │          │          │        │
├──────────┼────────────┼──────────┼──────────┼────────┤
│ Jan 15   │ Starter    │ $59.00   │ 🔴 Failed│ [🔄]  │
│          │ Monthly    │          │          │ Retry  │
└──────────┴────────────┴──────────┴──────────┴────────┘
```

Failed payments show "Retry" button instead of download. Refunded payments show the refund amount.

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — proper status badges + enhanced table

---

## 9.10 REFERRAL / COUPON CODE

### What it is
Apply a discount code on the billing page. Growth feature for promotions.

### What to build

**Simple coupon application:**

```
┌──────────────────────────────────────┐
│ Have a coupon code?                   │
│ ┌──────────────────────┐ [Apply]     │
│ │ Enter coupon code    │             │
│ └──────────────────────┘             │
│                                       │
│ ✅ Coupon "LAUNCH20" applied!        │
│    20% off your next payment         │
└──────────────────────────────────────┘
```

**Database:**
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL, -- 'percent' or 'fixed'
  discount_value NUMERIC NOT NULL, -- 20 for 20%, or 10 for $10
  max_uses INTEGER, -- null = unlimited
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ, -- null = no expiry
  applicable_plans TEXT[], -- null = all plans, or ['starter', 'pro']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE applied_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coupon_id) -- each user can use a coupon once
);
```

**API:**
```typescript
// POST /api/billing/apply-coupon
// Body: { code: "LAUNCH20" }
// Validates: code exists, is active, not expired, not maxed out, user hasn't used it, applicable to user's plan
// Returns: { success: true, discount: { type: "percent", value: 20, message: "20% off your next payment" } }
// OR: { error: "Invalid or expired coupon code" }
```

**Integration with payment:** The coupon discount is applied at the payment provider level (Stripe/Razorpay coupon) or calculated server-side and reflected in the next invoice.

### Files to create
- `src/app/api/billing/apply-coupon/route.ts`
- Migration for `coupons` + `applied_coupons` tables

### Files to modify
- `src/components/dashboard/billing-overview.tsx` — add coupon input section

---

## BUILD ORDER

```
PHASE 1 — Visual Improvements (quick wins):
  9.9  Billing History Status Badges (fix existing, add colors)
  9.6  Next Invoice Preview (no new API, just display)
  9.4  Usage Summary (aggregate existing data)
  9.12 → (renumbered) Ticket Priority Visual — already covered elsewhere

PHASE 2 — Core Features:
  9.1  Plan Comparison (feature matrix table)
  9.7  Plan Change Confirmation (upgrade dialog with feature diff + proration)
  9.2  Invoice Download (HTML invoice + browser print)

PHASE 3 — Payment Management:
  9.3  Payment Method Display + Update (depends on payment provider)
  9.5  Billing Cycle Toggle (monthly ↔ annual)

PHASE 4 — Growth & Retention:
  9.8  Billing Alerts (cron + notifications)
  9.10 Referral / Coupon Code (DB + apply flow)
```

Phase 1 = improve what exists. Phase 2 = major features that drive upgrades. Phase 3 = payment management. Phase 4 = growth tools.
