const steps = [
  {
    num: "01",
    title: "Choose your plan",
    desc: "Starter, Pro, or Enterprise. Pick what fits — upgrade anytime.",
  },
  {
    num: "02",
    title: "We build your server",
    desc: "Dedicated VPS, Docker, OpenClaw, AI models — deployed within 24 hours.",
  },
  {
    num: "03",
    title: "Connect your channels",
    desc: "Tell us which channels your customers use. We configure all of them.",
  },
  {
    num: "04",
    title: "Start using your agents",
    desc: "Everything's live. Dashboard, agents, channels. No config on your end.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">How it works</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            From signup to live agents
            <br />
            <span className="text-muted-foreground">in under 24 hours.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden max-w-4xl">
          {steps.map((step) => (
            <div key={step.num} className="bg-card p-8">
              <span className="font-mono text-xs text-primary">{step.num}</span>
              <h3 className="mt-3 text-base font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
