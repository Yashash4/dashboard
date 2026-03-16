import Link from "next/link";

export const metadata = {
  title: "Terms of Service | ClawHQ",
  description: "ClawHQ Terms of Service - managed OpenClaw hosting platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
            Claw<span className="text-primary">HQ</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">
          Last updated: March 16, 2026
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account on, accessing, or otherwise using ClawHQ
              (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you acknowledge that you
              have read, understood, and agree to be bound by these Terms of
              Service (&quot;Terms&quot;). If you are using the Service on behalf of an
              organization, you represent and warrant that you have the authority
              to bind that organization to these Terms. If you do not agree with
              any part of these Terms, you must not use the Service.
            </p>
          </section>

          <hr className="border-border" />

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Description of Service
            </h2>
            <p className="mb-3">
              ClawHQ is a managed hosting platform for OpenClaw, the open-source
              AI agent framework. We provision a dedicated Virtual Private Server
              (VPS) for each customer, install and configure OpenClaw, set up
              DNS, SSL certificates, and an nginx reverse proxy, and provide a
              web dashboard for managing agents, channels, knowledge bases, and
              conversations.
            </p>
            <p className="mb-3">The Service is offered across four subscription tiers:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <span className="text-foreground font-medium">Starter</span> —
                $59/month: Unlimited free agents, all 7 channel integrations,
                dedicated VPS, AI models included, health monitoring, custom
                domain with auto-SSL, ticket support.
              </li>
              <li>
                <span className="text-foreground font-medium">Pro</span> —
                $129/month: Everything in Starter plus Agent Builder, Model
                Playground, Knowledge Base with AI search, Webhooks, full API
                access with SDKs, Logs Explorer, Usage Analytics, Audit Log,
                priority support.
              </li>
              <li>
                <span className="text-foreground font-medium">Ultra</span> —
                $350/month: Everything in Pro plus Mission Control command
                center, Kanban task board, agent orchestration and automation,
                session replay with traces, time tracking, priority support.
              </li>
              <li>
                <span className="text-foreground font-medium">Enterprise</span>{" "}
                — Starting at $999/month: Custom infrastructure, SLA
                guarantees, dedicated account manager, SSO, audit logging, and
                white-label options. Contact us for details.
              </li>
            </ul>
            <p className="mt-3">
              Tier features, resource allocations, and pricing are subject to
              change. We will provide at least 30 days&apos; notice before any pricing
              changes take effect for existing subscribers.
            </p>
          </section>

          <hr className="border-border" />

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Account Registration
            </h2>
            <p className="mb-3">To use the Service, you must:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Provide accurate, current, and complete registration information
                (including your legal name and a valid email address).
              </li>
              <li>Be at least 18 years of age or the age of majority in your jurisdiction.</li>
              <li>
                Maintain only one account per individual. Multiple accounts
                created by the same person may be merged or terminated at our
                discretion.
              </li>
              <li>
                Keep your account credentials secure. You are solely responsible
                for all activity that occurs under your account.
              </li>
            </ul>
            <p className="mt-3">
              You must notify us immediately at{" "}
              <a
                href="mailto:support@clawhq.tech"
                className="text-primary hover:underline"
              >
                support@clawhq.tech
              </a>{" "}
              if you suspect any unauthorized access to your account.
            </p>
          </section>

          <hr className="border-border" />

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Payment &amp; Billing
            </h2>
            <p className="mb-3">
              All subscription fees are billed in advance on either a monthly or
              annual basis, at your election. Current pricing is as follows:
            </p>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-left border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2 text-foreground font-medium">Tier</th>
                    <th className="px-4 py-2 text-foreground font-medium">Monthly</th>
                    <th className="px-4 py-2 text-foreground font-medium">Annual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2">Starter</td>
                    <td className="px-4 py-2">$59/mo</td>
                    <td className="px-4 py-2">$599/yr</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2">Pro</td>
                    <td className="px-4 py-2">$129/mo</td>
                    <td className="px-4 py-2">$1,299/yr</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2">Ultra</td>
                    <td className="px-4 py-2">$350/mo</td>
                    <td className="px-4 py-2">$3,499/yr</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Enterprise</td>
                    <td className="px-4 py-2" colSpan={2}>Custom pricing — contact sales</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mb-2">
              All prices are stated in United States Dollars (USD). Payments are
              processed securely through Razorpay. ClawHQ does not store your
              credit card or payment instrument details.
            </p>
            <p>
              If payment fails, we will attempt to charge your payment method up
              to three additional times over seven days. If all attempts fail,
              your account will be suspended until the balance is settled. VPS
              resources may be reclaimed 14 days after suspension.
            </p>
          </section>

          <hr className="border-border" />

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Refund Policy
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="text-foreground font-medium">
                  7-day money-back guarantee:
                </span>{" "}
                If you are a first-time subscriber and the Service does not meet
                your expectations, you may request a full refund within 7
                calendar days of your initial purchase. No questions asked.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  After 7 days:
                </span>{" "}
                Monthly subscriptions are non-refundable. Cancellations take
                effect at the end of the current billing period; no partial-month
                refunds will be issued.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Annual plans:
                </span>{" "}
                If you cancel an annual subscription within the first 30 days,
                you are eligible for a prorated refund for the unused months.
                After 30 days, annual subscriptions are non-refundable.
              </li>
            </ul>
            <p className="mt-3">
              To request a refund, email{" "}
              <a
                href="mailto:support@clawhq.tech"
                className="text-primary hover:underline"
              >
                support@clawhq.tech
              </a>{" "}
              with your account email and reason for the request. Refunds are
              typically processed within 5 to 10 business days.
            </p>
          </section>

          <hr className="border-border" />

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Service Level Agreement
            </h2>
            <p className="mb-3">
              We target <span className="text-foreground font-medium">99.9% uptime</span> for
              all managed VPS instances, measured on a calendar-month basis.
              Uptime is defined as the percentage of time your VPS and the
              ClawHQ dashboard are accessible and operational.
            </p>
            <p className="mb-3">This SLA excludes:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>
                Scheduled maintenance windows, for which we provide at least 24
                hours&apos; advance notice via email and dashboard notification.
              </li>
              <li>
                Downtime caused by factors outside our reasonable control,
                including force majeure events, upstream provider outages, or
                actions by you or third parties.
              </li>
            </ul>
            <p>
              Health checks are performed every 2 minutes. If your OpenClaw
              process crashes, our monitoring system will automatically attempt
              to restart it. If an issue persists, our team will be alerted and
              will investigate promptly.
            </p>
          </section>

          <hr className="border-border" />

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Acceptable Use
            </h2>
            <p className="mb-3">
              You agree not to use the Service for any of the following:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>
                Any activity that violates applicable local, national, or
                international law or regulation.
              </li>
              <li>
                Sending unsolicited bulk messages (spam), phishing, or social
                engineering attacks.
              </li>
              <li>
                Abusing AI model access, including prompt injection attacks
                against other users, generating illegal content, or
                circumventing model safety measures.
              </li>
              <li>
                Cryptocurrency mining or any sustained high-CPU workload not
                related to the intended use of the Service.
              </li>
              <li>
                Port scanning, network probing, or attempting to access systems
                or accounts you are not authorized to access.
              </li>
              <li>
                Reverse engineering, decompiling, or attempting to extract the
                source code of the ClawHQ platform (excluding OpenClaw itself,
                which is open source).
              </li>
              <li>
                Reselling or redistributing the Service without our written
                consent.
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these acceptable use policies. Where feasible, we will provide
              notice and an opportunity to remedy the violation before taking
              action.
            </p>
          </section>

          <hr className="border-border" />

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Data Ownership
            </h2>
            <p className="mb-3">
              <span className="text-foreground font-medium">Your data is yours.</span>{" "}
              You retain full ownership of all data stored on your VPS,
              including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Chat conversations and message history</li>
              <li>Knowledge base documents and embeddings</li>
              <li>Agent configurations and prompt templates</li>
              <li>Webhook payloads and integration data</li>
              <li>Audit logs and analytics data</li>
            </ul>
            <p className="mb-2">
              ClawHQ retains ownership of the platform code, dashboard
              application, provisioning scripts, proprietary tooling, and all
              infrastructure that powers the Service.
            </p>
            <p>
              Upon account deletion, your VPS and all data on it will be
              permanently wiped within 48 hours. We recommend exporting any data
              you wish to keep before deleting your account.
            </p>
          </section>

          <hr className="border-border" />

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Intellectual Property
            </h2>
            <p className="mb-2">
              OpenClaw is open-source software released under the MIT License.
              Your right to use OpenClaw is governed by that license,
              independent of these Terms.
            </p>
            <p>
              The ClawHQ platform, including but not limited to the dashboard
              interface, provisioning pipeline, monitoring systems, branding,
              documentation, and proprietary tools, is the exclusive property of
              ClawHQ and is protected by applicable intellectual property laws.
              You may not copy, modify, distribute, or create derivative works
              of the ClawHQ platform without our express written permission.
            </p>
          </section>

          <hr className="border-border" />

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Account Termination
            </h2>
            <p className="mb-3">
              <span className="text-foreground font-medium">By you:</span> You
              may cancel your subscription at any time from your Account
              settings in the dashboard. Upon cancellation, your Service will
              remain active until the end of your current billing period. After
              that, your VPS will be deprovisioned and data will be wiped within
              48 hours.
            </p>
            <p className="mb-3">
              <span className="text-foreground font-medium">By us:</span> We
              may terminate or suspend your account in the following
              circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>
                <span className="text-foreground">Violation of these Terms:</span>{" "}
                We will provide 30 days&apos; written notice and an opportunity to
                cure the violation, except in cases of severe violations (e.g.,
                illegal activity, security threats), where termination may be
                immediate.
              </li>
              <li>
                <span className="text-foreground">Non-payment:</span> If your
                account remains in arrears for more than 14 days after
                suspension.
              </li>
              <li>
                <span className="text-foreground">Inactivity:</span> Accounts
                with no login for 12 consecutive months may be flagged for
                closure. We will notify you at least 30 days before taking
                action.
              </li>
            </ul>
          </section>

          <hr className="border-border" />

          {/* 11 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              11. Limitation of Liability
            </h2>
            <p className="mb-3">
              To the maximum extent permitted by applicable law, ClawHQ and its
              officers, directors, employees, and affiliates shall not be liable
              for any indirect, incidental, special, consequential, or punitive
              damages, including but not limited to loss of profits, data, or
              business opportunities, arising out of or in connection with your
              use of the Service, whether based on warranty, contract, tort
              (including negligence), strict liability, or any other legal
              theory.
            </p>
            <p>
              Our total aggregate liability for any claims arising from or
              related to these Terms or the Service shall not exceed the amount
              you paid to ClawHQ in the twelve (12) months immediately preceding
              the event giving rise to the claim.
            </p>
          </section>

          <hr className="border-border" />

          {/* 12 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              12. Modifications to Terms
            </h2>
            <p>
              We may revise these Terms from time to time. For material changes,
              we will provide at least 30 days&apos; notice via email to the address
              associated with your account. Non-material changes (e.g.,
              typographic corrections, clarifications) may be made without
              notice. Your continued use of the Service after any modification
              constitutes acceptance of the revised Terms. If you do not agree
              with any modification, you may cancel your account before the
              changes take effect.
            </p>
          </section>

          <hr className="border-border" />

          {/* 13 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              13. Governing Law &amp; Dispute Resolution
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the
              laws of India, without regard to its conflict-of-law principles.
              Any disputes arising out of or relating to these Terms shall be
              subject to the exclusive jurisdiction of the courts located in
              India. Before initiating any formal legal proceedings, both parties
              agree to attempt to resolve disputes through good-faith
              negotiation for a period of at least 30 days.
            </p>
          </section>

          <hr className="border-border" />

          {/* 14 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              14. Contact
            </h2>
            <p>
              If you have questions, concerns, or feedback about these Terms,
              please contact us at:
            </p>
            <p className="mt-2">
              <a
                href="mailto:support@clawhq.tech"
                className="text-primary hover:underline"
              >
                support@clawhq.tech
              </a>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to home
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
