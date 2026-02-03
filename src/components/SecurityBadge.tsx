import React from "react";
import { Lock, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SecurityBadgeProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export function SecurityBadge({ variant = "default", className }: SecurityBadgeProps) {
  const content = (
    <div className="space-y-2 max-w-xs">
      <div className="flex items-center gap-2 font-medium">
        <ShieldCheck className="w-4 h-4 text-success" />
        <span>Secured Connection</span>
      </div>
      <ul className="text-xs space-y-1 text-muted-foreground">
        <li>• 256-bit SSL encryption</li>
        <li>• Secure payment processing</li>
        <li>• Data stored in encrypted database</li>
        <li>• Two-factor withdrawal verification</li>
      </ul>
    </div>
  );

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 text-success text-xs font-medium cursor-help",
                className
              )}
            >
              <Lock className="w-3 h-3" />
              Secured
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-3">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "inline") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-success text-xs cursor-help",
                className
              )}
            >
              <Lock className="w-3 h-3" />
              <span>Secure</span>
              <Info className="w-3 h-3 opacity-60" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-3">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 cursor-help",
              className
            )}
          >
            <Lock className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">
              Secured with encryption
            </span>
            <Info className="w-3.5 h-3.5 text-success/60" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
