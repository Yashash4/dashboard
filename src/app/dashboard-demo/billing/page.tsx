"use client";

import { useState } from "react";
import {
  Check,
  CreditCard,
  Calendar,
  Receipt,
  ArrowRight,
} from "lucide-react";

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

const DEMO_SUBSCRIPTION = {
  plan: "pro",
  billing_cycle: "monthly",
  price: 129,
  status: "active",
  started_at: "2026-01-15T00:00:00Z",
  expires_at: "2026-04-15T00:00:00Z",
};

const DEMO_PAYMENTS = [
  { id: "pay-1", amount: 129, description: "Pro Plan - March 2026", status: "paid", created_at: "2026-03-15T00:00:00Z" },
  { id: "pay-2", amount: 129, description: "Pro Plan - February 2026", status: "paid", created_at: "2026-02-15T00:00:00Z" },
  { id: "pay-3", amount: 129, description: "Pro Plan - January 2026", status: "paid", created_at: "2026-01-15T00:00:00Z" },
];

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
    monthlyUsd: 350,
    annualUsd: 3499,
    features: [
      "16 vCPU, 64GB RAM, 800GB storage",
      "5X credits - full context window",
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

export default function DemoBillingPage() {
  const subscription = DEMO_SUBSCRIPTION;
  const payments = DEMO_PAYMENTS;
  const subStatus = SUB_STATUS_CONFIG[subscription.status] || SUB_STATUS_CONFIG.active;
  const cycleLabel = subscription.billing_cycle === "annual" ? "yr" : "mo";
  const [showAnnual, setShowAnnual] = useState(subscription.billing_cycle === "annual");

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
              <p className="text-sm text-muted-foreground mb-1">Renews</p>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {subscription.expires_at ? formatDate(subscription.expires_at) : "\u2014"}
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

      {/* Plans */}
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
            const price = showAnnual ? plan.annualUsd : plan.monthlyUsd;

            return (
              <Card
                key={plan.name}
                className={`border-border relative ${
                  isCurrent ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-primary-foreground text-[10px]">
                      Current
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-6 pb-4">
                  <h3 className="text-lg font-bold">{plan.label}</h3>
                  <div className="mt-2 mb-4">
                    {"contactUs" in plan && plan.contactUs ? (
                      <p className="text-2xl font-bold">Custom</p>
                    ) : (
                      <p className="text-2xl font-bold">
                        ${price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{showAnnual ? "yr" : "mo"}
                        </span>
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      {"contactUs" in plan && plan.contactUs ? "Contact Us" : "Upgrade"}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Payment History</CardTitle>
          </div>
        </CardHeader>
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
                const payStatus = PAY_STATUS_CONFIG[payment.status] || PAY_STATUS_CONFIG.paid;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(payment.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.description}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      ${payment.amount.toFixed(2)}
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
    </div>
  );
}
