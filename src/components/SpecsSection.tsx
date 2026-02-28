import { Cpu, HardDrive, Wifi, Database } from "lucide-react";

const tiers = [
  {
    label: "Starter",
    cpu: "2 vCPU",
    ram: "8 GB",
    storage: "100 GB NVMe",
    bandwidth: "8 TB",
  },
  {
    label: "Pro",
    cpu: "8 vCPU",
    ram: "32 GB",
    storage: "400 GB NVMe",
    bandwidth: "32 TB",
  },
];

const SpecsSection = () => {
  return (
    <section className="py-28 bg-black border-t border-white/[0.06]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mb-16">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white" />
            <span className="text-white text-[10px] font-mono tracking-wider">003</span>
            <div className="w-16 h-px bg-white" />
          </div>
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Transparency</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight font-mono">
            Your VPS specs.
            <br />
            <span className="text-white/40">Nothing hidden.</span>
          </h2>
          <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-lg font-mono">
            Every customer gets a dedicated server. Here's exactly what's under the hood — no fine print, no asterisks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {tiers.map((tier) => (
            <div key={tier.label} className="border border-white/10 p-8 bg-white/[0.02]">
              <span className="text-xs font-mono text-primary tracking-widest uppercase">{tier.label}</span>

              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-4">
                  <Cpu size={16} className="text-white/30" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium font-mono">{tier.cpu}</div>
                    <div className="text-xs text-white/40 font-mono">Processor cores</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Database size={16} className="text-white/30" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium font-mono">{tier.ram}</div>
                    <div className="text-xs text-white/40 font-mono">RAM</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <HardDrive size={16} className="text-white/30" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium font-mono">{tier.storage}</div>
                    <div className="text-xs text-white/40 font-mono">Disk storage</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Wifi size={16} className="text-white/30" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium font-mono">{tier.bandwidth}</div>
                    <div className="text-xs text-white/40 font-mono">Monthly bandwidth</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecsSection;
