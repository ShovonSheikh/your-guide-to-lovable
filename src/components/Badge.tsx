import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-accent/20 text-accent-foreground",
  neutral: "bg-muted text-muted-foreground",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
        variantClasses[variant],
        className
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </div>
  );
};
