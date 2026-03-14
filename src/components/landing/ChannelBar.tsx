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

  return (
    <section className="border-y border-border overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left: Big stat */}
        <div className="flex items-center gap-4 px-8 py-8 md:py-0 md:w-[340px] shrink-0 border-b md:border-b-0 md:border-r border-border">
          <span className="text-6xl md:text-7xl font-bold text-primary leading-none">
            7
          </span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground leading-tight">
            Channels
            <br />
            included on
            <br />
            every plan
          </span>
        </div>

        {/* Right: Scrolling marquee */}
        <div className="relative flex-1 overflow-hidden py-8">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#111111] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#111111] to-transparent z-10" />

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
        </div>
      </div>
    </section>
  );
}
