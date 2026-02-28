const Footer = () => {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold font-mono">C</span>
              </div>
              <span className="text-foreground text-sm font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                ClawHQ
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Managed OpenClaw hosting with bundled AI models. Your agents, built and managed for you.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-medium text-foreground mb-4 tracking-wide uppercase">Product</h4>
            <div className="space-y-2.5">
              <a href="#features" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#faq" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-medium text-foreground mb-4 tracking-wide uppercase">Company</h4>
            <div className="space-y-2.5">
              <a href="mailto:hello@clawhq.tech" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-medium text-foreground mb-4 tracking-wide uppercase">Connect</h4>
            <div className="space-y-2.5">
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Twitter / X</a>
              <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Discord</a>
            </div>
          </div>
        </div>

        <div className="line-gradient mt-10 mb-6" />
        <p className="text-[11px] text-muted-foreground">
          © 2026 ClawHQ. All rights reserved. clawhq.tech
        </p>
      </div>
    </footer>
  );
};

export default Footer;
