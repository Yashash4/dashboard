import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold font-mono">C</span>
          </div>
          <span className="text-white text-base font-semibold tracking-widest font-mono uppercase">
            ClawHQ
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[11px] text-white/50 hover:text-white transition-colors duration-200 font-mono tracking-wider uppercase"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            className="text-[11px] font-mono tracking-wider border border-white/30 text-white px-4 py-1.5 hover:bg-white hover:text-black transition-colors duration-200 uppercase"
          >
            Dashboard
          </a>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 pb-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-3 text-sm text-white/50 hover:text-white transition-colors font-mono tracking-wider uppercase"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            className="block mt-2 text-center border border-white/30 text-white px-5 py-2 text-sm font-mono tracking-wider uppercase"
            onClick={() => setMobileOpen(false)}
          >
            Dashboard
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
