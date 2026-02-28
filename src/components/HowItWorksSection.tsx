const steps = [
  { num: "01", title: "Choose your plan", desc: "Pick Starter, Pro, or Enterprise based on your needs." },
  { num: "02", title: "We set up your server", desc: "Your dedicated VPS with OpenClaw is live within 24 hours." },
  { num: "03", title: "Connect your channels", desc: "WhatsApp, Telegram, Discord, Slack — tell us which ones." },
  { num: "04", title: "Start using your AI", desc: "Your AI assistant is ready. No config, no API keys. Just use it." },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            How it <span className="text-gradient">works</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="text-5xl font-extrabold text-primary/20 mb-4">{step.num}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
