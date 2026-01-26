import { useState } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { Send, X, Reply } from "lucide-react";
import { toast } from "sonner";

interface EmailAddress {
  address: string;
  name: string | null;
}

interface Email {
  id: string;
  mailbox_id: string;
  message_id: string;
  from_address: string;
  from_name: string | null;
  to_addresses: EmailAddress[];
  subject: string | null;
  html_body: string | null;
  text_body: string | null;
  received_at: string;
}

interface ReplyComposerProps {
  email: Email;
  mailboxAddress: string;
  onClose: () => void;
  onSent: () => void;
}

export function ReplyComposer({ email, mailboxAddress, onClose, onSent }: ReplyComposerProps) {
  const supabase = useSupabaseWithAuth();
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState(
    email.subject?.startsWith("Re:") ? email.subject : `Re: ${email.subject || "(No Subject)"}`
  );
  const [body, setBody] = useState("");

  const handleSend = async () => {
    if (!body.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      // Sanitize the reply body to prevent XSS
      const sanitizedBody = DOMPurify.sanitize(body.replace(/\n/g, "<br>"));
      
      // Sanitize the original email content before quoting
      const sanitizedOriginalContent = DOMPurify.sanitize(
        email.html_body || email.text_body?.replace(/\n/g, "<br>") || ""
      );
      
      const sanitizedFromName = DOMPurify.sanitize(email.from_name || email.from_address);
      
      // Build HTML body with reply formatting using sanitized content
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="white-space: pre-wrap;">${sanitizedBody}</div>
          <br><br>
          <div style="border-left: 2px solid #ccc; padding-left: 12px; margin-top: 20px; color: #666;">
            <p style="margin: 0 0 8px 0; font-size: 12px;">
              On ${new Date(email.received_at || Date.now()).toLocaleString()}, ${sanitizedFromName} wrote:
            </p>
            <div style="font-size: 13px;">
              ${sanitizedOriginalContent}
            </div>
          </div>
        </div>
      `;

      const response = await supabase.functions.invoke("send-reply-email", {
        body: {
          from_address: mailboxAddress,
          to_address: email.from_address,
          subject: subject,
          html_body: htmlBody,
          text_body: `${body}\n\n---\nOn ${new Date(email.received_at || Date.now()).toLocaleString()}, ${email.from_name || email.from_address} wrote:\n\n${email.text_body || ""}`,
          in_reply_to: email.message_id,
          original_email_id: email.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send reply");
      }

      toast.success("Reply sent successfully!");
      onSent();
      onClose();
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error(error.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-t-0 rounded-t-none">
      <CardHeader className="py-3 px-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Reply className="h-4 w-4" />
            Reply to {email.from_name || email.from_address}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground text-xs">From</Label>
            <p className="font-medium truncate">{mailboxAddress}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">To</Label>
            <p className="font-medium truncate">{email.from_address}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-xs text-muted-foreground">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="body" className="text-xs text-muted-foreground">Message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your reply..."
            rows={6}
            className="resize-none"
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
