"use client";

import { useState } from "react";
import {
  Check,
  CreditCard,
  Calendar,
  Receipt,
  Building2,
  Mail,
  ArrowRight,
  Loader2,
  Bell,
  HelpCircle,
} from "lucide-react";
import { usePayment } from "@/hooks/use-payment";
import { hasAccess, type Plan } from "@/lib/tier";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlanComparison } from "@/components/dashboard/plan-comparison";
import { BillingUsage } from "@/components/dashboard/billing-usage";
import { UpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { InvoiceDownload } from "@/components/dashboard/invoice-download";
import { CouponInput } from "@/components/dashboard/coupon-input";

interface Subscription {
  plan: string;
  billing_cycle: string;
  price: number;
  status: string;
  started_at: string;
  expires_at: string | null;
}

interface Payment {
  id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

const SUB_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-600 text-white border-green-600" },
  cancelled: { label: "Cancelled", className: "bg-red-600 text-white border-red-600" },
  expired: { label: "Expired", className: "bg-secondary text-secondary-foreground border-secondary" },
  pending: { label: "Pending", className: "bg-yellow-600 text-white border-yellow-600" },
};

const PAY_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-green-600 text-white border-green-600" },
  pending: { label: "Pending", className: "bg-yellow-600 text-white border-yellow-600" },
  failed: { label: "Failed", className: "bg-red-600 text-white border-red-600" },
  refunded: { label: "Refunded", className: "bg-secondary text-secondary-foreground border-secondary" },
};

const PLANS = [
  {
    name: "starter",
    label: "Starter",
    monthlyUsd: 59,
    annualUsd: 599,
    features: [
      "2 vCPU, 8GB RAM, 100GB storage",
      "128K context window",
      "5 model changes per billing cycle",
      "All messaging channels",
      "Chat with agents from dashboard",
      "OpenClaw dashboard access",
      "Dashboard ticket support",
      "Managed updates & backups",
    ],
  },
  {
    name: "pro",
    label: "Pro",
    monthlyUsd: 129,
    annualUsd: 1299,
    features: [
      "4 vCPU, 16GB RAM, 200GB storage",
      "Full context window (no cap)",
      "Instant & unlimited model changes",
      "Advanced monitoring & analytics",
      "Custom agent templates",
      "Priority support + live chat",
      "5x higher rate limits",
    ],
  },
  {
    name: "ultra",
    label: "Ultra",
    monthlyUsd: 350,
    annualUsd: 3499,
    features: [
      "8 vCPU, 32GB RAM, 400GB storage",
      "5X credits — full context window",
      "Mission Control command center",
      "Agent Squad Builder & orchestration",
      "Cost & token dashboard",
      "End-to-end tracing & debugging",
      "Workflow builder & automation",
      "RBAC workspaces & approvals",
      "Advanced API access & webhooks",
    ],
  },
  {
    name: "enterprise",
    label: "Enterprise",
    monthlyUsd: 999,
    annualUsd: 0,
    contactUs: true,
    features: [
      "Custom infrastructure",
      "Custom agents built for you",
      "Custom integrations & workflows",
      "Dedicated support + 1-on-1 calls",
      "5x rate limits",
      "White-glove setup",
    ],
  },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BillingOverview({
  subscription,
  payments,
}: {
  subscription: Subscription;
  payments: Payment[];
}) {
  const subStatus = SUB_STATUS_CONFIG[subscription.status] || { label: "Unknown", className: "bg-secondary text-secondary-foreground border-secondary" };
  const isCancelled = subscription.status === "cancelled";
  const cycleLabel = subscription.billing_cycle === "annual" ? "yr" : "mo";

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: () => window.location.reload(),
  });

  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  const [showAnnual, setShowAnnual] = useState(subscription.billing_cycle === "annual");

  const handleUpgrade = async (plan: (typeof PLANS)[number]) => {
    const amount = showAnnual ? plan.annualUsd : plan.monthlyUsd;
    if (!amount) return;

    await initiatePayment({
      amount,
      paymentType: "subscription_upgrade",
      metadata: {
        plan: plan.name,
        billing_cycle: showAnnual ? "annual" : "monthly",
      },
    });
    setUpgradeTarget(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payments.
        </p>
      </div>

      {/* Current Subscription */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Current Subscription</CardTitle>
            </div>
            <Badge className={`${subStatus.className} text-xs`}>
              {subStatus.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan</p>
              <p className="text-lg font-bold capitalize">{subscription.plan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-lg font-bold">
                ${Number(subscription.price).toFixed(2)}/{cycleLabel}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Started</p>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDate(subscription.started_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {isCancelled ? "Expires" : "Renews"}
              </p>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {subscription.expires_at
                  ? formatDate(subscription.expires_at)
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Invoice Preview */}
      {subscription.expires_at && subscription.status === "active" && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next Invoice</p>
                <p className="text-2xl font-bold">
                  ${Number(subscription.price).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                <p className="text-sm font-medium">
                  {formatDate(subscription.expires_at)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Auto-renew enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Plans</h2>
          <div className="flex items-center gap-3">
            {showAnnual && (
              <span className="text-xs text-green-500 font-medium">
                Save up to ${(350 * 12) - 3499}/yr with annual billing
              </span>
            )}
            <div className="flex items-center gap-2 border border-border p-1">
              <button
                onClick={() => setShowAnnual(false)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  !showAnnual
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setShowAnnual(true)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  showAnnual
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = subscription.plan === plan.name;

            return (
              <Card
                key={plan.name}
                className={`border-border relative ${
                  isCurrent ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-primary-foreground border-primary text-xs">
                      Current Plan
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-1">{plan.label}</h3>
                  {!plan.contactUs && !showAnnual && (
                    <>
                      <p className="text-2xl font-bold mb-1">
                        ${plan.monthlyUsd}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        or ${plan.annualUsd}/yr
                      </p>
                    </>
                  )}
                  {!plan.contactUs && showAnnual && (
                    <>
                      <p className="text-2xl font-bold mb-1">
                        ${plan.annualUsd}/yr
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        ${plan.monthlyUsd}/mo billed monthly
                      </p>
                    </>
                  )}
                  {plan.contactUs && (
                    <>
                      <p className="text-2xl font-bold mb-1">
                        {showAnnual ? "Custom" : `$${plan.monthlyUsd}+`}
                        {!showAnnual && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Custom pricing
                      </p>
                    </>
                  )}

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.contactUs ? (
                    <Button className="w-full" asChild>
                      <a
                        href={`mailto:support@clawhq.tech?subject=${encodeURIComponent(
                          "Enterprise Plan Inquiry"
                        )}`}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Us
                      </a>
                    </Button>
                  ) : !hasAccess(subscription.plan, plan.name as Plan) ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={isProcessing}
                      onClick={() => setUpgradeTarget(plan.name)}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Upgrade
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Plan Comparison Matrix */}
      <PlanComparison currentPlan={subscription.plan} />

      {/* Usage Summary */}
      <BillingUsage currentPlan={subscription.plan} />

      {/* Payment Method */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage your payment method to keep your subscription active. You can update your card or UPI details at any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild>
              <a
                href={`mailto:support@clawhq.tech?subject=${encodeURIComponent("Update Payment Method")}&body=${encodeURIComponent("Hi, I'd like to update my payment method for my ClawHQ subscription.\n\nAccount email: " + (subscription?.plan || ""))}`}
              >
                <Mail className="mr-2 h-4 w-4" />
                Update via Email
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/support/new">
                <HelpCircle className="mr-2 h-4 w-4" />
                Open Support Ticket
              </a>
            </Button>
          </div>
          <div className="border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              For security, payment method changes are verified by our team and typically processed within 1 business day.
              Your current subscription will remain active during the update.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coupon / Referral Code */}
      <CouponInput />

      {/* Billing Alerts */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Billing Alerts</p>
              <p className="text-xs text-muted-foreground">
                Billing alerts are delivered via the notification bell in your dashboard header.
                You will be notified before renewals and when payments are processed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Confirmation Dialog */}
      {upgradeTarget && (
        <UpgradeDialog
          currentPlan={subscription.plan}
          targetPlan={upgradeTarget}
          onConfirm={() => {
            const plan = PLANS.find((p) => p.name === upgradeTarget);
            if (plan) handleUpgrade(plan);
          }}
          isLoading={isProcessing}
          open={!!upgradeTarget}
          onOpenChange={(val) => { if (!val) setUpgradeTarget(null); }}
        />
      )}

      {/* Payment History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Payment History</h2>
        </div>

        {payments.length === 0 ? (
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No payment history yet.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const payStatus =
                      PAY_STATUS_CONFIG[payment.status] || { label: "Unknown", className: "bg-secondary text-secondary-foreground border-secondary" };

                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.description}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          ${Number(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${payStatus.className} text-xs`}>
                            {payStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <InvoiceDownload
                            paymentId={payment.id}
                            date={payment.created_at}
                            amount={payment.amount}
                            description={payment.description}
                            status={payment.status}
                            plan={subscription.plan}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
