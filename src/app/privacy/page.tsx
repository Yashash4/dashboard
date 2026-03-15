import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | ClawHQ",
  description: "ClawHQ Privacy Policy - how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">
          Last updated: March 16, 2026
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Introduction
            </h2>
            <p>
              ClawHQ (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your
              privacy. This Privacy Policy explains what personal data we
              collect, how we use it, who we share it with, and what rights you
              have regarding your data. By using ClawHQ, you consent to the
              practices described in this policy.
            </p>
          </section>

          <hr className="border-border" />

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Data We Collect
            </h2>
            <p className="mb-3">
              We collect only the minimum data necessary to provide and improve
              the Service:
            </p>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">
              Account Data
            </h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>
                Password (stored as a cryptographic hash — we never store or
                have access to your plaintext password)
              </li>
              <li>Account creation date and subscription tier</li>
            </ul>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">
              Payment Data
            </h3>
            <p className="mb-4">
              All payment processing is handled by Razorpay. We receive
              confirmation of payment status and transaction IDs, but we{" "}
              <span className="text-foreground font-medium">
                never store, process, or have access to your credit card
                numbers, bank account details, or other payment instrument
                information
              </span>
              . Please refer to{" "}
              <a
                href="https://razorpay.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Razorpay&apos;s Privacy Policy
              </a>{" "}
              for details on how they handle your payment data.
            </p>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">
              Usage Data
            </h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Login timestamps and IP addresses</li>
              <li>
                Feature usage metrics (e.g., which dashboard pages you visit,
                which actions you perform) — collected in anonymized,
                aggregated form
              </li>
              <li>Browser type and operating system (for compatibility purposes)</li>
            </ul>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">
              Support Data
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Support ticket content and any attachments you provide</li>
              <li>
                Communication history with our support team (email, in-app
                tickets)
              </li>
            </ul>
          </section>

          <hr className="border-border" />

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Data We Do NOT Collect or Access
            </h2>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 mb-4">
              <p className="text-foreground font-medium mb-3">
                Your data stays on YOUR server. We cannot and do not access your
                conversations, documents, or agent configurations.
              </p>
              <p>
                This is a core architectural principle of ClawHQ, not just a
                policy choice. Each customer gets a dedicated, isolated VPS. The
                following data is stored exclusively on your VPS and is never
                transmitted to or accessible by ClawHQ:
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="text-foreground font-medium">
                  Chat conversations
                </span>{" "}
                — All messages between your users and your AI agents are stored
                on your VPS. We have no access to message content.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Knowledge base documents
                </span>{" "}
                — Any files, URLs, or text you upload to your knowledge base
                remain on your VPS. Embeddings are generated and stored locally.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Agent configurations
                </span>{" "}
                — Your agent prompts, personalities, model selections, and
                routing rules are stored on your VPS.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Webhook payloads
                </span>{" "}
                — Incoming and outgoing webhook data is processed and stored on
                your VPS.
              </li>
              <li>
                <span className="text-foreground font-medium">Audit logs</span>{" "}
                — Activity logs generated by your OpenClaw instance stay on your
                VPS.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  API keys for third-party services
                </span>{" "}
                — Any API keys you configure (e.g., OpenAI, Anthropic) are
                written directly to your VPS configuration and are not stored in
                our systems.
              </li>
            </ul>
          </section>

          <hr className="border-border" />

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. How We Use Your Data
            </h2>
            <p className="mb-3">
              We use the data we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <span className="text-foreground">Providing the Service:</span>{" "}
                Creating and managing your account, provisioning your VPS,
                processing subscription payments.
              </li>
              <li>
                <span className="text-foreground">
                  Service communications:
                </span>{" "}
                Sending transactional emails (payment receipts, password resets,
                service alerts, maintenance notifications). We will never send
                marketing emails without your explicit opt-in consent.
              </li>
              <li>
                <span className="text-foreground">Support:</span> Responding to
                your support tickets and troubleshooting issues.
              </li>
              <li>
                <span className="text-foreground">Improving the Service:</span>{" "}
                Analyzing anonymized, aggregated usage patterns to improve
                features and user experience.
              </li>
              <li>
                <span className="text-foreground">Security:</span> Detecting and
                preventing fraud, abuse, and unauthorized access.
              </li>
            </ul>
          </section>

          <hr className="border-border" />

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Data Sharing
            </h2>
            <p className="mb-3">
              We share your personal data only when necessary to provide the
              Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>
                <span className="text-foreground font-medium">
                  Payment processor (Razorpay):
                </span>{" "}
                To process your subscription payments securely.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Infrastructure provider:
                </span>{" "}
                To provision and manage your dedicated VPS. We share only the
                minimum information required (e.g., server configuration
                parameters).
              </li>
              <li>
                <span className="text-foreground font-medium">
                  DNS provider (Cloudflare):
                </span>{" "}
                To configure your subdomain and SSL certificate.
              </li>
            </ul>
            <p className="text-foreground font-medium">
              We do not sell, rent, or trade your personal data to any third
              party. Ever.
            </p>
            <p className="mt-2">
              We may disclose your data if required to do so by law, court
              order, or governmental regulation, or if we believe in good faith
              that such disclosure is necessary to protect our rights, your
              safety, or the safety of others.
            </p>
          </section>

          <hr className="border-border" />

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Cookies
            </h2>
            <p className="mb-3">
              We use only essential cookies required for the Service to
              function:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>
                <span className="text-foreground">Authentication cookies:</span>{" "}
                To keep you signed in and maintain your session.
              </li>
              <li>
                <span className="text-foreground">Security cookies:</span> To
                prevent cross-site request forgery (CSRF) and other attacks.
              </li>
            </ul>
            <p className="text-foreground font-medium mb-2">We do NOT use:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Third-party tracking cookies</li>
              <li>Analytics cookies (e.g., Google Analytics)</li>
              <li>Advertising or retargeting cookies</li>
              <li>Social media tracking pixels</li>
            </ul>
          </section>

          <hr className="border-border" />

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Data Retention
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="text-foreground font-medium">
                  Account data:
                </span>{" "}
                Retained for as long as your account is active. After account
                deletion, your account data is permanently deleted within 30
                days.
              </li>
              <li>
                <span className="text-foreground font-medium">VPS data:</span>{" "}
                Upon account deletion or cancellation, your VPS and all data on
                it are permanently wiped within 48 hours.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Support tickets:
                </span>{" "}
                Automatically deleted 48 hours after ticket resolution. Active
                tickets are retained until resolved.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Payment records:
                </span>{" "}
                Transaction records may be retained for up to 7 years as
                required by applicable tax and financial regulations.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Server logs:
                </span>{" "}
                Access logs and error logs are retained for 30 days for security
                and debugging purposes, then automatically purged.
              </li>
            </ul>
          </section>

          <hr className="border-border" />

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Your Rights
            </h2>
            <p className="mb-3">
              Regardless of where you are located, we provide the following
              rights to all users, consistent with GDPR, CCPA, and other
              applicable privacy regulations:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="text-foreground font-medium">
                  Right to access:
                </span>{" "}
                View all personal data we hold about you from your Account
                settings in the dashboard.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Right to export:
                </span>{" "}
                Download a copy of your data via Account &rarr; Data Export in
                the dashboard.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Right to delete:
                </span>{" "}
                Permanently delete your account and all associated data via
                Account &rarr; Delete Account. This action is irreversible.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Right to correct:
                </span>{" "}
                Update your name, email, and other personal information from
                Account settings at any time.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Right to object:
                </span>{" "}
                If you object to any specific data processing, contact us at{" "}
                <a
                  href="mailto:support@clawhq.tech"
                  className="text-primary hover:underline"
                >
                  support@clawhq.tech
                </a>{" "}
                and we will address your concern promptly.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Right to restrict processing:
                </span>{" "}
                You may request that we limit the processing of your data in
                certain circumstances.
              </li>
            </ul>
            <p className="mt-3">
              We will respond to all privacy-related requests within 30 days. No
              fee is charged for exercising these rights.
            </p>
          </section>

          <hr className="border-border" />

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Security
            </h2>
            <p className="mb-3">
              We take the security of your data seriously and implement
              industry-standard measures to protect it:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <span className="text-foreground">Encryption in transit:</span>{" "}
                All data transmitted between your browser and our servers is
                encrypted using TLS 1.2 or higher (SSL/TLS).
              </li>
              <li>
                <span className="text-foreground">Password hashing:</span>{" "}
                Passwords are hashed using bcrypt with appropriate salt rounds.
                We never store plaintext passwords.
              </li>
              <li>
                <span className="text-foreground">
                  Encrypted VPS credentials:
                </span>{" "}
                SSH credentials and other sensitive VPS configuration data are
                encrypted at rest in our database.
              </li>
              <li>
                <span className="text-foreground">Regular updates:</span>{" "}
                Security patches are applied to both the ClawHQ platform and
                customer VPS instances promptly.
              </li>
              <li>
                <span className="text-foreground">Isolated environments:</span>{" "}
                Each customer runs on a dedicated VPS with its own firewall
                rules, ensuring complete isolation from other customers.
              </li>
            </ul>
            <p className="mt-3">
              If you discover a security vulnerability, please report it
              responsibly to{" "}
              <a
                href="mailto:support@clawhq.tech"
                className="text-primary hover:underline"
              >
                support@clawhq.tech
              </a>
              . We appreciate responsible disclosure and will work to address
              any confirmed vulnerabilities promptly.
            </p>
          </section>

          <hr className="border-border" />

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Children
            </h2>
            <p>
              ClawHQ is not intended for use by anyone under the age of 18. We
              do not knowingly collect personal data from children. If we
              discover that we have inadvertently collected data from a child
              under 18, we will delete it promptly. If you believe a child has
              provided us with personal data, please contact us at{" "}
              <a
                href="mailto:support@clawhq.tech"
                className="text-primary hover:underline"
              >
                support@clawhq.tech
              </a>
              .
            </p>
          </section>

          <hr className="border-border" />

          {/* 11 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              11. International Data Transfers
            </h2>
            <p>
              Your account data is stored on servers managed by our
              infrastructure providers, which may be located in various regions
              globally. Your dedicated VPS may also be provisioned in a data
              center outside your country of residence. By using the Service,
              you consent to the transfer of your data to these locations. We
              ensure that all data transfers comply with applicable data
              protection laws and that adequate safeguards are in place.
            </p>
          </section>

          <hr className="border-border" />

          {/* 12 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              12. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. For material
              changes, we will provide at least 30 days&apos; notice via email to the
              address associated with your account and a prominent notice on the
              dashboard. Non-material changes (e.g., clarifications, formatting)
              may be made without advance notice. Your continued use of the
              Service after any changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <hr className="border-border" />

          {/* 13 */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              13. Contact
            </h2>
            <p>
              For any privacy-related questions, concerns, or requests, please
              contact us at:
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
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
