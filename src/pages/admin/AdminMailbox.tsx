import { useEffect, useState, useCallback, useRef, memo } from "react";
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

// ============= Extracted Memoized Components =============

interface EmailListProps {
  selectedMailbox: Mailbox | null;
  mailboxes: Mailbox[];
  emails: Email[];
  selectedEmailId: string | null;
  isRefreshing: boolean;
  emailsLoading: boolean;
  onMailboxChange: (mailboxId: string) => void;
  onSelectEmail: (email: Email) => void;
  onRefresh: () => void;
}

const EmailListComponent = memo(function EmailList({
  selectedMailbox,
  mailboxes,
  emails,
  selectedEmailId,
  isRefreshing,
  emailsLoading,
  onMailboxChange,
  onSelectEmail,
  onRefresh,
}: EmailListProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Mailbox Dropdown */}
          <Select
            value={selectedMailbox?.id || ""}
            onValueChange={onMailboxChange}
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

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="flex-shrink-0"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
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
                onClick={() => onSelectEmail(email)}
                className={cn(
                  "w-full text-left p-3 hover:bg-secondary/50 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
                  selectedEmailId === email.id && "bg-secondary/70",
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
});

interface EmailViewerProps {
  email: Email | null;
  isMobile: boolean;
  showHtml: boolean;
  onToggleHtml: (show: boolean) => void;
  onBack: () => void;
  onReply: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
}

const EmailViewerComponent = memo(function EmailViewer({
  email,
  isMobile,
  showHtml,
  onToggleHtml,
  onBack,
  onReply,
  onToggleRead,
  onDelete,
}: EmailViewerProps) {
  if (!email) {
    return (
      <Card className="h-full flex flex-col">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MailOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>Select an email to view</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <CardTitle className="text-sm font-medium truncate flex-1">
            {email.subject || '(No Subject)'}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={onReply}
              className="gap-2"
            >
              <Reply className="h-4 w-4" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleRead}
              title={email.is_read ? 'Mark as unread' : 'Mark as read'}
            >
              {email.is_read ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
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
              {email.from_name ? `${email.from_name} <${email.from_address}>` : email.from_address}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-muted-foreground w-12 flex-shrink-0">To:</span>
            <span className="break-all">
              {email.to_addresses.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ')}
            </span>
          </div>
          {email.cc_addresses && email.cc_addresses.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-muted-foreground w-12 flex-shrink-0">CC:</span>
              <span className="break-all">
                {email.cc_addresses.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ')}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-muted-foreground w-12 flex-shrink-0">Date:</span>
            <span>{format(new Date(email.received_at), 'PPpp')}</span>
          </div>
        </div>
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            {email.attachments.map((att, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {att.filename}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Email Body */}
      <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <Button
            variant={showHtml ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleHtml(true)}
            disabled={!email.html_body}
          >
            HTML
          </Button>
          <Button
            variant={!showHtml ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleHtml(false)}
          >
            Plain Text
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {showHtml && email.html_body ? (
            <iframe
              srcDoc={email.html_body}
              className="w-full h-full border rounded bg-white"
              style={{ minHeight: '400px' }}
              sandbox="allow-same-origin"
              title="Email content"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded h-full overflow-auto">
              {email.text_body || 'No text content available'}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
});

// ============= Main Component =============

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref to avoid stale closure in real-time subscription
  const selectedMailboxRef = useRef<Mailbox | null>(null);
  
  // Stable ref for the displayed email - prevents re-renders during auto-refresh
  const displayedEmailRef = useRef<Email | null>(null);

  // Reply composer state
  const [showReplySheet, setShowReplySheet] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    selectedMailboxRef.current = selectedMailbox;
  }, [selectedMailbox]);

  // Update displayed email ref only when a NEW email is selected (not on refresh)
  useEffect(() => {
    if (selectedEmail && selectedEmail.id !== displayedEmailRef.current?.id) {
      displayedEmailRef.current = selectedEmail;
    } else if (!selectedEmail) {
      displayedEmailRef.current = null;
    }
  }, [selectedEmail]);

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

      // Only update if data actually changed (prevents re-renders)
      setMailboxes(prev => {
        const prevJson = JSON.stringify(prev);
        const newJson = JSON.stringify(mailboxesWithCounts);
        if (prevJson === newJson) return prev;
        return mailboxesWithCounts;
      });

      if (!selectedMailboxRef.current && mailboxesWithCounts.length > 0) {
        setSelectedMailbox(mailboxesWithCounts[0]);
      }
    } catch (error) {
      console.error('Error fetching mailboxes:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchEmails = useCallback(async (mailboxId: string, showLoading = true) => {
    if (showLoading) {
      setEmailsLoading(true);
    }
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

      // Only update emails list if data actually changed
      setEmails(prev => {
        const prevJson = JSON.stringify(prev);
        const newJson = JSON.stringify(typedEmails);
        if (prevJson === newJson) return prev;
        return typedEmails;
      });
      
      // Update displayed email's read status if it changed (for toggle read button sync)
      // But don't trigger a re-render of the email content
      if (displayedEmailRef.current) {
        const updatedEmail = typedEmails.find(e => e.id === displayedEmailRef.current?.id);
        if (updatedEmail && updatedEmail.is_read !== displayedEmailRef.current.is_read) {
          displayedEmailRef.current = updatedEmail;
        }
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      if (showLoading) {
        setEmailsLoading(false);
      }
    }
  }, [supabase]);

  useEffect(() => {
    fetchMailboxes();
  }, [fetchMailboxes]);

  useEffect(() => {
    if (selectedMailbox) {
      fetchEmails(selectedMailbox.id);
      setSelectedEmail(null);
      displayedEmailRef.current = null;
    }
  }, [selectedMailbox, fetchEmails]);

  // Unified refresh function (silent = no loading state, prevents flickering)
  const handleRefresh = useCallback(async (silent = false) => {
    setIsRefreshing(true);
    try {
      await fetchMailboxes();
      if (selectedMailboxRef.current) {
        await fetchEmails(selectedMailboxRef.current.id, !silent);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMailboxes, fetchEmails]);

  // Manual refresh handler - stable callback for EmailList
  const handleManualRefresh = useCallback(() => {
    handleRefresh(false);
  }, [handleRefresh]);

  // Auto-refresh every 3 seconds (silent to prevent flickering)
  // Skip refresh when reply sheet is open to prevent re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showReplySheet) {
        handleRefresh(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [handleRefresh, showReplySheet]);

  // Real-time subscription using ref to avoid stale closure
  useEffect(() => {
    const channel = supabase
      .channel('inbound_emails_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inbound_emails' },
        () => {
          // Use ref to get current mailbox (avoids stale closure)
          if (selectedMailboxRef.current) {
            fetchEmails(selectedMailboxRef.current.id);
          }
          fetchMailboxes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmails, fetchMailboxes, supabase]);

  const markAsRead = useCallback(async (email: Email) => {
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
  }, [supabase]);

  const toggleRead = useCallback(async (email: Email) => {
    const newReadState = !email.is_read;

    await supabase
      .from('inbound_emails')
      .update({ is_read: newReadState })
      .eq('id', email.id);

    setEmails(prev =>
      prev.map(e => e.id === email.id ? { ...e, is_read: newReadState } : e)
    );

    setSelectedEmail(prev => 
      prev?.id === email.id ? { ...prev, is_read: newReadState } : prev
    );

    setMailboxes(prev =>
      prev.map(mb =>
        mb.id === email.mailbox_id
          ? { ...mb, unread_count: newReadState ? mb.unread_count - 1 : mb.unread_count + 1 }
          : mb
      )
    );
  }, [supabase]);

  const deleteEmail = useCallback(async (email: Email) => {
    await supabase
      .from('inbound_emails')
      .update({ is_deleted: true })
      .eq('id', email.id);

    setEmails(prev => prev.filter(e => e.id !== email.id));

    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null);
      displayedEmailRef.current = null;
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
  }, [supabase, selectedEmail, isMobile]);

  const handleMailboxChange = useCallback((mailboxId: string) => {
    const mailbox = mailboxes.find(m => m.id === mailboxId);
    if (mailbox) {
      setSelectedMailbox(mailbox);
    }
  }, [mailboxes]);

  const handleSelectEmail = useCallback((email: Email) => {
    setSelectedEmail(email);
    displayedEmailRef.current = email;
    markAsRead(email);
    if (isMobile) {
      setMobileView('email');
    }
  }, [isMobile, markAsRead]);

  const handleMobileBack = useCallback(() => {
    setMobileView('list');
    setSelectedEmail(null);
    displayedEmailRef.current = null;
  }, []);

  const openReplyComposer = useCallback(() => {
    if (selectedEmail) {
      setShowReplySheet(true);
    }
  }, [selectedEmail]);

  // Stable callbacks for EmailViewer - use the displayed email from ref
  const handleToggleRead = useCallback(() => {
    if (displayedEmailRef.current) {
      toggleRead(displayedEmailRef.current);
    }
  }, [toggleRead]);

  const handleDelete = useCallback(() => {
    if (displayedEmailRef.current) {
      deleteEmail(displayedEmailRef.current);
    }
  }, [deleteEmail]);

  const handleToggleHtml = useCallback((show: boolean) => {
    setShowHtml(show);
  }, []);

  const totalUnread = mailboxes.reduce((sum, mb) => sum + mb.unread_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Reply Sheet Component with local state to prevent parent re-renders
  const ReplySheetContent = () => {
    const [localSubject, setLocalSubject] = useState(
      selectedEmail?.subject?.startsWith("Re:")
        ? selectedEmail.subject
        : `Re: ${selectedEmail?.subject || "(No Subject)"}`
    );
    const [localBody, setLocalBody] = useState("");
    const [localSending, setLocalSending] = useState(false);

    const handleSend = async () => {
      if (!localBody.trim() || !selectedEmail || !selectedMailbox) {
        toast.error("Please enter a message");
        return;
      }

      setLocalSending(true);
      try {
        const htmlBody = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="white-space: pre-wrap;">${localBody.replace(/\n/g, "<br>")}</div>
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
            subject: localSubject,
            html_body: htmlBody,
            text_body: `${localBody}\n\n---\nOn ${format(new Date(selectedEmail.received_at), 'PPpp')}, ${selectedEmail.from_name || selectedEmail.from_address} wrote:\n\n${selectedEmail.text_body || ""}`,
            in_reply_to: selectedEmail.message_id,
            original_email_id: selectedEmail.id,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Failed to send reply");
        }

        toast.success("Reply sent successfully!");
        setShowReplySheet(false);
      } catch (error: any) {
        console.error("Error sending reply:", error);
        toast.error(error.message || "Failed to send reply");
      } finally {
        setLocalSending(false);
      }
    };

    return (
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
              value={localSubject}
              onChange={(e) => setLocalSubject(e.target.value)}
              placeholder="Subject"
              className="focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>

          {/* Message */}
          <div className="space-y-2 flex-1">
            <Label htmlFor="reply-body">Message</Label>
            <Textarea
              id="reply-body"
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              placeholder="Type your reply..."
              rows={isMobile ? 8 : 12}
              className="resize-none focus-visible:ring-1 focus-visible:ring-primary/50"
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
          <Button variant="outline" onClick={() => setShowReplySheet(false)} disabled={localSending}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={localSending || !localBody.trim()}>
            {localSending ? (
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
    );
  };

  return (
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-120px)] flex flex-col">
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
              <EmailListComponent
                selectedMailbox={selectedMailbox}
                mailboxes={mailboxes}
                emails={emails}
                selectedEmailId={selectedEmail?.id || null}
                isRefreshing={isRefreshing}
                emailsLoading={emailsLoading}
                onMailboxChange={handleMailboxChange}
                onSelectEmail={handleSelectEmail}
                onRefresh={handleManualRefresh}
              />
            </div>
            <div className="col-span-7 h-full">
              <EmailViewerComponent
                email={displayedEmailRef.current}
                isMobile={isMobile}
                showHtml={showHtml}
                onToggleHtml={handleToggleHtml}
                onBack={handleMobileBack}
                onReply={openReplyComposer}
                onToggleRead={handleToggleRead}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}

        {/* Mobile: View switching */}
        {isMobile && (
          <div className="h-full">
            {mobileView === 'list' ? (
              <EmailListComponent
                selectedMailbox={selectedMailbox}
                mailboxes={mailboxes}
                emails={emails}
                selectedEmailId={selectedEmail?.id || null}
                isRefreshing={isRefreshing}
                emailsLoading={emailsLoading}
                onMailboxChange={handleMailboxChange}
                onSelectEmail={handleSelectEmail}
                onRefresh={handleManualRefresh}
              />
            ) : (
              <EmailViewerComponent
                email={displayedEmailRef.current}
                isMobile={isMobile}
                showHtml={showHtml}
                onToggleHtml={handleToggleHtml}
                onBack={handleMobileBack}
                onReply={openReplyComposer}
                onToggleRead={handleToggleRead}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </div>

      {/* Reply Sheet */}
      <Sheet open={showReplySheet} onOpenChange={setShowReplySheet}>
        {showReplySheet && <ReplySheetContent />}
      </Sheet>
    </div>
  );
}
