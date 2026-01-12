import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useProfile } from "@/hooks/useProfile";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Receipt, 
  BadgeCheck,
  Settings,
  ChevronLeft,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { id: "users", label: "Users", icon: Users, path: "/admin/users" },
  { id: "creators", label: "Creators", icon: BadgeCheck, path: "/admin/creators" },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet, path: "/admin/withdrawals" },
  { id: "tips", label: "Tips", icon: Receipt, path: "/admin/tips" },
  { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/");
      return;
    }

    if (!profileLoading && profile && !profile.is_admin) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, profile, profileLoading, navigate]);

  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <span className="font-bold text-lg text-primary">Admin Panel</span>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="h-4 w-4" />
            {sidebarOpen && <span>Back to App</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-4 flex items-center justify-between">
        <span className="font-bold text-lg text-primary">Admin Panel</span>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 mt-4"
              onClick={() => navigate("/dashboard")}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to App</span>
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
