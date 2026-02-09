import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AlertTriangle, CreditCard, Lock, Mail, ShieldCheck } from "lucide-react";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

type Step = "idle" | "pin" | "otp_sending" | "otp" | "confirming";

interface DummyPaymentToggleProps {
  currentValue: boolean;
  onToggled: () => void;
}

export function DummyPaymentToggle({ currentValue, onToggled }: DummyPaymentToggleProps) {
  const { profile } = useProfile();
  const supabase = useSupabaseWithAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const targetValue = !currentValue;

  const resetDialog = () => {
    setStep("idle");
    setPin("");
    setOtp("");
    setError("");
    setRemainingAttempts(null);
  };

  const handleToggleClick = () => {
    if (!profile?.has_withdrawal_pin) {
      toast.error("You need to set a withdrawal PIN first (Settings → Finance)");
      return;
    }
    resetDialog();
    setStep("pin");
    setDialogOpen(true);
  };

  const handlePinComplete = async (value: string) => {
    setPin(value);
    setError("");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("withdrawal-security", {
        body: { action: "verify-pin", pin: value },
      });

      if (invokeError || !data?.success) {
        const remaining = data?.remaining_attempts;
        setRemainingAttempts(remaining ?? null);
        setError(data?.error || "Invalid PIN");
        setPin("");
        if (data?.locked) {
          setError("Too many failed attempts. Try again in 1 hour.");
        }
        return;
      }

      // PIN verified — send OTP
      setStep("otp_sending");
      const { data: otpData, error: otpError } = await supabase.functions.invoke("withdrawal-security", {
        body: { action: "send-otp" },
      });

      if (otpError || !otpData?.success) {
        setError(otpData?.error || "Failed to send verification code");
        setStep("pin");
        return;
      }

      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
      setPin("");
    }
  };

  const handleOtpComplete = async (value: string) => {
    setOtp(value);
    setError("");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("withdrawal-security", {
        body: { action: "verify-otp", otp: value },
      });

      if (invokeError || !data?.success) {
        setError(data?.error || "Invalid verification code");
        setOtp("");
        if (data?.remaining_attempts !== undefined) {
          setRemainingAttempts(data.remaining_attempts);
        }
        return;
      }

      // OTP verified — apply the toggle
      setStep("confirming");
      const { error: updateError } = await supabase
        .from("platform_config")
        .upsert(
          { key: "dummy_payments", value: { enabled: targetValue } as any, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (updateError) {
        setError("Failed to update setting");
        setStep("otp");
        return;
      }

      toast.success(`Dummy payments ${targetValue ? "enabled" : "disabled"}`);
      setDialogOpen(false);
      onToggled();
    } catch {
      setError("Something went wrong. Please try again.");
      setOtp("");
    }
  };

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Mode
            {currentValue ? (
              <Badge variant="destructive" className="ml-auto">DUMMY</Badge>
            ) : (
              <Badge variant="default" className="ml-auto bg-success text-success-foreground">LIVE</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Toggle between live (RupantorPay) and dummy payment processing. Requires PIN + email verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentValue && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">
                Dummy payments are active. All payments will be simulated — no real money is processed.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dummy Payments</Label>
              <p className="text-xs text-muted-foreground">
                {currentValue ? "Payments are simulated" : "Live payments via RupantorPay"}
              </p>
            </div>
            <Switch
              checked={currentValue}
              onCheckedChange={handleToggleClick}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetDialog(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Security Verification
            </DialogTitle>
            <DialogDescription>
              {targetValue
                ? "You're about to enable dummy payments. This will bypass real payment processing."
                : "You're about to switch to live payments. Real money will be processed."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Step 1: PIN */}
            {step === "pin" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  Enter your 6-digit PIN
                </div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={pin} onChange={setPin} onComplete={handlePinComplete}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <span className="block text-xs mt-1">
                        {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Sending OTP */}
            {step === "otp_sending" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Spinner className="h-6 w-6" />
                <p className="text-sm text-muted-foreground">Sending verification code to your email...</p>
              </div>
            )}

            {/* Step 3: OTP */}
            {step === "otp" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  Enter the 6-digit code sent to your email
                </div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} onComplete={handleOtpComplete}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>
            )}

            {/* Step 4: Confirming */}
            {step === "confirming" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Spinner className="h-6 w-6" />
                <p className="text-sm text-muted-foreground">Applying changes...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
