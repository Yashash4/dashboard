import { ArrowRight } from "lucide-react";

const ArchitectureSection = () => {
  return (
    <section className="py-28 bg-black border-t border-white/[0.06]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mb-16">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white" />
            <span className="text-white text-[10px] font-mono tracking-wider">005</span>
            <div className="w-16 h-px bg-white" />
          </div>
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Architecture</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight font-mono">
            How it all connects.
          </h2>
          <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-lg">
            Each customer gets an isolated VPS running OpenClaw, connected to ClawHQ's API infrastructure through a secure proxy layer.
          </p>
        </div>

        <div className="max-w-3xl">
          <div className="border border-white/10 p-8 md:p-12 font-mono text-sm bg-white/[0.02]">
            <div className="space-y-6">
              {/* Row 1 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="border border-white/20 px-4 py-2.5 text-white whitespace-nowrap">
                  Your customers
                </div>
                <ArrowRight size={14} className="text-white/30 shrink-0 rotate-90 sm:rotate-0" />
                <div className="border border-white/20 px-4 py-2.5 text-white whitespace-nowrap">
                  WhatsApp · Telegram · Slack · ...
                </div>
              </div>

              {/* Connector */}
              <div className="pl-8 sm:pl-20 text-white/30">↓</div>

              {/* Row 2 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="border border-primary/30 px-4 py-2.5 text-primary whitespace-nowrap">
                  OpenClaw <span className="text-white/30 text-xs">(your VPS)</span>
                </div>
                <ArrowRight size={14} className="text-white/30 shrink-0 rotate-90 sm:rotate-0" />
                <div className="border border-primary/30 px-4 py-2.5 text-primary whitespace-nowrap">
                  ClawHQ Proxy
                </div>
                <ArrowRight size={14} className="text-white/30 shrink-0 rotate-90 sm:rotate-0" />
                <div className="border border-primary/30 px-4 py-2.5 text-primary whitespace-nowrap">
                  AI Models
                </div>
              </div>

              {/* Labels */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/40">
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
