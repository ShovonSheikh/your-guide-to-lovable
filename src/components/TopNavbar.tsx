import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";
import { HeartIcon } from "./icons/PaymentIcons";
import { useProfile } from "@/hooks/useProfile";
import { Menu, X, LayoutGrid, Shield } from "lucide-react";

export function TopNavbar({ className }: { className?: string }) {
  const { isSignedIn, isLoaded } = useUser();
  const { profile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const isAdmin = profile?.is_admin;

  const scrollToSection = (id: string) => {
    // If we're on the home page, scroll directly
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      // Navigate to home page with hash
      navigate(`/#${id}`);
    }
    setMobileMenuOpen(false);
  };
  
  return (
    <div className={cn("fixed inset-x-0 top-4 z-50 px-4", className)}>
      <div className="mx-auto max-w-5xl rounded-full border border-border bg-background/80 px-3 shadow-tipkoro backdrop-blur-md">
        <div className="flex items-center justify-between py-2 gap-2">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HeartIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">TipKoro</span>
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => scrollToSection("how")} 
              className="rounded-full bg-secondary/50 px-4 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              How it Works
            </button>
            <button 
              onClick={() => scrollToSection("pricing")} 
              className="rounded-full bg-secondary/50 px-4 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Pricing
            </button>
            <Link 
              to="/explore"
              className="rounded-full bg-secondary/50 px-4 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Explore
            </Link>
          </nav>
          
          {/* Right-side actions */}
          <div className="hidden md:flex items-center gap-2">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <Link to="/admin">
                        <Button variant="outline" className="rounded-full px-4 h-9 gap-2">
                          <Shield className="w-4 h-4" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Link to="/dashboard">
                      <Button variant="outline" className="rounded-full px-4 h-9">
                        Dashboard
                      </Button>
                    </Link>
                    <UserButton afterSignOutUrl="/">
                      <UserButton.MenuItems>
                        <UserButton.Link
                          label="Dashboard"
                          labelIcon={<LayoutGrid className="w-4 h-4" />}
                          href="/dashboard"
                        />
                        {isAdmin && (
                          <UserButton.Link
                            label="Admin Panel"
                            labelIcon={<Shield className="w-4 h-4" />}
                            href="/admin"
                          />
                        )}
                      </UserButton.MenuItems>
                    </UserButton>
                  </div>
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <Button variant="ghost" className="rounded-full px-4 h-9 text-sm font-medium">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button
                        variant="default"
                        className="rounded-full px-6 h-10 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Get Started
                      </Button>
                    </SignUpButton>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-full hover:bg-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-5xl rounded-2xl border border-border bg-background/95 p-4 shadow-tipkoro backdrop-blur-md animate-fade-in">
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => scrollToSection("how")} 
              className="rounded-xl bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 text-left"
            >
              How it Works
            </button>
            <button 
              onClick={() => scrollToSection("pricing")} 
              className="rounded-xl bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 text-left"
            >
              Pricing
            </button>
            <Link 
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Explore
            </Link>
            
            <div className="border-t border-border pt-3 mt-2">
              {isLoaded && (
                <>
                  {isSignedIn ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {isAdmin && (
                            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                              <Button variant="outline" className="rounded-xl gap-2">
                                <Shield className="w-4 h-4" />
                                Admin
                              </Button>
                            </Link>
                          )}
                          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="outline" className="rounded-xl">
                              Dashboard
                            </Button>
                          </Link>
                        </div>
                        <UserButton afterSignOutUrl="/">
                          <UserButton.MenuItems>
                            <UserButton.Link
                              label="Dashboard"
                              labelIcon={<LayoutGrid className="w-4 h-4" />}
                              href="/dashboard"
                            />
                            {isAdmin && (
                              <UserButton.Link
                                label="Admin Panel"
                                labelIcon={<Shield className="w-4 h-4" />}
                                href="/admin"
                              />
                            )}
                          </UserButton.MenuItems>
                        </UserButton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <SignInButton mode="modal">
                        <Button variant="ghost" className="flex-1 rounded-xl">
                          Sign In
                        </Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button variant="default" className="flex-1 rounded-xl">
                          Get Started
                        </Button>
                      </SignUpButton>
                    </div>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
