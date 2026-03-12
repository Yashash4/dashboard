"use client";

import {
  Check,
  CreditCard,
  Calendar,
  Receipt,
  Building2,
  Mail,
  ArrowRight,
  Loader2,
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
    price: "$59",
    annual: "$599/yr",
    features: [
      "2 vCPU, 8GB RAM, 100GB storage",
      "128K context window",
      "Model change once per month",
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
    price: "$129",
    annual: "$1,299/yr",
    features: [
      "8 vCPU, 32GB RAM, 400GB storage",
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
    price: "$350",
    annual: "$3,499/yr",
    features: [
      "16 vCPU, 64GB RAM, 800GB storage",
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
    price: "$999+",
    annual: "Custom",
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
  const subStatus = SUB_STATUS_CONFIG[subscription.status] || SUB_STATUS_CONFIG.active;
  const isCancelled = subscription.status === "cancelled";
  const cycleLabel = subscription.billing_cycle === "annual" ? "yr" : "mo";

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: () => window.location.reload(),
  });

  const handleUpgrade = async (plan: (typeof PLANS)[number]) => {
    const amount = parseFloat(plan.price.replace(/[^0-9.]/g, ""));
    if (!amount) return;

    await initiatePayment({
      amount,
      paymentType:
        subscription.plan === "starter" || !subscription.plan
          ? "subscription_new"
          : "subscription_upgrade",
      metadata: {
        plan: plan.name,
        billing_cycle: subscription.billing_cycle || "monthly",
      },
    });
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

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Plans</h2>
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
                  <p className="text-2xl font-bold mb-1">
                    {plan.price}
                    {!plan.contactUs && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                  </p>
                  {!plan.contactUs && (
                    <p className="text-xs text-muted-foreground mb-4">
                      or {plan.annual}
                    </p>
                  )}
                  {plan.contactUs && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Custom pricing
                    </p>
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
                      onClick={() => handleUpgrade(plan)}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Upgrade
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const payStatus =
                      PAY_STATUS_CONFIG[payment.status] || PAY_STATUS_CONFIG.paid;

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
