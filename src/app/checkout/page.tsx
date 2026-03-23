"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Loader2,
  Shield,
  CreditCard,
  Server,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase";
import { usePayment } from "@/hooks/use-payment";
import { PLANS, PLAN_PRICES } from "@/lib/payments/plans";

/* ─── Specs per plan for the order summary ─── */
const PLAN_SPECS: Record<string, { vcpu: string; ram: string; storage: string; bandwidth: string }> = {
  starter: { vcpu: "2 vCPU", ram: "8 GB", storage: "100 GB NVMe", bandwidth: "Unmetered" },
  pro: { vcpu: "4 vCPU", ram: "16 GB", storage: "200 GB NVMe", bandwidth: "Unmetered" },
  ultra: { vcpu: "8 vCPU", ram: "32 GB", storage: "400 GB NVMe", bandwidth: "Unmetered" },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planParam = searchParams.get("plan") || "starter";
  const cycleParam = searchParams.get("cycle") || "monthly";

  const [selectedPlan, setSelectedPlan] = useState(planParam);
  const [annual, setAnnual] = useState(cycleParam === "annual");
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: () => {
      router.push(`/thank-you?plan=${selectedPlan}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Auth check — redirect to register if not logged in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(
          `/register?plan=${planParam}&cycle=${cycleParam}`
        );
        return;
      }
      setIsAuthChecked(true);
    });
  }, [router, planParam, cycleParam]);

  const plan = PLANS.find((p) => p.name === selectedPlan);
  const prices = PLAN_PRICES[selectedPlan];
  const specs = PLAN_SPECS[selectedPlan];

  const handlePayment = useCallback(async () => {
    if (!prices) return;
    const amount = annual ? prices.annual : prices.monthly;

    await initiatePayment({
      amount,
      paymentType: "subscription_new",
      metadata: {
        plan: selectedPlan,
        billing_cycle: annual ? "annual" : "monthly",
      },
    });
  }, [prices, annual, selectedPlan, initiatePayment]);

  if (!isAuthChecked) {
    return (
      <div className="min-h-svh bg-[var(--bg-base)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (!plan || !prices || !specs) {
    return (
      <div className="min-h-svh bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-primary)] text-lg font-medium mb-2">
            Invalid plan selected
          </p>
          <Link href="/pricing" className="text-[var(--accent)] hover:underline text-sm">
            View all plans
          </Link>
        </div>
      </div>
    );
  }

  const monthlyPrice = annual ? Math.round(prices.annual / 12) : prices.monthly;
  const totalPrice = annual ? prices.annual : prices.monthly;
  const billingLabel = annual ? "/year" : "/month";

  return (
    <div className="min-h-svh bg-[var(--bg-base)]">
      {/* Header */}
      <header className="border-b border-[var(--border-primary)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="ClawHQ"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-[var(--text-primary)] text-sm font-semibold tracking-widest font-mono uppercase">
              ClawHQ
            </span>
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to plans
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
            Complete your order
          </h1>
          <p className="text-[var(--text-secondary)] text-[15px]">
            You are subscribing to ClawHQ {plan.label}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column — Order details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Plan selector */}
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-6">
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
                Select Plan
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {(["starter", "pro", "ultra"] as const).map((p) => {
                  const pd = PLANS.find((pl) => pl.name === p)!;
                  const pr = PLAN_PRICES[p];
                  const isActive = selectedPlan === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setSelectedPlan(p)}
                      className={`relative p-4 rounded-lg border text-left transition-all ${
                        isActive
                          ? "border-[var(--accent)] bg-[var(--accent)]/5"
                          : "border-[var(--border-primary)] bg-[var(--bg-subtle)] hover:border-[var(--border-secondary)]"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-3 right-3">
                          <Check size={14} className="text-[var(--accent)]" />
                        </div>
                      )}
                      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">
                        {pd.label}
                      </p>
                      <p className="text-[13px] text-[var(--text-secondary)]">
                        ${annual ? Math.round(pr.annual / 12) : pr.monthly}/mo
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Billing cycle */}
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-6">
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
                Billing Cycle
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAnnual(false)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    !annual
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border-primary)] bg-[var(--bg-subtle)] hover:border-[var(--border-secondary)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                      Monthly
                    </p>
                    {!annual && <Check size={14} className="text-[var(--accent)]" />}
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)]">
                    ${prices.monthly}/month
                  </p>
                </button>
                <button
                  onClick={() => setAnnual(true)}
                  className={`relative p-4 rounded-lg border text-left transition-all ${
                    annual
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border-primary)] bg-[var(--bg-subtle)] hover:border-[var(--border-secondary)]"
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent)] text-[var(--bg-base)]">
                    Save 17%
                  </span>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                      Annual
                    </p>
                    {annual && <Check size={14} className="text-[var(--accent)]" />}
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)]">
                    ${Math.round(prices.annual / 12)}/month (billed ${prices.annual}/yr)
                  </p>
                </button>
              </div>
            </div>

            {/* Server specs */}
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-6">
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
                Your Dedicated Server
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <Cpu size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-[13px] text-[var(--text-tertiary)]">CPU</p>
                    <p className="text-[15px] font-medium text-[var(--text-primary)]">{specs.vcpu}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <Server size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-[13px] text-[var(--text-tertiary)]">RAM</p>
                    <p className="text-[15px] font-medium text-[var(--text-primary)]">{specs.ram}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <HardDrive size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-[13px] text-[var(--text-tertiary)]">Storage</p>
                    <p className="text-[15px] font-medium text-[var(--text-primary)]">{specs.storage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <Wifi size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-[13px] text-[var(--text-tertiary)]">Bandwidth</p>
                    <p className="text-[15px] font-medium text-[var(--text-primary)]">{specs.bandwidth}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's included */}
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-6">
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
                What&#39;s Included
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-[14px] text-[var(--text-secondary)]"
                  >
                    <Check size={14} className="text-[var(--success)] mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right column — Order summary & Pay */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-6">
                <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[var(--text-secondary)]">Plan</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      ClawHQ {plan.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[var(--text-secondary)]">Billing</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {annual ? "Annual" : "Monthly"}
                    </span>
                  </div>
                  {annual && (
                    <div className="flex justify-between text-[14px]">
                      <span className="text-[var(--text-secondary)]">Monthly rate</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        ${monthlyPrice}/mo
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--border-primary)] pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                      Total
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[var(--text-primary)]">
                        ${totalPrice}
                      </span>
                      <span className="text-[14px] text-[var(--text-secondary)] ml-1">
                        {billingLabel}
                      </span>
                    </div>
                  </div>
                  {annual && plan.annualSavings && (
                    <p className="text-[13px] text-[var(--accent)] text-right mt-1">
                      You save {plan.annualSavings} per year
                    </p>
                  )}
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[15px] font-semibold bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  {isProcessing ? "Processing..." : `Pay $${totalPrice}`}
                </button>
              </div>

              {/* Trust signals */}
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Shield size={16} className="text-[var(--success)]" />
                  <span className="text-[14px] font-medium text-[var(--text-primary)]">
                    Secure Checkout
                  </span>
                </div>
                <ul className="space-y-2">
                  <li className="text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                    <Check size={12} className="text-[var(--success)] shrink-0" />
                    256-bit SSL encryption
                  </li>
                  <li className="text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                    <Check size={12} className="text-[var(--success)] shrink-0" />
                    Powered by Razorpay
                  </li>
                  <li className="text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                    <Check size={12} className="text-[var(--success)] shrink-0" />
                    7-day money-back guarantee
                  </li>
                  <li className="text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                    <Check size={12} className="text-[var(--success)] shrink-0" />
                    Cancel anytime
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh bg-[var(--bg-base)] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
