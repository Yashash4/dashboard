import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ChannelBar from "@/components/landing/ChannelBar";
import Stats from "@/components/landing/Stats";
import ProductTour from "@/components/landing/ProductTour";
import Features from "@/components/landing/Features";
import BeforeAfter from "@/components/landing/BeforeAfter";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import WhyClawHQ from "@/components/landing/WhyClawHQ";
import Comparison from "@/components/landing/Comparison";
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
      <ProductTour />
      <Features />
      <BeforeAfter />
      <HowItWorks />
      <Pricing />
      <WhyClawHQ />
      <Comparison />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
