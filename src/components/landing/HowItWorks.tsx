"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Outer box */}
        <div className="bg-card border-l border-t border-primary pl-3 pt-3 sm:pl-6 sm:pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-3 sm:p-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
              You can get started with any plan in under 5 minutes. But as you
              grow, you can connect more channels, deploy more agents, or
              upgrade your server.
            </p>
          </motion.div>

          {/* Box 1: Pick a plan — inside outer */}
          <div className="border-l border-t border-primary pl-3 pt-3 sm:pl-6 sm:pt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-3 sm:p-6"
            >
              <h3 className="text-lg md:text-xl font-semibold text-primary mb-3">
                Pick a plan
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-lg">
                Choose from Starter, Pro, Ultra, or Enterprise. Every plan comes
                with a dedicated server, AI models, all 7 messaging
                channels, and a full management dashboard. No hidden add-ons.
              </p>
              <a
                href="#pricing"
                className="inline-block text-xs border border-muted-foreground/40 rounded px-4 py-2 text-foreground/80 hover:border-primary hover:text-primary transition-colors"
              >
                See pricing
              </a>
            </motion.div>

            {/* Box 2: We deploy — inside box 1 */}
            <div className="border-l border-t border-primary pl-3 pt-3 sm:pl-6 sm:pt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="p-3 sm:p-6"
              >
                <h3 className="text-lg md:text-xl font-semibold text-primary mb-3">
                  We deploy everything
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-lg">
                  Our team provisions your dedicated VPS, installs OpenClaw,
                  configures your custom domain with SSL, sets up the AI
                  gateway, and connects your dashboard. You don&apos;t touch a
                  terminal.
                </p>
                <a
                  href="#features"
                  className="inline-block text-xs border border-muted-foreground/40 rounded px-4 py-2 text-foreground/80 hover:border-primary hover:text-primary transition-colors"
                >
                  View what&apos;s included
                </a>
              </motion.div>

              {/* Box 3: Connect channels — inside box 2 */}
              <div className="border-l border-t border-primary pl-3 pt-3 sm:pl-6 sm:pt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="p-3 sm:p-6"
                >
                  <h3 className="text-lg md:text-xl font-semibold text-primary mb-3">
                    Connect your channels
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-lg">
                    WhatsApp, Telegram, Discord, Slack, Microsoft Teams, Signal,
                    or Webchat — connect any or all from your dashboard in one
                    click. Your AI assistant is instantly available wherever your
                    users are.
                  </p>
                  <a
                    href="#features"
                    className="inline-block text-xs border border-muted-foreground/40 rounded px-4 py-2 text-foreground/80 hover:border-primary hover:text-primary transition-colors"
                  >
                    Explore channels
                  </a>
                </motion.div>

                {/* Box 4: You're live — inside box 3 */}
                <div className="border-l border-t border-primary pl-3 pt-3 sm:pl-6 sm:pt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="p-3 sm:p-6"
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-primary mb-3">
                      You&apos;re live
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-lg">
                      Your agents are running on dedicated hardware. Deploy more
                      from the agent store, monitor CPU and RAM in real-time,
                      manage API keys, and scale up whenever you&apos;re ready.
                      Full control from day one.
                    </p>
                    <a
                      href="#pricing"
                      className="inline-block text-xs border border-muted-foreground/40 rounded px-4 py-2 text-foreground/80 hover:border-primary hover:text-primary transition-colors"
                    >
                      Get started
                    </a>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
