"use client";

const brands = [
  "WhatsApp",
  "Telegram",
  "Slack",
  "Discord",
  "Instagram",
  "OpenAI",
  "Anthropic",
  "Meta",
];

const SocialProofSection = () => {
  return (
    <section className="py-12 border-t border-white/[0.06] bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 mb-8">
        <p className="text-center text-sm text-white/40 font-mono tracking-wider uppercase">
          Works with the tools you already use
        </p>
      </div>

      {/* Infinite scrolling marquee */}
      <div className="relative flex overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {/* First set of logos */}
          {brands.map((brand, index) => (
            <div
              key={`first-${index}`}
              className="mx-8 inline-flex items-center text-white/30 hover:text-white/50 transition-colors duration-300"
            >
              <span className="text-2xl font-mono font-semibold tracking-wider">
                {brand}
              </span>
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {brands.map((brand, index) => (
            <div
              key={`second-${index}`}
              className="mx-8 inline-flex items-center text-white/30 hover:text-white/50 transition-colors duration-300"
            >
              <span className="text-2xl font-mono font-semibold tracking-wider">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
