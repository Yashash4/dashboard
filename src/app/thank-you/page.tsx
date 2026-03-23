"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, Loader2, PartyPopper, LayoutDashboard, Receipt } from "lucide-react";

import { PLANS } from "@/lib/payments/plans";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const planName = searchParams.get("plan") || "starter";

  const plan = PLANS.find((p) => p.name === planName);

  return (
    <div className="min-h-svh bg-[var(--bg-base)]">
      {/* Header */}
      <header className="border-b border-[var(--border-primary)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
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
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          {/* Success icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--success)]/10 mb-6">
            <PartyPopper size={28} className="text-[var(--success)]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
            Welcome to ClawHQ!
          </h1>
          <p className="text-[var(--text-secondary)] text-[17px] max-w-md mx-auto">
            Your payment was successful. Your {plan?.label || "ClawHQ"} plan is now active.
          </p>
        </div>

        {/* Order confirmation card */}
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
              <Check size={16} className="text-[var(--success)]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                Payment Confirmed
              </p>
              <p className="text-[13px] text-[var(--text-tertiary)]">
                A confirmation email has been sent to your inbox
              </p>
            </div>
          </div>

          <div className="border-t border-[var(--border-primary)] pt-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[14px] text-[var(--text-secondary)]">Plan</span>
              <span className="text-[14px] font-medium text-[var(--text-primary)]">
                ClawHQ {plan?.label}
              </span>
            </div>

            {plan && (
              <div className="space-y-2.5">
                <p className="text-[13px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                  Included Features
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-[14px] text-[var(--text-secondary)]"
                    >
                      <Check
                        size={13}
                        className="text-[var(--success)] mt-0.5 shrink-0"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-raised)] p-6 mb-8">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
            What happens next?
          </h2>
          <ol className="space-y-3">
            <li className="flex items-start gap-3 text-[14px] text-[var(--text-secondary)]">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[12px] font-bold shrink-0 mt-0.5">
                1
              </span>
              Our team provisions your dedicated VPS with OpenClaw installed and configured.
            </li>
            <li className="flex items-start gap-3 text-[14px] text-[var(--text-secondary)]">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[12px] font-bold shrink-0 mt-0.5">
                2
              </span>
              DNS, SSL, and security are set up automatically for your custom subdomain.
            </li>
            <li className="flex items-start gap-3 text-[14px] text-[var(--text-secondary)]">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[12px] font-bold shrink-0 mt-0.5">
                3
              </span>
              You will receive an email when your instance is ready (usually within a few hours).
            </li>
          </ol>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold bg-[var(--cta)] text-[var(--cta-foreground)] hover:opacity-90 transition-all"
          >
            <LayoutDashboard size={16} />
            Go to Dashboard
          </Link>
          <Link
            href="/billing"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-medium bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-elevated)] transition-all"
          >
            <Receipt size={16} />
            View Billing
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-[13px] text-[var(--text-tertiary)] mt-8">
          Questions? Contact us at{" "}
          <a href="mailto:hello@clawhq.tech" className="text-[var(--accent)] hover:underline">
            hello@clawhq.tech
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh bg-[var(--bg-base)] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
