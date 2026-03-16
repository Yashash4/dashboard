"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  Hash,
  Slack,
  Shield,
  Users,
  Globe,
} from "lucide-react";

const channels = [
  { name: "WhatsApp", icon: MessageSquare },
  { name: "Telegram", icon: Send },
  { name: "Discord", icon: Hash },
  { name: "Slack", icon: Slack },
  { name: "Microsoft Teams", icon: Users },
  { name: "Signal", icon: Shield },
  { name: "Webchat", icon: Globe },
];

export default function ChannelBar() {
  const items = [...channels, ...channels];
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section className="border-y border-border overflow-hidden">
      {/* Trust banner */}
      <div className="border-b border-border/50 py-3 px-6">
        <p className="text-center text-xs text-muted-foreground tracking-wide">
          Trusted by teams building AI-first products
        </p>
      </div>
      <div className="flex flex-col md:flex-row">
        {/* Left: Stat badges */}
        <div className="flex items-center gap-6 px-8 py-8 md:py-0 md:w-[420px] shrink-0 border-b md:border-b-0 md:border-r border-border">
          <div className="flex items-center gap-3">
            <span className="text-5xl md:text-6xl font-bold text-primary leading-none">
              7
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight">
              Channels
              <br />
              supported
            </span>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex items-center gap-3">
            <span className="text-5xl md:text-6xl font-bold text-primary leading-none">
              30
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight">
              AI models
              <br />
              included
            </span>
          </div>
        </div>

        {/* Right: Scrolling marquee or static list */}
        <div className="relative flex-1 overflow-hidden py-8">
          {!reducedMotion && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
            </>
          )}

          {reducedMotion ? (
            <div className="flex flex-wrap items-center justify-center gap-6">
              {channels.map((channel) => (
                <div
                  key={channel.name}
                  className="flex items-center gap-2.5 text-muted-foreground"
                >
                  <channel.icon size={20} strokeWidth={1.5} />
                  <span className="text-sm whitespace-nowrap">{channel.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex animate-marquee items-center">
              {items.map((channel, i) => (
                <div
                  key={`${channel.name}-${i}`}
                  className="flex items-center gap-2.5 mx-8 text-muted-foreground shrink-0 hover:text-foreground transition-colors"
                >
                  <channel.icon size={20} strokeWidth={1.5} />
                  <span className="text-sm whitespace-nowrap">{channel.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
