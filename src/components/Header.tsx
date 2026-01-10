import React from "react";
import { HeartIcon } from "./icons/PaymentIcons";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <HeartIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <span>TipKoro</span>
        </a>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#offer" className="text-muted-foreground hover:text-foreground transition-colors">
              Offer
            </a>
            <a href="#signup" className="text-muted-foreground hover:text-foreground transition-colors">
              Join
            </a>
            <a href="#why" className="text-muted-foreground hover:text-foreground transition-colors">
              Why TipKoro
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
