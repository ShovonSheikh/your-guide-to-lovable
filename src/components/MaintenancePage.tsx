import { Construction } from "lucide-react";

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  const displayMessage = message || "We are currently performing scheduled maintenance. Please check back soon!";
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Construction className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Under Maintenance
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          {displayMessage}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>We'll be back shortly</span>
        </div>
      </div>
    </div>
  );
}
