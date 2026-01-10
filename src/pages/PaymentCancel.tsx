import React from "react";
import { useNavigate } from "react-router-dom";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, Mail, RefreshCw } from "lucide-react";

const SUPPORT_EMAIL = "support@tipkoro.com";

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="tipkoro-card text-center py-12 max-w-lg w-full">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold font-display mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground mb-6">
            Your payment was cancelled or could not be completed.
          </p>

          {/* Important notice about deducted amount */}
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-8 text-left">
            <h3 className="font-semibold text-warning-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Important Notice
            </h3>
            <p className="text-sm text-muted-foreground">
              If the amount was deducted from your payment method but the transaction didn't complete on our platform, please contact us immediately with your transaction details.
            </p>
            <a 
              href={`mailto:${SUPPORT_EMAIL}?subject=Payment Issue - Amount Deducted&body=Hi TipKoro Team,%0D%0A%0D%0AMy payment amount was deducted but the transaction didn't complete.%0D%0A%0D%0ATransaction details:%0D%0A- Date/Time: ${new Date().toLocaleString()}%0D%0A- Payment Method: %0D%0A- Amount: %0D%0A%0D%0APlease help resolve this issue.%0D%0A%0D%0AThank you.`}
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate(-1)}
              className="w-full bg-accent text-accent-foreground hover:bg-tipkoro-gold-hover"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              <Home className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Need help? Contact us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </main>
      <MainFooter />
    </div>
  );
};

export default PaymentCancel;
