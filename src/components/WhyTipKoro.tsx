import React from "react";
import { HeartIcon, ShieldIcon, ZapIcon } from "./icons/PaymentIcons";

const features = [
  {
    icon: ZapIcon,
    title: "Instant Payouts",
    description: "Get paid directly to bKash, Nagad, or your bank. No waiting weeks for your earnings.",
  },
  {
    icon: HeartIcon,
    title: "Made for Bangladesh",
    description: "Built specifically for Bangladeshi creators with local payment methods and BDT pricing.",
  },
  {
    icon: ShieldIcon,
    title: "Zero Hidden Fees",
    description: "Transparent pricing. What you see is what you get. No surprises on payout day.",
  },
];

export const WhyTipKoro: React.FC = () => {
  return (
    <section className="py-16 px-4">
      <div className="container max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
          Why Creators Love TipKoro
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          The only platform designed from the ground up for Bangladeshi creators
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="tipkoro-card text-center hover:-translate-y-1 transition-transform duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
