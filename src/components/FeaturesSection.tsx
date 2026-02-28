import { Bot, Cloud, MessageSquare, Shield, Gauge, Headphones } from "lucide-react";

const features = [
  {
    icon: Cloud,
    title: "Dedicated VPS Hosting",
    desc: "Your own server with generous specs — 2-8 vCPU, 8-32 GB RAM, NVMe storage. No shared infrastructure.",
  },
  {
    icon: Bot,
    title: "Bundled AI Models",
    desc: "Kimi K2.5, MiniMax M2.5, and more included. No API keys, no separate bills. Just works.",
  },
  {
    icon: MessageSquare,
    title: "All Messaging Channels",
    desc: "WhatsApp, Telegram, Discord, Slack, Signal, Teams — connect any channel your customers use.",
  },
  {
    icon: Shield,
    title: "Managed Updates & Backups",
    desc: "We handle security patches, updates, and backups. Your agents stay online while you focus on your business.",
  },
  {
    icon: Gauge,
    title: "Fair Usage Policy",
    desc: "Soft rate limits designed to prevent abuse, not slow you down. No published hard caps.",
  },
  {
    icon: Headphones,
    title: "Support Included",
    desc: "Dashboard tickets and email support. Priority support on Pro. White-glove on Enterprise.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need,{" "}
            <span className="text-gradient">nothing hidden</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Full transparency. See exactly what you get at every tier.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-glow transition-all duration-300"
            >
              <f.icon size={28} className="text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
