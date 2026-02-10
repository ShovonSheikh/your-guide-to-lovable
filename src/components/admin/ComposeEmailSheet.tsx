import { useState } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { Send, X, PenSquare } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Mailbox {
  id: string;
  email_address: string;
  display_name: string;
}

interface ComposeEmailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailboxes: Mailbox[];
  defaultMailboxId?: string;
  draftId?: string | null;
  initialData?: { to?: string; subject?: string; body?: string } | null;
  onDraftSaved?: () => void;
}

export function ComposeEmailSheet({
  open,
  onOpenChange,
  mailboxes,
  defaultMailboxId,
  draftId,
  initialData,
  onDraftSaved,
}: ComposeEmailSheetProps) {
  const supabase = useSupabaseWithAuth();
  const isMobile = useIsMobile();
  
  const [selectedMailboxId, setSelectedMailboxId] = useState(defaultMailboxId || mailboxes[0]?.id || "");
  const [toAddress, setToAddress] = useState(initialData?.to || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [body, setBody] = useState(initialData?.body || "");
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const selectedMailbox = mailboxes.find(m => m.id === selectedMailboxId);

  const resetForm = () => {
    setToAddress("");
    setSubject("");
    setBody("");
  };

  const handleSend = async () => {
    if (!toAddress.trim()) {
      toast.error("Please enter a recipient email address");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!selectedMailbox) {
      toast.error("Please select a mailbox to send from");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toAddress.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      // Sanitize the body content
      const sanitizedBody = DOMPurify.sanitize(body.replace(/\n/g, "<br>"));
      
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="white-space: pre-wrap;">${sanitizedBody}</div>
        </div>
      `;

      const response = await supabase.functions.invoke("send-email", {
        body: {
          from_address: selectedMailbox.email_address,
          to_address: toAddress.trim(),
          subject: subject.trim(),
          html_body: htmlBody,
          text_body: body,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send email");
      }

      toast.success("Email sent successfully!");
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={cn(
          isMobile ? "h-[90vh] rounded-t-xl" : "w-[450px] sm:w-[540px]"
        )}
      >
        <SheetHeader className="text-left pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <PenSquare className="h-5 w-5" />
            Compose Email
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4 flex-1 overflow-y-auto">
          {/* From Mailbox Selector */}
          <div className="space-y-2">
            <Label htmlFor="from-mailbox">From</Label>
            <Select value={selectedMailboxId} onValueChange={setSelectedMailboxId}>
              <SelectTrigger id="from-mailbox">
                <SelectValue placeholder="Select mailbox" />
              </SelectTrigger>
              <SelectContent>
                {mailboxes.map((mailbox) => (
                  <SelectItem key={mailbox.id} value={mailbox.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{mailbox.display_name}</span>
                      <span className="text-xs text-muted-foreground">{mailbox.email_address}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To Address */}
          <div className="space-y-2">
            <Label htmlFor="to-address">To</Label>
            <Input
              id="to-address"
              type="email"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="recipient@example.com"
              className="focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-2 flex-1">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={isMobile ? 8 : 12}
              className="resize-none focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={sending || savingDraft}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!selectedMailbox) return;
              setSavingDraft(true);
              try {
                const payload: any = {
                  mailbox_id: selectedMailboxId,
                  to_addresses: toAddress.trim(),
                  subject: subject.trim(),
                  text_body: body,
                  status: 'draft',
                };
                if (draftId) {
                  await supabase.from('outbound_emails').update(payload).eq('id', draftId);
                } else {
                  await supabase.from('outbound_emails').insert(payload);
                }
                toast.success("Draft saved");
                onDraftSaved?.();
                onOpenChange(false);
              } catch (err: any) {
                toast.error(err.message || "Failed to save draft");
              } finally {
                setSavingDraft(false);
              }
            }}
            disabled={sending || savingDraft}
          >
            {savingDraft ? (
              <><Spinner className="h-4 w-4 mr-2" />Saving...</>
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || savingDraft || !toAddress.trim() || !subject.trim() || !body.trim()}
          >
            {sending ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
