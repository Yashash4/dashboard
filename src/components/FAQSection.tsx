import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What AI models are included?",
    a: "Starter includes Kimi K2.5, MiniMax M2.5, and one rotating model. Pro includes all Starter models with full context windows. Models can change or expand anytime as we add support.",
  },
  {
    q: "Can I use my own API keys?",
    a: "Yes — OpenClaw supports BYOK (Bring Your Own Key). But with ClawHQ, you don't need to. Models are bundled with your plan at no extra cost.",
  },
  {
    q: "What messaging channels are supported?",
    a: "WhatsApp, Telegram, Discord, Slack, Signal, Microsoft Teams, and more. Tell us which channels you need during setup and we configure them for you.",
  },
  {
    q: "How long does setup take?",
    a: "Your dedicated server and AI agents are live within 24 hours of payment. Channels are configured based on your request.",
  },
  {
    q: "What happens if I hit rate limits?",
    a: "Our limits are soft — designed to prevent abuse, not slow down your work. If you hit a limit, requests are throttled (not blocked). We don't publish hard numbers.",
  },
  {
    q: "Can I upgrade or downgrade?",
    a: "Yes. Upgrade anytime and we'll migrate your setup seamlessly. Downgrades take effect at the next billing cycle.",
  },
  {
    q: "Do you offer refunds?",
    a: "No. But we offer full transparency — you see exactly what you get before paying. No hidden costs, no surprise bills, no bait-and-switch.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-28">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 max-w-4xl mx-auto">
          <div>
            <span className="text-xs font-mono text-primary tracking-widest uppercase">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Common
              <br />
              questions.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Can't find what you're looking for?{" "}
              <a href="mailto:hello@clawhq.tech" className="text-primary hover:underline">
                Reach out
              </a>
              .
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-lg px-5 bg-card"
              >
                <AccordionTrigger className="text-left text-[13px] font-medium hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
