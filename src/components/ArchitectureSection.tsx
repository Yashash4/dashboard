"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, MessageSquare, Server, Cpu } from "lucide-react";

const flowBoxVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: custom * 0.2,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export function ArchitectureSection() {
  return (
    <section
      id="architecture"
      className="relative py-24 md:py-32 bg-background overflow-hidden border-t border-white/[0.06]"
    >
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-block mb-4">
            <span className="text-primary font-mono text-sm tracking-widest">
              004
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-heading mb-4">
            How ClawHQ works under the hood
          </h2>
        </motion.div>

        {/* Desktop Flow */}
        <div className="hidden lg:block max-w-6xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-6">
            {/* Your Users */}
            <motion.div
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowBoxVariants}
              className="flex-1"
            >
              <div className="border border-white/20 bg-background p-6 text-center">
                <Users className="w-8 h-8 text-white/60 mx-auto mb-3" />
                <h3 className="text-white font-mono text-lg font-semibold">
                  Your Users
                </h3>
              </div>
            </motion.div>

            <ArrowRight className="w-6 h-6 text-white/30 flex-shrink-0" />

            {/* Channels */}
            <motion.div
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowBoxVariants}
              className="flex-1"
            >
              <div className="border border-white/20 bg-background p-6">
                <MessageSquare className="w-8 h-8 text-white/60 mx-auto mb-3" />
                <h3 className="text-white font-mono text-lg font-semibold text-center mb-3">
                  Channels
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground font-mono text-center">
                  <div>WhatsApp</div>
                  <div>Telegram</div>
                  <div>Slack</div>
                  <div>Discord</div>
                </div>
              </div>
            </motion.div>

            <ArrowRight className="w-6 h-6 text-white/30 flex-shrink-0" />

            {/* OpenClaw (Highlighted) */}
            <motion.div
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowBoxVariants}
              className="flex-1"
            >
              <div className="border-2 border-primary bg-primary/5 p-6 relative">
                <div className="absolute inset-0 bg-primary/5 blur-xl" />
                <div className="relative">
                  <Server className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="text-primary font-mono text-lg font-semibold text-center mb-1">
                    OpenClaw
                  </h3>
                  <p className="text-xs text-primary/70 font-mono text-center">
                    Your VPS
                  </p>
                </div>
              </div>
            </motion.div>

            <ArrowRight className="w-6 h-6 text-white/30 flex-shrink-0" />

            {/* AI Models */}
            <motion.div
              custom={3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowBoxVariants}
              className="flex-1"
            >
              <div className="border border-white/20 bg-background p-6">
                <Cpu className="w-8 h-8 text-white/60 mx-auto mb-3" />
                <h3 className="text-white font-mono text-lg font-semibold text-center mb-3">
                  AI Models
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground font-mono text-center">
                  <div>GPT-4</div>
                  <div>Claude</div>
                  <div>Llama</div>
                  <div>etc.</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile Flow */}
        <div className="lg:hidden max-w-md mx-auto mb-12">
          <div className="flex flex-col items-center gap-4">
            {/* Your Users */}
            <motion.div
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowBoxVariants}
              className="w-full"
            >
              <div className="border border-white/20 bg-background p-6 text-center">
                <Users className="w-8 h-8 text-white/60 mx-auto mb-3" />
                <h3 className="text-white font-mono text-lg font-semibold">
                  Your Users
                </h3>
              </div>
            </motion.div>

            <ArrowRight className="w-6 h-6 text-white/30 rotate-90" />

            {/* Channels */}
            <motion.div
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowBoxVariants}
              className="w-full"
            >
              <div className="border border-white/20 bg-background p-6">
                <MessageSquare className="w-8 h-8 text-white/60 mx-auto mb-3" />
                <h3 className="text-white font-mono text-lg font-semibold text-center mb-3">
                  Channels
                </h3>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground font-mono">
                  <span>WhatsApp</span>
                  <span>•</span>
                  <span>Telegram</span>
                  <span>•</span>
                  <span>Slack</span>
                  <span>•</span>
                  <span>Discord</span>
                </div>
              </div>
            </motion.div>

            <ArrowRight className="w-6 h-6 text-white/30 rotate-90" />

            {/* OpenClaw (Highlighted) */}
            <motion.div
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowBoxVariants}
              className="w-full"
            >
              <div className="border-2 border-primary bg-primary/5 p-6 relative">
                <div className="absolute inset-0 bg-primary/5 blur-xl" />
                <div className="relative text-center">
                  <Server className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="text-primary font-mono text-lg font-semibold mb-1">
                    OpenClaw
                  </h3>
                  <p className="text-xs text-primary/70 font-mono">
                    Your VPS
                  </p>
                </div>
              </div>
            </motion.div>

            <ArrowRight className="w-6 h-6 text-white/30 rotate-90" />

            {/* AI Models */}
            <motion.div
              custom={3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={flowBoxVariants}
              className="w-full"
            >
              <div className="border border-white/20 bg-background p-6">
                <Cpu className="w-8 h-8 text-white/60 mx-auto mb-3" />
                <h3 className="text-white font-mono text-lg font-semibold text-center mb-3">
                  AI Models
                </h3>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground font-mono">
                  <span>GPT-4</span>
                  <span>•</span>
                  <span>Claude</span>
                  <span>•</span>
                  <span>Llama</span>
                  <span>•</span>
                  <span>etc.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Labels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-muted-foreground font-mono"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary" />
            <span>Your Data Stays Yours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary" />
            <span>Zero Vendor Lock-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary" />
            <span>Full Root Access</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary" />
            <span>Open Source Core</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ArchitectureSection;
