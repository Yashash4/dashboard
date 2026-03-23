import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-primary)] py-14 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-14">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="ClawHQ" width={24} height={24} className="h-6 w-6" />
              <span className="text-[17px] font-semibold tracking-tight">ClawHQ</span>
            </div>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-xs">
              Managed AI agent hosting built on OpenClaw. Dedicated VPS, bundled AI models, 7 channels, full dashboard. One price.
            </p>
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-4">Product</p>
            <ul className="space-y-2.5">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Product Tour", href: "#product-tour" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-4">Resources</p>
            <ul className="space-y-2.5">
              {[
                { label: "Documentation", href: "/docs" },
                { label: "OpenClaw GitHub", href: "https://github.com/openclaw", external: true },
                { label: "Contact", href: "mailto:hello@clawhq.tech" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...('external' in link ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-4">Legal</p>
            <ul className="space-y-2.5">
              {[
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Log in", href: "/login" },
                { label: "Sign up", href: "/register" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[var(--border-primary)]">
          <p className="text-[14px] text-[var(--text-tertiary)]">&copy; {new Date().getFullYear()} ClawHQ. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-[14px] text-[var(--text-tertiary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
