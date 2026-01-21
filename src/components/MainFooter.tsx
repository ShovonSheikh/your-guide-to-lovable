import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";

export function MainFooter() {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <footer className="flex w-full flex-col items-center bg-foreground px-6 py-16 text-background mt-auto">
      <div className="flex w-full max-w-[1280px] flex-col gap-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <span className="text-2xl font-bold font-display text-tipkoro-gold">TipKoro</span>
            <p className="text-sm text-background/70 leading-relaxed">
              Support your favorite Bangladeshi creators with tips through bKash, Nagad & Rocket.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/70 hover:text-tipkoro-gold transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-tipkoro-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-tipkoro-gold transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-tipkoro-gold transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-background font-display">Product</span>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => scrollToSection("how")}
                className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors text-left"
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors text-left"
              >
                Pricing
              </button>
              <Link to="/explore" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Explore Creators
              </Link>
              <button
                onClick={() => scrollToSection("creators")}
                className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors text-left"
              >
                For Creators
              </button>
            </div>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-background font-display">Company</span>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                About
              </Link>
              <a href="#" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Blog
              </a>
              <a href="#" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Careers
              </a>
              <Link to="/contact" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-background font-display">Resources</span>
            <div className="flex flex-col gap-2">
              <a href="#" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Help Center
              </a>
              <a href="#" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                FAQs
              </a>
              <a href="#" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Community
              </a>
              <Link to="https://status.tipkoro.com" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Status
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-background font-display">Legal</span>
            <div className="flex flex-col gap-2">
              <Link to="/terms-of-service" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy-policy" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Privacy Policy
              </Link>
              <Link to="/cookie-policy" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Cookie Policy
              </Link>
              <a href="#" className="text-sm text-background/70 hover:text-tipkoro-gold transition-colors">
                Licenses
              </a>
            </div>
          </div>
        </div>

        {/* Payment Methods & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-background/10">
          <div className="flex items-center gap-4">
            <span className="text-sm text-background/70">Supported payments:</span>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded bg-[#E2136E] text-background text-xs font-bold">bKash</span>
              <span className="px-2 py-1 rounded bg-[#F6921E] text-background text-xs font-bold">Nagad</span>
              <span className="px-2 py-1 rounded bg-[#8B2384] text-background text-xs font-bold">Rocket</span>
            </div>
          </div>
          <span className="text-sm text-background/50">© 2025 TipKoro. All rights reserved. Made with ❤️ in Bangladesh</span>
        </div>
      </div>
    </footer>
  );
}
