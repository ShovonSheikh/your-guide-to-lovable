import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  children?: React.ReactNode;
  image?: string;
  size?: "small" | "medium" | "large" | "x-large";
  className?: string;
}

const sizeClasses = {
  small: "w-8 h-8 text-sm",
  medium: "w-12 h-12 text-base",
  large: "w-16 h-16 text-lg",
  "x-large": "w-24 h-24 text-2xl",
};

export const Avatar: React.FC<AvatarProps> = ({
  children,
  image,
  size = "medium",
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-full bg-muted flex items-center justify-center font-semibold text-foreground overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {image ? (
        <img src={image} alt="" className="w-full h-full object-cover" />
      ) : (
        children
      )}
    </div>
  );
};
