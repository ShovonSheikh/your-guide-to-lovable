import { useEffect, useState, useCallback } from "react";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Mail, 
  Inbox, 
  MailOpen, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  Paperclip,
  Eye,
  EyeOff,
  Reply,
  Send,
  X
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Mailbox {
  id: string;
  email_address: string;
  display_name: string;
  unread_count: number;
}

interface EmailAddress {
  address: string;
  name: string | null;
}

interface EmailAttachment {
  filename: string;
  content_type: string;
  size: number;
}

interface Email {
  id: string;
  mailbox_id: string;
  message_id: string;
  from_address: string;
  from_name: string | null;
  to_addresses: EmailAddress[];
  cc_addresses: EmailAddress[] | null;
  subject: string | null;
  html_body: string | null;
  text_body: string | null;
  attachments: EmailAttachment[] | null;
  received_at: string;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
}

type MobileView = 'list' | 'email';

export default function AdminMailbox() {
  usePageTitle("Admin - Mailbox");
  const supabase = useSupabaseWithAuth();
  const isMobile = useIsMobile();
  
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<Mailbox | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [showHtml, setShowHtml] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  
  // Reply composer state
  const [showReplySheet, setShowReplySheet] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMailboxes = useCallback(async () => {
    try {
      const { data: mailboxData, error: mailboxError } = await supabase
        .from('mailboxes')
        .select('*')
        .order('display_name');

      if (mailboxError) throw mailboxError;

      const mailboxesWithCounts: Mailbox[] = await Promise.all(
        (mailboxData || []).map(async (mb) => {
          const { count } = await supabase
            .from('inbound_emails')
            .select('*', { count: 'exact', head: true })
            .eq('mailbox_id', mb.id)
            .eq('is_read', false)
            .eq('is_deleted', false);

          return {
            ...mb,
            unread_count: count || 0
          };
        })
      );

      setMailboxes(mailboxesWithCounts);
      
      if (!selectedMailbox && mailboxesWithCounts.length > 0) {
        setSelectedMailbox(mailboxesWithCounts[0]);
      }
    } catch (error) {
      console.error('Error fetching mailboxes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMailbox, supabase]);

  const fetchEmails = useCallback(async (mailboxId: string) => {
    setEmailsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inbound_emails')
        .select('*')
        .eq('mailbox_id', mailboxId)
        .eq('is_deleted', false)
        .order('received_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const typedEmails: Email[] = (data || []).map(email => ({
        ...email,
        to_addresses: (email.to_addresses as unknown as EmailAddress[]) || [],
        cc_addresses: email.cc_addresses ? (email.cc_addresses as unknown as EmailAddress[]) : null,
        attachments: email.attachments ? (email.attachments as unknown as EmailAttachment[]) : null
      }));
      
      setEmails(typedEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setEmailsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMailboxes();
  }, [fetchMailboxes]);

  useEffect(() => {
    if (selectedMailbox) {
      fetchEmails(selectedMailbox.id);
      setSelectedEmail(null);
    }
  }, [selectedMailbox, fetchEmails]);

  useEffect(() => {
    const channel = supabase
      .channel('inbound_emails_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inbound_emails' },
        () => {
          if (selectedMailbox) {
            fetchEmails(selectedMailbox.id);
          }
          fetchMailboxes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMailbox, fetchEmails, fetchMailboxes, supabase]);

  const markAsRead = async (email: Email) => {
    if (email.is_read) return;

    await supabase
      .from('inbound_emails')
      .update({ is_read: true })
      .eq('id', email.id);

    setEmails(prev => 
      prev.map(e => e.id === email.id ? { ...e, is_read: true } : e)
    );
    
    setMailboxes(prev =>
      prev.map(mb => 
        mb.id === email.mailbox_id 
          ? { ...mb, unread_count: Math.max(0, mb.unread_count - 1) }
          : mb
      )
    );
  };

  const toggleRead = async (email: Email) => {
    const newReadState = !email.is_read;
    
    await supabase
      .from('inbound_emails')
      .update({ is_read: newReadState })
      .eq('id', email.id);

    setEmails(prev => 
      prev.map(e => e.id === email.id ? { ...e, is_read: newReadState } : e)
    );
    
    if (selectedEmail?.id === email.id) {
      setSelectedEmail({ ...email, is_read: newReadState });
    }

    setMailboxes(prev =>
      prev.map(mb => 
        mb.id === email.mailbox_id 
          ? { ...mb, unread_count: newReadState ? mb.unread_count - 1 : mb.unread_count + 1 }
          : mb
      )
    );
  };

  const deleteEmail = async (email: Email) => {
    await supabase
      .from('inbound_emails')
      .update({ is_deleted: true })
      .eq('id', email.id);

    setEmails(prev => prev.filter(e => e.id !== email.id));
    
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null);
      if (isMobile) {
        setMobileView('list');
      }
    }

    if (!email.is_read) {
      setMailboxes(prev =>
        prev.map(mb => 
          mb.id === email.mailbox_id 
            ? { ...mb, unread_count: Math.max(0, mb.unread_count - 1) }
            : mb
        )
      );
    }
  };

  const handleMailboxChange = (mailboxId: string) => {
    const mailbox = mailboxes.find(m => m.id === mailboxId);
    if (mailbox) {
      setSelectedMailbox(mailbox);
    }
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    markAsRead(email);
    if (isMobile) {
      setMobileView('email');
    }
  };

  const handleMobileBack = () => {
    setMobileView('list');
    setSelectedEmail(null);
  };

  const openReplyComposer = () => {
    if (selectedEmail) {
      setReplySubject(
        selectedEmail.subject?.startsWith("Re:") 
          ? selectedEmail.subject 
          : `Re: ${selectedEmail.subject || "(No Subject)"}`
      );
      setReplyBody("");
      setShowReplySheet(true);
    }
  };

  const handleSendReply = async () => {
    if (!replyBody.trim() || !selectedEmail || !selectedMailbox) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="white-space: pre-wrap;">${replyBody.replace(/\n/g, "<br>")}</div>
          <br><br>
          <div style="border-left: 2px solid #ccc; padding-left: 12px; margin-top: 20px; color: #666;">
            <p style="margin: 0 0 8px 0; font-size: 12px;">
              On ${format(new Date(selectedEmail.received_at), 'PPpp')}, ${selectedEmail.from_name || selectedEmail.from_address} wrote:
            </p>
            <div style="font-size: 13px;">
              ${selectedEmail.html_body || selectedEmail.text_body?.replace(/\n/g, "<br>") || ""}
            </div>
          </div>
        </div>
      `;

      const response = await supabase.functions.invoke("send-reply-email", {
        body: {
          from_address: selectedMailbox.email_address,
          to_address: selectedEmail.from_address,
          subject: replySubject,
          html_body: htmlBody,
          text_body: `${replyBody}\n\n---\nOn ${format(new Date(selectedEmail.received_at), 'PPpp')}, ${selectedEmail.from_name || selectedEmail.from_address} wrote:\n\n${selectedEmail.text_body || ""}`,
          in_reply_to: selectedEmail.message_id,
          original_email_id: selectedEmail.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send reply");
      }

      toast.success("Reply sent successfully!");
      setShowReplySheet(false);
      setReplyBody("");
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error(error.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const totalUnread = mailboxes.reduce((sum, mb) => sum + mb.unread_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Email List Component
  const EmailList = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Mailbox Dropdown */}
          <Select
            value={selectedMailbox?.id || ""}
            onValueChange={handleMailboxChange}
          >
            <SelectTrigger className="w-full max-w-[200px]">
              <div className="flex items-center gap-2 truncate">
                <Inbox className="h-4 w-4 flex-shrink-0" />
                <SelectValue placeholder="Select mailbox" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {mailboxes.map((mailbox) => (
                <SelectItem key={mailbox.id} value={mailbox.id}>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="truncate">{mailbox.display_name}</span>
                    {mailbox.unread_count > 0 && (
                      <Badge variant="default" className="ml-2 text-xs">
                        {mailbox.unread_count}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="icon" onClick={() => fetchMailboxes()} className="flex-shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        {emailsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No emails in this mailbox</p>
          </div>
        ) : (
          <div className="divide-y">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                className={cn(
                  "w-full text-left p-3 hover:bg-secondary/50 transition-colors",
                  selectedEmail?.id === email.id && "bg-secondary",
                  !email.is_read && "bg-primary/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {!email.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  )}
                  <div className={cn("flex-1 min-w-0", email.is_read && "ml-4")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        !email.is_read && "font-semibold"
                      )}>
                        {email.from_name || email.from_address}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      !email.is_read ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {email.subject || '(No Subject)'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {email.text_body?.substring(0, 60) || 'No preview'}...
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );

  // Email Viewer Component
  const EmailViewer = () => (
    <Card className="h-full flex flex-col">
      {selectedEmail ? (
        <>
          {/* Header */}
          <CardHeader className="py-3 px-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              {isMobile && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMobileBack}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <CardTitle className="text-sm font-medium truncate flex-1">
                {selectedEmail.subject || '(No Subject)'}
              </CardTitle>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={openReplyComposer}
                  title="Reply"
                >
                  <Reply className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleRead(selectedEmail)}
                  title={selectedEmail.is_read ? 'Mark as unread' : 'Mark as read'}
                >
                  {selectedEmail.is_read ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteEmail(selectedEmail)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Email Meta */}
          <div className="p-4 border-b bg-muted/30 flex-shrink-0">
            <div className="space-y-1 text-sm">
              <div className="flex gap-2 flex-wrap">
                <span className="text-muted-foreground w-12 flex-shrink-0">From:</span>
                <span className="font-medium break-all">
                  {selectedEmail.from_name ? `${selectedEmail.from_name} <${selectedEmail.from_address}>` : selectedEmail.from_address}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-muted-foreground w-12 flex-shrink-0">To:</span>
                <span className="break-all">
                  {selectedEmail.to_addresses.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ')}
                </span>
              </div>
              {selectedEmail.cc_addresses && selectedEmail.cc_addresses.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-muted-foreground w-12 flex-shrink-0">CC:</span>
                  <span className="break-all">
                    {selectedEmail.cc_addresses.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12 flex-shrink-0">Date:</span>
                <span>{format(new Date(selectedEmail.received_at), 'PPpp')}</span>
              </div>
            </div>
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                {selectedEmail.attachments.map((att, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {att.filename}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Email Body */}
          <div className="p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <Button
                variant={showHtml ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHtml(true)}
                disabled={!selectedEmail.html_body}
              >
                HTML
              </Button>
              <Button
                variant={!showHtml ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHtml(false)}
              >
                Plain Text
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {showHtml && selectedEmail.html_body ? (
                <iframe
                  srcDoc={selectedEmail.html_body}
                  className="w-full h-full min-h-[300px] border rounded bg-white"
                  sandbox="allow-same-origin"
                  title="Email content"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded">
                  {selectedEmail.text_body || 'No text content available'}
                </pre>
              )}
            </ScrollArea>
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MailOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>Select an email to view</p>
          </div>
        </div>
      )}
    </Card>
  );

  // Reply Sheet (for both mobile and desktop)
  const ReplySheet = () => (
    <Sheet open={showReplySheet} onOpenChange={setShowReplySheet}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={cn(
        isMobile ? "h-[85vh] rounded-t-xl" : "w-[450px] sm:w-[540px]"
      )}>
        <SheetHeader className="text-left pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Reply className="h-5 w-5" />
            Reply to {selectedEmail?.from_name || selectedEmail?.from_address}
          </SheetTitle>
        </SheetHeader>
        
        <div className="py-4 space-y-4 flex-1 overflow-y-auto">
          {/* From/To Info */}
          <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-muted-foreground text-xs">From</Label>
              <p className="font-medium truncate">{selectedMailbox?.email_address}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">To</Label>
              <p className="font-medium truncate">{selectedEmail?.from_address}</p>
            </div>
          </div>
          
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="reply-subject">Subject</Label>
            <Input
              id="reply-subject"
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              placeholder="Subject"
            />
          </div>
          
          {/* Message */}
          <div className="space-y-2 flex-1">
            <Label htmlFor="reply-body">Message</Label>
            <Textarea
              id="reply-body"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Type your reply..."
              rows={isMobile ? 8 : 12}
              className="resize-none"
            />
          </div>
          
          {/* Original Message Preview */}
          <div className="border-l-2 border-muted-foreground/30 pl-3 mt-4">
            <p className="text-xs text-muted-foreground mb-1">Original message:</p>
            <p className="text-xs text-muted-foreground line-clamp-3">
              {selectedEmail?.text_body?.substring(0, 200) || "No content"}...
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowReplySheet(false)} disabled={sending}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSendReply} disabled={sending || !replyBody.trim()}>
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
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] flex flex-col">
      {/* Desktop Header */}
      {!isMobile && (
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Mailbox
            </h1>
            <p className="text-muted-foreground">
              {totalUnread > 0 ? `${totalUnread} unread emails` : 'Manage inbound emails'}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && mobileView === 'list' && (
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Mailbox
            {totalUnread > 0 && (
              <Badge variant="default">{totalUnread}</Badge>
            )}
          </h1>
        </div>
      )}

      {/* Content Grid */}
      <div className={cn(
        "flex-1 min-h-0",
        !isMobile && "grid grid-cols-12 gap-4"
      )}>
        {/* Desktop: 2-column layout */}
        {!isMobile && (
          <>
            <div className="col-span-5 h-full">
              <EmailList />
            </div>
            <div className="col-span-7 h-full">
              <EmailViewer />
            </div>
          </>
        )}

        {/* Mobile: View switching */}
        {isMobile && (
          <div className="h-full">
            {mobileView === 'list' ? <EmailList /> : <EmailViewer />}
          </div>
        )}
      </div>

      {/* Reply Sheet */}
      <ReplySheet />
    </div>
  );
}