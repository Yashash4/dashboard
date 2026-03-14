import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ChannelBar from "@/components/landing/ChannelBar";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Architecture from "@/components/landing/Architecture";
import DashboardShowcase from "@/components/landing/DashboardShowcase";
import Pricing from "@/components/landing/Pricing";
import Comparison from "@/components/landing/Comparison";
import WhyClawHQ from "@/components/landing/WhyClawHQ";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <ChannelBar />
      <Stats />
      <HowItWorks />
      <Features />
      <Architecture />
      <DashboardShowcase />
      <Pricing />
      <Comparison />
      <WhyClawHQ />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
