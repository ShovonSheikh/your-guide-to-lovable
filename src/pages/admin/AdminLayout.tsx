import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useProfile } from "@/hooks/useProfile";
import { useAdminPermissions, permissionMap } from "@/hooks/useAdminPermissions";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  BadgeCheck,
  Settings,
  ChevronLeft,
  Mail,
  ShieldCheck,
  Menu,
  LogOut,
  Crown,
  ImageIcon,
  Bell,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const allNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { id: "users", label: "Users", icon: Users, path: "/admin/users" },
  { id: "creators", label: "Creators", icon: BadgeCheck, path: "/admin/creators" },
  { id: "verifications", label: "Verifications", icon: ShieldCheck, path: "/admin/verifications" },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet, path: "/admin/withdrawals" },
  { id: "tips", label: "Tips", icon: Receipt, path: "/admin/tips" },
  { id: "mailbox", label: "Mailbox", icon: Mail, path: "/admin/mailbox" },
  { id: "share-image", label: "Share Image", icon: ImageIcon, path: "/admin/share-image" },
  { id: "email-templates", label: "Email Templates", icon: Mail, path: "/admin/email-templates" },
  { id: "notices", label: "Notices", icon: Bell, path: "/admin/notices" },
  { id: "pages", label: "Pages", icon: FileText, path: "/admin/pages" },
  { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
  { id: "admins", label: "Admins", icon: Crown, path: "/admin/admins" },
];

export default function AdminLayout() {
  usePageTitle("Admin");
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { permissions, loading: permissionsLoading } = useAdminPermissions();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [unreadEmails, setUnreadEmails] = useState(0);
  const isMobile = useIsMobile();

  // Filter nav items based on permissions
  const navItems = allNavItems.filter(item => {
    const permKey = permissionMap[item.id];
    if (!permKey) return true;
    return permissions[permKey];
  });

  // Fetch counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      const { count: verifyCount } = await supabase
        .from('verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingVerifications(verifyCount || 0);

      const { count: emailCount } = await supabase
        .from('inbound_emails')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('is_deleted', false);
      setUnreadEmails(emailCount || 0);
    };

    if (profile?.is_admin) {
      fetchCounts();
    }
  }, [profile?.is_admin]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/");
      return;
    }

    if (!profileLoading && profile && !profile.is_admin) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, profile, profileLoading, navigate]);

  if (!isLoaded || profileLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return null;
  }

  const getCurrentPageTitle = () => {
    const item = navItems.find(item =>
      location.pathname === item.path ||
      (item.path !== "/admin" && location.pathname.startsWith(item.path))
    );
    return item?.label || "Admin";
  };

  const NavItem = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const isActive = location.pathname === item.path ||
      (item.path !== "/admin" && location.pathname.startsWith(item.path));

    const badgeCount = item.id === 'verifications' ? pendingVerifications :
      item.id === 'mailbox' ? unreadEmails : 0;

    return (
      <button
        onClick={() => {
          navigate(item.path);
          onClick?.();
        }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {badgeCount > 0 && (
          <Badge
            variant={isActive ? "secondary" : "default"}
            className="ml-auto"
          >
            {badgeCount}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 sticky top-0 h-screen",
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

            const badgeCount = item.id === 'verifications' ? pendingVerifications :
              item.id === 'mailbox' ? unreadEmails : 0;

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
                {sidebarOpen && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {sidebarOpen && badgeCount > 0 && (
                  <Badge
                    variant={isActive ? "secondary" : "default"}
                    className="ml-auto"
                  >
                    {badgeCount}
                  </Badge>
                )}
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <span className="font-semibold text-primary text-sm">Admin</span>
              <span className="text-muted-foreground text-sm ml-1">/ {getCurrentPageTitle()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left text-primary">Admin Panel</SheetTitle>
          </SheetHeader>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                navigate("/dashboard");
                setMobileMenuOpen(false);
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Exit Admin</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 md:p-6 p-4 pt-16 md:pt-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}