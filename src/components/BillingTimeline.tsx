import React from "react";
import { CheckCircleIcon } from "./icons/PaymentIcons";

interface TimelineItem {
  month: string;
  status: "paid" | "free" | "recurring";
  label: string;
}

const timelineData: TimelineItem[] = [
  { month: "Month 1", status: "paid", label: "Paid (Activated)" },
  { month: "Month 2", status: "free", label: "Free" },
  { month: "Month 3", status: "free", label: "Free" },
  { month: "Month 4", status: "recurring", label: "Paid (Recurring)" },
];

export const BillingTimeline: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {timelineData.map((item, index) => (
            <div key={item.month} className="relative flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              {/* Node */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  item.status === "paid"
                    ? "bg-accent text-accent-foreground shadow-md"
                    : item.status === "free"
                    ? "bg-success/20 text-success border-2 border-success/40"
                    : "bg-muted text-muted-foreground border-2 border-border"
                }`}
              >
                {item.status === "paid" || item.status === "free" ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <span className="text-xs">$</span>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 tipkoro-card py-3 px-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{item.month}</span>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      item.status === "paid"
                        ? "bg-accent/20 text-accent-foreground"
                        : item.status === "free"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
