import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { toast } from "@/hooks/use-toast";
import { Lock, ArrowRight, Loader2, Check } from "lucide-react";

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'current' | 'new' | 'confirm';

export function ChangePinDialog({ open, onOpenChange }: ChangePinDialogProps) {
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseWithAuth();

  const resetState = () => {
    setStep('current');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const handleChangePIN = async () => {
    if (newPin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "The new PINs you entered don't match",
        variant: "destructive",
      });
      setConfirmPin('');
      setStep('confirm');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('withdrawal-security', {
        body: { 
          action: 'change-pin', 
          pin: currentPin,
          new_pin: newPin 
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to change PIN');
      }

      toast({
        title: "PIN Changed!",
        description: "Your withdrawal PIN has been updated successfully",
      });

      handleClose(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to change PIN',
        variant: "destructive",
      });
      // If current PIN is wrong, go back to first step
      if (err.message?.includes('incorrect')) {
        setCurrentPin('');
        setStep('current');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Withdrawal PIN
          </DialogTitle>
          <DialogDescription>
            {step === 'current' && "Enter your current 6-digit PIN"}
            {step === 'new' && "Enter your new 6-digit PIN"}
            {step === 'confirm' && "Confirm your new 6-digit PIN"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${step === 'current' ? 'bg-accent' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'new' ? 'bg-accent' : 'bg-muted'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 'confirm' ? 'bg-accent' : 'bg-muted'}`} />
          </div>

          {step === 'current' && (
            <>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={currentPin} onChange={setCurrentPin}>
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
              <Button 
                className="w-full gap-2" 
                onClick={() => setStep('new')}
                disabled={currentPin.length !== 6}
              >
                <ArrowRight className="w-4 h-4" />
                Continue
              </Button>
            </>
          )}

          {step === 'new' && (
            <>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={newPin} onChange={setNewPin}>
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setStep('current')}
                >
                  Back
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => setStep('confirm')}
                  disabled={newPin.length !== 6}
                >
                  <ArrowRight className="w-4 h-4" />
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={confirmPin} onChange={setConfirmPin}>
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setStep('new')}
                >
                  Back
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={handleChangePIN}
                  disabled={confirmPin.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Change PIN
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
