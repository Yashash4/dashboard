"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ChannelBar from "@/components/landing/ChannelBar";
import Footer from "@/components/landing/Footer";

// Lazy load below-fold sections
const Features = dynamic(() => import("@/components/landing/Features"), { ssr: false });
const Pricing = dynamic(() => import("@/components/landing/Pricing"), { ssr: false });
const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks"), { ssr: false });
const Comparison = dynamic(() => import("@/components/landing/Comparison"), { ssr: false });
const FAQ = dynamic(() => import("@/components/landing/FAQ"), { ssr: false });
const CTA = dynamic(() => import("@/components/landing/CTA"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[var(--radius)]">
        Skip to content
      </a>
      <Navbar />
      <div id="main-content">
        <Hero />
      </div>
      <ChannelBar />
      <Features />
      <Pricing />
      <HowItWorks />
      <Comparison />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
