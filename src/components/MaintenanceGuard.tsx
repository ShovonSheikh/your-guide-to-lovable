import { ReactNode } from "react";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import MaintenancePage from "@/components/MaintenancePage";
import { Loader2 } from "lucide-react";

interface MaintenanceGuardProps {
  children: ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { isMaintenanceMode, canBypass, message, loading } = useMaintenanceMode();

  // Show loading state while checking maintenance mode
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If maintenance mode is enabled and user cannot bypass, show maintenance page
  if (isMaintenanceMode && !canBypass) {
    return <MaintenancePage message={message} />;
  }

  // Otherwise, render children normally
  return <>{children}</>;
}

