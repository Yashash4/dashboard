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
    a: "Yes! OpenClaw supports BYOK (Bring Your Own Key). But with ClawHQ, you don't need to — models are bundled with your plan at no extra cost.",
  },
  {
    q: "What messaging channels are supported?",
    a: "WhatsApp, Telegram, Discord, Slack, Signal, Microsoft Teams, and more. Tell us which channels you need during setup and we'll configure them for you.",
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
    a: "Yes. You can upgrade anytime and we'll migrate your setup. Downgrades take effect at the next billing cycle.",
  },
  {
    q: "Do you offer refunds?",
    a: "No, but we offer full transparency — you see exactly what you get before paying. No hidden costs, no surprise bills.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Frequently asked <span className="text-gradient">questions</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card border border-border rounded-xl px-6"
            >
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
