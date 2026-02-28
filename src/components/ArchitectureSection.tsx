import { ArrowRight } from "lucide-react";

const ArchitectureSection = () => {
  return (
    <section className="py-28 noise-bg">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Architecture</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            How it all connects.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-lg">
            Each customer gets an isolated VPS running OpenClaw, connected to ClawHQ's API infrastructure through a secure proxy layer.
          </p>
        </div>

        <div className="max-w-3xl">
          <div className="bg-card border border-border rounded-xl p-8 md:p-12 font-mono text-sm">
            <div className="space-y-6">
              {/* Row 1 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="bg-secondary rounded-lg px-4 py-2.5 text-foreground whitespace-nowrap">
                  Your customers
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0 rotate-90 sm:rotate-0" />
                <div className="bg-secondary rounded-lg px-4 py-2.5 text-foreground whitespace-nowrap">
                  WhatsApp · Telegram · Slack · ...
                </div>
              </div>

              {/* Connector */}
              <div className="pl-8 sm:pl-20 text-muted-foreground">↓</div>

              {/* Row 2 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 text-primary whitespace-nowrap">
                  OpenClaw <span className="text-muted-foreground text-xs">(your VPS)</span>
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0 rotate-90 sm:rotate-0" />
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 text-primary whitespace-nowrap">
                  ClawHQ Proxy
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0 rotate-90 sm:rotate-0" />
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 text-primary whitespace-nowrap">
                  AI Models
                </div>
              </div>

              {/* Labels */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                <span>• Isolated per customer</span>
                <span>• Rate limiting at proxy</span>
                <span>• Usage logging</span>
                <span>• Auto-failover</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
