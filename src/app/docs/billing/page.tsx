import Link from "next/link";

export default function DocsBillingPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Billing</h1>
      <p className="text-muted-foreground text-lg">
        The Billing page gives you full visibility into your subscription,
        payment history, invoices, and usage. All billing operations are managed
        directly from your ClawHQ dashboard.
      </p>

      <h2>Current Plan</h2>
      <p>
        The top of the Billing page displays your active subscription details:
      </p>
      <ul>
        <li><strong>Plan Name</strong> &mdash; Your current tier (Starter, Pro, Ultra, or Enterprise).</li>
        <li><strong>Status</strong> &mdash; Whether the subscription is active, past due, or cancelled.</li>
        <li><strong>Billing Cycle</strong> &mdash; Monthly or annual.</li>
        <li><strong>Price</strong> &mdash; The amount charged per cycle.</li>
        <li><strong>Renewal Date</strong> &mdash; The next date your subscription will be billed.</li>
      </ul>

      <h2>Plan Comparison</h2>
      <p>
        ClawHQ offers four subscription tiers. The plan comparison table below
        provides a full feature matrix to help you choose the right tier for your
        needs.
      </p>

      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Starter</th>
            <th>Pro</th>
            <th>Ultra</th>
            <th>Enterprise</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Price (monthly)</td><td>$59/mo</td><td>$129/mo</td><td>$350/mo</td><td>Custom</td></tr>
          <tr><td>Price (annual)</td><td>$50/mo</td><td>$110/mo</td><td>$298/mo</td><td>Custom</td></tr>
          <tr><td>AI Agents</td><td>Unlimited</td><td>Unlimited</td><td>Unlimited</td><td>Unlimited</td></tr>
          <tr><td>Channels</td><td>7 (all)</td><td>7 (all)</td><td>7 (all)</td><td>7 (all)</td></tr>
          <tr><td>Knowledge Base documents</td><td>50</td><td>500</td><td>Unlimited</td><td>Unlimited</td></tr>
          <tr><td>Monthly messages</td><td>5,000</td><td>50,000</td><td>Unlimited</td><td>Unlimited</td></tr>
          <tr><td>API access</td><td>Basic</td><td>Full</td><td>Full</td><td>Full + dedicated</td></tr>
          <tr><td>Support response time</td><td>24 hours</td><td>12 hours</td><td>4 hours</td><td>1 hour (SLA)</td></tr>
          <tr><td>Custom domain</td><td>No</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Analytics</td><td>Basic</td><td>Advanced</td><td>Advanced + exports</td><td>Advanced + exports</td></tr>
          <tr><td>Webhooks</td><td>2</td><td>10</td><td>Unlimited</td><td>Unlimited</td></tr>
          <tr><td>Mission Control</td><td>No</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Audit logging</td><td>7 days</td><td>30 days</td><td>90 days</td><td>365 days</td></tr>
          <tr><td>VPS resources</td><td>2 vCPU / 8 GB / 100 GB</td><td>4 vCPU / 16 GB / 200 GB</td><td>8 vCPU / 32 GB / 400 GB</td><td>Custom</td></tr>
        </tbody>
      </table>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary">Tip</p>
        <p className="text-sm text-muted-foreground mt-1">
          Switching to annual billing saves approximately 15% compared to monthly
          billing. You can switch between monthly and annual at any time from the
          Billing page.
        </p>
      </div>

      <h2>Annual Billing</h2>
      <p>
        Toggle the <strong>Annual Billing</strong> switch on the Billing page to
        see annual pricing. When you switch from monthly to annual billing, the
        change takes effect at your next renewal date. You will not be
        double-charged. Switching from annual back to monthly also takes effect
        at the next renewal. The savings are approximately 15% across all tiers.
      </p>

      <h2>Upgrading Your Plan</h2>
      <p>
        Upgrades take effect immediately. When you upgrade mid-cycle, ClawHQ
        calculates a prorated charge for the remaining days in your current
        billing period. The prorated amount is charged right away, and your next
        full billing cycle will reflect the new plan price.
      </p>
      <ol>
        <li>Go to <strong>Billing</strong> in your dashboard.</li>
        <li>Click <strong>Upgrade</strong> next to a higher tier.</li>
        <li>Review the prorated charge summary.</li>
        <li>Confirm the upgrade. Your new features are available instantly.</li>
      </ol>

      <h2>Downgrading Your Plan</h2>
      <p>
        Downgrades take effect at the end of your current billing cycle. You
        retain access to all features of your current plan until the renewal
        date, at which point the lower-tier plan activates. If your current
        usage exceeds the limits of the new plan (for example, you have 10
        agents but are downgrading to Starter which allows 1), you will be
        prompted to reduce usage before the downgrade activates.
      </p>

      <div className="not-prose bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-amber-400">Warning</p>
        <p className="text-sm text-muted-foreground mt-1">
          If you do not reduce usage before a downgrade activates, excess agents,
          channels, and documents will be deactivated automatically. Make sure to
          review your usage before confirming a downgrade.
        </p>
      </div>

      <h2>Payment Method</h2>
      <p>
        ClawHQ processes payments through Razorpay. You can pay using credit
        cards, debit cards, UPI, net banking, and select digital wallets. Your
        payment method is stored securely by Razorpay and can be updated at any
        time from the Billing page.
      </p>

      <h2>Payment History</h2>
      <p>
        The <strong>Payment History</strong> table shows all past transactions
        associated with your account. Each row includes:
      </p>
      <ul>
        <li><strong>Date</strong> &mdash; When the payment was processed.</li>
        <li><strong>Amount</strong> &mdash; The total charged.</li>
        <li><strong>Status</strong> &mdash; Whether the payment succeeded, failed, or is pending.</li>
        <li><strong>Invoice</strong> &mdash; A link to download the invoice as a PDF.</li>
      </ul>

      <h2>Invoice Download</h2>
      <p>
        Click the <strong>Download</strong> link in the payment history table to
        save an invoice as a PDF. Invoices include your account details, plan
        information, line items, tax breakdown, and payment reference number.
        These are suitable for expense reporting and accounting purposes.
      </p>

      <h2>Next Invoice Preview</h2>
      <p>
        The <strong>Next Invoice</strong> section shows a preview of your
        upcoming charge, including the plan price, any prorated adjustments, and
        the billing date. This helps you anticipate the next charge before it
        processes.
      </p>

      <h2>Coupon &amp; Discount Codes</h2>
      <p>
        If you have a coupon or discount code, enter it in the{" "}
        <strong>Coupon Code</strong> field on the Billing page and click{" "}
        <strong>Apply</strong>. Valid coupons will display the discount amount
        and duration (for example, &quot;20% off for 3 months&quot;). Coupons can be
        applied to new subscriptions or existing ones. Only one coupon can be
        active at a time.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary">Tip</p>
        <p className="text-sm text-muted-foreground mt-1">
          Coupon discounts are applied before tax. If you switch plans while a
          coupon is active, the discount carries over to the new plan for the
          remaining duration.
        </p>
      </div>

      <h2>Usage Summary</h2>
      <p>
        The <strong>Usage Summary</strong> card provides a snapshot of your
        current activity, showing metrics such as total messages sent, number of
        conversations, and active agents for the current billing period. This
        helps you gauge the value you are getting from your plan and decide
        whether an upgrade or downgrade makes sense. For example, you might see:
        &quot;245 messages, 34 conversations this week.&quot;
      </p>
      <p>
        For deeper usage insights, visit the{" "}
        <Link href="/docs/pro/analytics" className="text-primary hover:underline">Analytics</Link>{" "}
        page.
      </p>

      <h2>Failed Payments</h2>
      <p>
        If a payment fails, ClawHQ will retry the charge up to three times over
        the following 7 days. During this period, your subscription remains
        active. If all retries fail, the subscription is marked as{" "}
        <strong>Past Due</strong> and your services may be suspended. Update your
        payment method to resolve the issue, and the charge will be retried
        immediately.
      </p>

      <h2>Cancellation</h2>
      <p>
        You can cancel your subscription from the Billing page. Cancellation
        takes effect at the end of the current billing cycle. Your VPS and all
        associated data will remain accessible until the cycle ends. After that,
        your instance is deprovisioned. If you wish to permanently delete your
        account and data immediately, see the{" "}
        <Link href="/docs/account" className="text-primary hover:underline">Account Settings</Link>{" "}
        danger zone.
      </p>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/account" className="text-primary hover:underline">Manage your account</Link> settings and security.</li>
        <li><Link href="/dashboard/analytics" className="text-primary hover:underline">View detailed analytics</Link> to understand your usage patterns.</li>
        <li><Link href="/docs/support" className="text-primary hover:underline">Contact support</Link> for billing questions or disputes.</li>
      </ul>
    </article>
  );
}
