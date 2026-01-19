import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AlertTriangle, Home, Mail, RefreshCw } from "lucide-react";

const SUPPORT_EMAIL = "support@tipkoro.com";
const PLATFORM_FEE = 150;

const CreatorPaymentFailed: React.FC = () => {
  usePageTitle("Payment Failed");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="tipkoro-card text-center py-12 max-w-lg w-full">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold font-display mb-2">
            Creator Account Payment Failed
          </h1>
          <p className="text-muted-foreground mb-4">
            Your payment of ৳{PLATFORM_FEE} could not be completed.
          </p>

          {reason && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-destructive mb-1">Reason</h3>
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          )}

          {/* Important notice about deducted amount */}
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-8 text-left">
            <h3 className="font-semibold text-warning-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Important Notice
            </h3>
            <p className="text-sm text-muted-foreground">
              If the amount was deducted from your payment method but the transaction 
              didn't complete on our platform, please contact us immediately with your 
              transaction details.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Creator Payment Issue - Amount Deducted&body=Hi TipKoro Team,%0D%0A%0D%0AMy creator account payment of ৳${PLATFORM_FEE} was deducted but the transaction didn't complete.%0D%0A%0D%0ATransaction details:%0D%0A- Date/Time: ${new Date().toLocaleString()}%0D%0A- Payment Method: %0D%0A%0D%0APlease help resolve this issue.%0D%0A%0D%0AThank you.`}
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/dashboard")}
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

export default CreatorPaymentFailed;
