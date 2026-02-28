import { Server, Bot, MessageSquare, Shield, Gauge, Headphones } from "lucide-react";

const features = [
  {
    icon: Server,
    title: "Dedicated VPS",
    desc: "Your own isolated server — 2-8 vCPU, 8-32 GB RAM, NVMe storage. No noisy neighbors, no shared resources.",
  },
  {
    icon: Bot,
    title: "Bundled AI Models",
    desc: "Kimi K2.5, MiniMax M2.5, and a rotating third model included. Zero API key management, zero extra bills.",
  },
  {
    icon: MessageSquare,
    title: "Every Channel",
    desc: "WhatsApp, Telegram, Discord, Slack, Signal, Teams — we configure every channel your customers already use.",
  },
  {
    icon: Shield,
    title: "Managed Infra",
    desc: "We handle security patches, Docker updates, backups, and monitoring. Your agents stay online 24/7.",
  },
  {
    icon: Gauge,
    title: "Fair Usage",
    desc: "Soft rate limits designed to prevent abuse, not throttle your work. No published hard caps, no surprise blocks.",
  },
  {
    icon: Headphones,
    title: "Real Support",
    desc: "Dashboard tickets & email on Starter. Priority queue on Pro. White-glove with a dedicated human on Enterprise.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 bg-black border-t border-white/[0.06]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl mb-16">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white" />
            <span className="text-white text-[10px] font-mono tracking-wider">002</span>
            <div className="w-16 h-px bg-white" />
          </div>
          <span className="text-xs font-mono text-primary tracking-widest uppercase">What's included</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight font-mono">
            Everything you need.
            <br />
            <span className="text-white/40">Nothing you don't.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-black p-8 group hover:bg-white/[0.03] transition-colors duration-300"
            >
              <f.icon size={20} className="text-primary mb-5" strokeWidth={1.5} />
              <h3 className="text-base font-semibold mb-2.5 tracking-tight font-mono">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
