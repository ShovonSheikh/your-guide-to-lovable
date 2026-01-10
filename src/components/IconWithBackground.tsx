import React from "react";
import { cn } from "@/lib/utils";

interface IconWithBackgroundProps {
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "neutral";
  size?: "medium" | "large" | "x-large";
  className?: string;
}

const variantClasses = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-accent/20 text-accent-foreground",
  neutral: "bg-muted text-muted-foreground",
};

const sizeClasses = {
  medium: "w-12 h-12 [&>*]:w-5 [&>*]:h-5",
  large: "w-16 h-16 [&>*]:w-7 [&>*]:h-7",
  "x-large": "w-20 h-20 [&>*]:w-9 [&>*]:h-9",
};

export const IconWithBackground: React.FC<IconWithBackgroundProps> = ({
  icon,
  variant = "default",
  size = "large",
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {icon}
    </div>
  );
};
