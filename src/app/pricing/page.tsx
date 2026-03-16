"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { usePayment } from "@/hooks/use-payment";
import { PLANS, PLAN_PRICES } from "@/lib/payments/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AuthState = "loading" | "guest" | "no-sub" | "has-sub";

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan");

  const [annual, setAnnual] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: () => {
      toast.success("Welcome to ClawHQ!");
      router.push("/");
    },
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setAuthState("guest");
        return;
      }
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      setAuthState(sub?.plan ? "has-sub" : "no-sub");
    });
  }, []);

  // If user already has a subscription, send them to billing
  useEffect(() => {
    if (authState === "has-sub") {
      router.replace("/billing");
    }
  }, [authState, router]);

  async function handleSubscribe(planName: string) {
    if (authState === "guest") {
      router.push(`/register?plan=${planName}&cycle=${annual ? "annual" : "monthly"}`);
      return;
    }

    const prices = PLAN_PRICES[planName];
    if (!prices) return;

    setProcessingPlan(planName);
    const amount = annual ? prices.annual : prices.monthly;

    await initiatePayment({
      amount,
      paymentType: "subscription_new",
      metadata: {
        plan: planName,
        billing_cycle: annual ? "annual" : "monthly",
      },
    });

    setProcessingPlan(null);
  }

  if (authState === "loading" || authState === "has-sub") {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="ClawHQ"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-foreground text-sm font-semibold tracking-widest font-mono uppercase">
              ClawHQ
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {authState === "guest" ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Choose your plan
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Every plan includes AI models, all channels, dedicated VPS, managed
            infrastructure, and full dashboard access. No hidden fees.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-1 p-1 border border-border bg-card">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 text-sm transition-colors ${
                !annual
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 text-sm transition-colors ${
                annual
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="text-xs ml-1.5 opacity-80">Save up to 17%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isPreselected = preselectedPlan === plan.name;

            return (
              <Card
                key={plan.name}
                className={`border-border relative transition-colors ${
                  plan.highlighted
                    ? "border-[var(--cream)]/30"
                    : ""
                } ${isPreselected ? "ring-2 ring-primary" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <Badge
                      className={`text-xs ${
                        plan.highlighted
                          ? "bg-[var(--cream)] text-[var(--cream-foreground)] border-[var(--cream)]"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.label}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {plan.tagline}
                  </p>

                  {/* Price — always USD */}
                  {!plan.contactUs && (
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          $
                          {annual
                            ? Math.round(plan.annualUsd / 12)
                            : plan.monthlyUsd}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /mo
                        </span>
                      </div>
                      {annual && (
                        <p className="text-xs text-primary mt-1">
                          ${plan.annualUsd}/yr — Save {plan.annualSavings}
                        </p>
                      )}
                      {!annual && (
                        <p className="text-xs text-muted-foreground mt-1">
                          or ${plan.annualUsd}/yr
                        </p>
                      )}
                    </div>
                  )}
                  {plan.contactUs && (
                    <div className="mb-6">
                      <span className="text-3xl font-bold">Custom</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Starting at $999/mo
                      </p>
                    </div>
                  )}

                  {/* CTA — opens Razorpay directly, no confirm step */}
                  {plan.contactUs ? (
                    <Button className="w-full mb-6" variant="outline" asChild>
                      <a href="mailto:hello@clawhq.tech?subject=Enterprise%20Plan%20Inquiry">
                        Talk to Us
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      className={`w-full mb-6 ${
                        plan.highlighted
                          ? "bg-[var(--cream)] text-[var(--cream-foreground)] hover:bg-[var(--cream)]/90"
                          : ""
                      }`}
                      variant={plan.highlighted ? "default" : "outline"}
                      disabled={processingPlan === plan.name}
                      onClick={() => handleSubscribe(plan.name)}
                    >
                      {processingPlan === plan.name ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {authState === "guest" ? "Get Started" : "Subscribe"}
                      {processingPlan !== plan.name && (
                        <ArrowRight className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust bar */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Secure payments powered by Razorpay. Cancel anytime. 7-day
            money-back guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
