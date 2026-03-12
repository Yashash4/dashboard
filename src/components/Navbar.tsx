"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const links = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "API Docs", href: "/docs" },
    { label: "FAQ", href: "#faq" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return; // Allow normal navigation for non-hash links
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold font-mono">C</span>
          </div>
          <span className="text-white text-base font-semibold tracking-widest font-mono uppercase">
            ClawHQ
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = activeSection === link.href.slice(1);
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={`text-[11px] font-mono tracking-wider uppercase transition-colors duration-200 ${
                  isActive ? "text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <Link
            href="/register"
            className="text-[11px] font-mono tracking-wider border border-primary bg-primary text-primary-foreground px-4 py-1.5 hover:brightness-110 transition-all duration-200 uppercase"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-white/10 px-4 pb-4">
          {links.map((link) => {
            const isActive = activeSection === link.href.slice(1);
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={`block py-3 text-sm font-mono tracking-wider uppercase transition-colors ${
                  isActive ? "text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <Link
            href="/register"
            className="block mt-2 text-center border border-primary bg-primary text-primary-foreground px-5 py-2 text-sm font-mono tracking-wider uppercase hover:brightness-110 transition-all"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
