import { Link } from "react-router-dom";
import { Check, Circle, ShieldCheck, UserCheck, Link as LinkIcon, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupChecklistProps {
  hasWithdrawalPin: boolean;
  isVerified: boolean;
  hasSocialLinks: boolean;
  hasAvatar: boolean;
}

export function SetupChecklist({ hasWithdrawalPin, isVerified, hasSocialLinks, hasAvatar }: SetupChecklistProps) {
  const items = [
    {
      label: "Set withdrawal PIN",
      completed: hasWithdrawalPin,
      link: "/settings?tab=security",
      icon: ShieldCheck,
    },
    {
      label: "Complete verification",
      completed: isVerified,
      link: "/settings?tab=verification",
      icon: UserCheck,
    },
    {
      label: "Add social links",
      completed: hasSocialLinks,
      link: "/settings?tab=links",
      icon: LinkIcon,
    },
    {
      label: "Upload profile photo",
      completed: hasAvatar,
      link: "/settings?tab=profile",
      icon: ImageIcon,
    },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const allComplete = completedCount === items.length;

  if (allComplete) return null;

  return (
    <div className="tipkoro-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Complete Your Profile</h3>
        <span className="text-xs font-medium text-muted-foreground">
          {completedCount}/{items.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.link}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-colors",
              item.completed 
                ? "bg-success/10 text-success" 
                : "hover:bg-muted"
            )}
          >
            {item.completed ? (
              <Check className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground" />
            )}
            <item.icon className={cn(
              "w-4 h-4",
              item.completed ? "text-success" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm",
              item.completed && "line-through opacity-70"
            )}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}