import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Users, UserCheck, Heart, AlertTriangle } from 'lucide-react';

interface MassEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Audience = 'all' | 'creators' | 'supporters';

export function MassEmailDialog({ open, onOpenChange }: MassEmailDialogProps) {
  const { user } = useUser();
  const [audience, setAudience] = useState<Audience>('all');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [missingEmailCount, setMissingEmailCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    skipped: number;
    total: number;
  } | null>(null);

  // Fetch recipient count when audience changes
  useEffect(() => {
    if (!open) return;
    
    const fetchCount = async () => {
      setIsLoadingCount(true);
      try {
        let totalQuery = supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        let deliverableQuery = supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .not('email', 'is', null);

        if (audience === 'creators') {
          totalQuery = totalQuery.eq('account_type', 'creator').eq('onboarding_status', 'completed');
          deliverableQuery = deliverableQuery.eq('account_type', 'creator').eq('onboarding_status', 'completed');
        } else if (audience === 'supporters') {
          totalQuery = totalQuery.eq('account_type', 'supporter');
          deliverableQuery = deliverableQuery.eq('account_type', 'supporter');
        }

        const [{ count: total }, { count: deliverable }] = await Promise.all([totalQuery, deliverableQuery]);

        const safeTotal = total ?? 0;
        const safeDeliverable = deliverable ?? 0;
        const safeMissing = Math.max(0, safeTotal - safeDeliverable);

        setSelectedCount(safeTotal);
        setRecipientCount(safeDeliverable);
        setMissingEmailCount(safeMissing);
      } catch (error) {
        console.error('Failed to fetch recipient count:', error);
        setSelectedCount(null);
        setRecipientCount(null);
        setMissingEmailCount(null);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchCount();
  }, [audience, open]);

  const handleSend = async () => {
    if (!subject.trim() || !htmlBody.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please provide both subject and email body.',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setIsSending(true);
    setSendResult(null);

    try {
      const response = await supabase.functions.invoke('send-mass-email', {
        body: { audience, subject, htmlBody },
        headers: {
          'x-clerk-user-id': user?.id || '',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send emails');
      }

      const result = response.data;
      setSendResult(result.summary);

      toast({
        title: 'Mass email sent',
        description: result.message,
      });

    } catch (error: any) {
      console.error('Mass email error:', error);
      toast({
        title: 'Failed to send emails',
        description: error.message || 'An error occurred while sending emails.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setHtmlBody('');
    setAudience('all');
    setSendResult(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const getAudienceIcon = (type: Audience) => {
    switch (type) {
      case 'all': return <Users className="w-4 h-4" />;
      case 'creators': return <UserCheck className="w-4 h-4" />;
      case 'supporters': return <Heart className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Mass Email
            </DialogTitle>
            <DialogDescription>
              Send an email to all users, only creators, or only supporters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Audience Selection */}
            <div className="space-y-3">
              <Label>Select Audience</Label>
              <RadioGroup
                value={audience}
                onValueChange={(val) => setAudience(val as Audience)}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: 'all', label: 'All Users', desc: 'Creators + Supporters' },
                  { value: 'creators', label: 'Creators Only', desc: 'Verified creators' },
                  { value: 'supporters', label: 'Supporters Only', desc: 'Tip senders' },
                ].map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      audience === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    {getAudienceIcon(option.value as Audience)}
                    <span className="font-medium mt-2">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.desc}</span>
                  </Label>
                ))}
              </RadioGroup>

              <div className="flex items-center justify-center p-2 bg-muted/50 rounded-lg">
                {isLoadingCount ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    <strong>{selectedCount?.toLocaleString() ?? '...'}</strong> selected •{' '}
                    <strong>{recipientCount?.toLocaleString() ?? '...'}</strong> will receive
                    {missingEmailCount ? ` • ${missingEmailCount.toLocaleString()} missing email` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., 📢 Important Update from TipKoro"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">{'{{first_name}}'}</code> to personalize
              </p>
            </div>

            {/* HTML Body */}
            <div className="space-y-2">
              <Label htmlFor="htmlBody">Email Body (HTML)</Label>
              <Textarea
                id="htmlBody"
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                placeholder="<div>Hello {{first_name}},...</div>"
                className="min-h-[200px] font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">{'{{first_name}}'}</code> for personalization
              </p>
            </div>

            {/* Result Summary */}
            {sendResult && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h4 className="font-medium">Send Results</h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-bold text-green-600">{sendResult.sent}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-bold text-red-600">{sendResult.failed}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-bold text-yellow-600">{sendResult.skipped}</div>
                    <div className="text-xs text-muted-foreground">Skipped</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-bold">{sendResult.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending || !subject.trim() || !htmlBody.trim()}>
              {isSending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Mass Email
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send an email to <strong>{recipientCount?.toLocaleString()}</strong> recipients.
              This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSend}>
              Yes, Send Emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
