"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, Hash, Slack, Shield, Users, Globe } from "lucide-react";

const channels = [
  { name: "WhatsApp", icon: MessageSquare },
  { name: "Telegram", icon: Send },
  { name: "Discord", icon: Hash },
  { name: "Slack", icon: Slack },
  { name: "Microsoft Teams", icon: Users },
  { name: "Signal", icon: Shield },
  { name: "Webchat", icon: Globe },
];

const models = ["Kimi K2.5", "MiniMax M2.7", "DeepSeek V3", "Llama 4", "Qwen 3", "Mistral"];

export default function ChannelBar() {
  const items = [...channels, ...channels, ...channels, ...channels];
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section className="border-y border-[var(--border-primary)]">
      {/* Models bar */}
      <div className="border-b border-[var(--border-subtle)] py-4 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {models.map((model, i) => (
              <span key={model} className="text-[15px] text-[var(--text-secondary)]">
                {model}{i < models.length - 1 && <span className="text-[var(--text-tertiary)] ml-2">·</span>}
              </span>
            ))}
          </div>
          <span className="text-[13px] text-[var(--text-tertiary)]">
            All included. No API keys. No per-token billing.
          </span>
        </div>
      </div>

      {/* Channel marquee */}
      <div className="relative overflow-hidden py-5">
        {!reducedMotion && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10" />
          </>
        )}

        {reducedMotion ? (
          <div className="flex flex-wrap items-center justify-center gap-6 px-4">
            {channels.map((channel) => (
              <div key={channel.name} className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                <channel.icon size={16} strokeWidth={1.5} />
                <span className="text-[15px]">{channel.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex animate-marquee items-center">
            {items.map((channel, i) => (
              <div key={`${channel.name}-${i}`} className="flex items-center gap-2.5 mx-6 sm:mx-8 text-[var(--text-tertiary)] shrink-0 hover:text-[var(--text-secondary)] transition-colors duration-300">
                <channel.icon size={18} strokeWidth={1.5} />
                <span className="text-[15px] whitespace-nowrap">{channel.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
