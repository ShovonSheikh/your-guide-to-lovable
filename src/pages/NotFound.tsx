import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { HeartIcon } from "@/components/icons/PaymentIcons";
import { Home, Search, HelpCircle, ArrowLeft } from "lucide-react";

const NotFound = () => {
  usePageTitle("Page Not Found");
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <div className="h-24" />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md animate-fade-in">
          {/* Logo/Brand */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 animate-float">
            <HeartIcon className="w-10 h-10 text-primary" />
          </div>

          {/* 404 Message */}
          <h1 className="text-6xl md:text-7xl font-display font-bold text-primary mb-4">
            404
          </h1>
          <h2 className="text-2xl font-display font-semibold mb-3">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link to="/">
              <Button variant="accent" size="lg" className="gap-2 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4" />
                Explore Creators
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Or try these helpful links:</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link 
                to="/support" 
                className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Get Support
              </Link>
              <button 
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
};

export default NotFound;
