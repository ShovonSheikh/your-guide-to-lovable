import React from "react";
import { HeartIcon } from "./icons/PaymentIcons";

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="container max-w-4xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-display font-bold">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HeartIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>TipKoro</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Support
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          © {new Date().getFullYear()} TipKoro. Made with ❤️ in Bangladesh.
        </p>
      </div>
    </footer>
  );
};
