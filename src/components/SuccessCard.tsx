import React from "react";
import { Button } from "./ui/button";
import { CheckCircleIcon, SparkleIcon } from "./icons/PaymentIcons";

interface SuccessCardProps {
  username?: string;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({ username = "creator" }) => {
  return (
    <div className="tipkoro-card text-center max-w-md mx-auto animate-scale-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
        <CheckCircleIcon className="w-10 h-10 text-success" />
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <SparkleIcon className="w-5 h-5 text-accent" />
        <h2 className="text-2xl font-display font-bold">Account Ready!</h2>
        <SparkleIcon className="w-5 h-5 text-accent" />
      </div>

      <p className="text-muted-foreground mb-6">
        Months 2 & 3 are on us. You&apos;re on the TipKoro creators list!
      </p>

      <div className="bg-secondary/50 rounded-xl p-4 mb-6">
        <p className="text-sm text-muted-foreground mb-1">Your creator page</p>
        <p className="font-semibold text-lg">tipkoro.com/{username}</p>
      </div>

      <div className="space-y-3">
        <Button variant="hero-accent" className="w-full">
          Download Receipt (PDF)
        </Button>
        <Button variant="outline" className="w-full">
          Manage My Profile
        </Button>
      </div>

      <div className="mt-6 p-4 bg-accent/10 rounded-xl">
        <p className="text-sm text-foreground">
          <span className="font-semibold">Receipt note:</span> Month 1 paid (৳10); 
          months 2–3 complimentary as part of Early Creator Offer.
        </p>
      </div>
    </div>
  );
};
