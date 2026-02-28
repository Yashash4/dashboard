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
    <section className="py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Transparency</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Your VPS specs.
            <br />
            <span className="text-muted-foreground">Nothing hidden.</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-lg">
            Every customer gets a dedicated server. Here's exactly what's under the hood — no fine print, no asterisks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {tiers.map((tier) => (
            <div key={tier.label} className="bg-card border border-border rounded-xl p-8">
              <span className="text-xs font-mono text-primary tracking-widest uppercase">{tier.label}</span>

              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-4">
                  <Cpu size={16} className="text-muted-foreground" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium">{tier.cpu}</div>
                    <div className="text-xs text-muted-foreground">Processor cores</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Database size={16} className="text-muted-foreground" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium">{tier.ram}</div>
                    <div className="text-xs text-muted-foreground">RAM</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <HardDrive size={16} className="text-muted-foreground" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium">{tier.storage}</div>
                    <div className="text-xs text-muted-foreground">Disk storage</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Wifi size={16} className="text-muted-foreground" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium">{tier.bandwidth}</div>
                    <div className="text-xs text-muted-foreground">Monthly bandwidth</div>
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
