export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="text-lg font-semibold tracking-tight">
              claw<span className="text-primary">hq</span>
            </span>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs">
              Managed AI agent hosting. Dedicated VPS, bundled AI models, 7
              messaging channels, and a full dashboard. One price. Everything
              included.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Product
            </p>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#product-tour" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Product Tour
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Resources
            </p>
            <ul className="space-y-2">
              <li>
                <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/openclaw" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  OpenClaw on GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@clawhq.tech"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  hello@clawhq.tech
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Account */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Legal
            </p>
            <ul className="space-y-2">
              <li>
                <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>

            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 mt-6">
              Account
            </p>
            <ul className="space-y-2">
              <li>
                <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Log in
                </a>
              </li>
              <li>
                <a href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Get Started
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Open-source note */}
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-8">
          Built on open-source technology. No vendor lock-in. Your data stays on your server.
        </p>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ClawHQ. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
