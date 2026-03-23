import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ChannelBar from "@/components/landing/ChannelBar";
import Footer from "@/components/landing/Footer";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import Comparison from "@/components/landing/Comparison";
import FAQ from "@/components/landing/FAQ";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";

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
