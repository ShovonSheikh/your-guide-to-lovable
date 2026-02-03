import React from "react";
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface RateLimitBannerProps {
  remaining?: number;
  total?: number;
  action: string;
  isLocked?: boolean;
  lockoutMinutes?: number;
  className?: string;
}

export function RateLimitBanner({
  remaining,
  total,
  action,
  isLocked = false,
  lockoutMinutes,
  className,
}: RateLimitBannerProps) {
  if (isLocked) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive",
          className
        )}
      >
        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Rate limit exceeded</p>
          <p className="text-xs opacity-80">
            Too many {action} attempts. Please try again
            {lockoutMinutes ? ` in ${lockoutMinutes} minutes` : " later"}.
          </p>
        </div>
      </div>
    );
  }

  if (remaining !== undefined && total !== undefined && remaining <= Math.ceil(total * 0.3)) {
    const isLow = remaining <= Math.ceil(total * 0.15);
    
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          isLow 
            ? "bg-destructive/10 border-destructive/30 text-destructive" 
            : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
          className
        )}
      >
        {isLow ? (
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <Clock className="w-5 h-5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {remaining} {action} attempt{remaining !== 1 ? "s" : ""} remaining
          </p>
          <p className="text-xs opacity-80">
            {isLow
              ? "You will be temporarily locked out after exceeding the limit."
              : "This limit resets periodically for security."}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
