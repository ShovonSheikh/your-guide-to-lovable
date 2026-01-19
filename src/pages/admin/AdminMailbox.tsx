import { useEffect, useState, useCallback } from "react";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Reply
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ReplyComposer } from "@/components/admin/ReplyComposer";

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

type MobileView = 'mailboxes' | 'list' | 'email';

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
  const [mobileView, setMobileView] = useState<MobileView>('mailboxes');
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const fetchMailboxes = useCallback(async () => {
    try {
      // Fetch mailboxes
      const { data: mailboxData, error: mailboxError } = await supabase
        .from('mailboxes')
        .select('*')
        .order('display_name');

      if (mailboxError) throw mailboxError;

      // Fetch unread counts for each mailbox
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
      
      // Auto-select first mailbox if none selected
      if (!selectedMailbox && mailboxesWithCounts.length > 0) {
        setSelectedMailbox(mailboxesWithCounts[0]);
        if (isMobile) {
          setMobileView('list');
        }
      }
    } catch (error) {
      console.error('Error fetching mailboxes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMailbox, supabase, isMobile]);

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
      
      // Cast the data to Email type
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

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('inbound_emails_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inbound_emails' },
        () => {
          // Refresh emails when new one arrives
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
    
    // Update mailbox unread count
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

  const handleSelectMailbox = (mailbox: Mailbox) => {
    setSelectedMailbox(mailbox);
    if (isMobile) {
      setMobileView('list');
    }
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    markAsRead(email);
    setShowReplyComposer(false); // Close reply composer when selecting new email
    if (isMobile) {
      setMobileView('email');
    }
  };

  const handleMobileBack = () => {
    if (mobileView === 'email') {
      setMobileView('list');
      setSelectedEmail(null);
    } else if (mobileView === 'list') {
      setMobileView('mailboxes');
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

  // Mobile Header with back navigation
  const MobileHeader = () => {
    if (!isMobile) return null;
    
    let title = 'Mailbox';
    if (mobileView === 'list' && selectedMailbox) {
      title = selectedMailbox.display_name;
    } else if (mobileView === 'email' && selectedEmail) {
      title = selectedEmail.subject || '(No Subject)';
    }

    return (
      <div className="flex items-center gap-2 mb-4">
        {mobileView !== 'mailboxes' && (
          <Button variant="ghost" size="icon" onClick={handleMobileBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold truncate flex-1">{title}</h1>
        <Button variant="outline" size="icon" onClick={() => fetchMailboxes()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Mailboxes Panel
  const MailboxesPanel = () => (
    <Card className={cn(
      "col-span-12 md:col-span-3",
      isMobile && mobileView !== 'mailboxes' && "hidden"
    )}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Inbox className="h-4 w-4" />
          Mailboxes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-1">
          {mailboxes.map((mailbox) => (
            <button
              key={mailbox.id}
              onClick={() => handleSelectMailbox(mailbox)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                selectedMailbox?.id === mailbox.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <span className="truncate">{mailbox.display_name}</span>
              {mailbox.unread_count > 0 && (
                <Badge 
                  variant={selectedMailbox?.id === mailbox.id ? "secondary" : "default"}
                  className="ml-2"
                >
                  {mailbox.unread_count}
                </Badge>
              )}
            </button>
          ))}
          {mailboxes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No mailboxes configured
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Email List Panel
  const EmailListPanel = () => (
    <Card className={cn(
      "col-span-12 md:col-span-4",
      isMobile && mobileView !== 'list' && "hidden"
    )}>
      <CardHeader className="py-3 px-4 border-b hidden md:block">
        <CardTitle className="text-sm font-medium">
          {selectedMailbox?.display_name || 'Select a mailbox'}
        </CardTitle>
      </CardHeader>
      <ScrollArea className={cn("h-[calc(100%-53px)]", isMobile && "h-[calc(100vh-180px)]")}>
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
                      {email.text_body?.substring(0, 80) || 'No preview available'}...
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

  // Email Viewer Panel
  const EmailViewerPanel = () => (
    <Card className={cn(
      "col-span-12 md:col-span-5",
      isMobile && mobileView !== 'email' && "hidden"
    )}>
      {selectedEmail ? (
        <>
          <CardHeader className="py-3 px-4 border-b hidden md:block">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium truncate">
                {selectedEmail.subject || '(No Subject)'}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowReplyComposer(!showReplyComposer)}
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
          
          {/* Mobile action bar */}
          {isMobile && (
            <div className="flex items-center justify-end gap-1 p-2 border-b">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowReplyComposer(!showReplyComposer)}
              >
                <Reply className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleRead(selectedEmail)}
              >
                {selectedEmail.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteEmail(selectedEmail)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="p-4 border-b bg-muted/30">
            <div className="space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">From:</span>
                <span className="font-medium break-all">
                  {selectedEmail.from_name ? `${selectedEmail.from_name} <${selectedEmail.from_address}>` : selectedEmail.from_address}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">To:</span>
                <span className="break-all">
                  {selectedEmail.to_addresses.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ')}
                </span>
              </div>
              {selectedEmail.cc_addresses && selectedEmail.cc_addresses.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-12">CC:</span>
                  <span className="break-all">
                    {selectedEmail.cc_addresses.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">Date:</span>
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
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
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
            <ScrollArea className={cn("h-[calc(100vh-480px)]", isMobile && "h-[calc(100vh-400px)]")}>
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
          
          {/* Reply Composer */}
          {showReplyComposer && selectedMailbox && (
            <ReplyComposer
              email={selectedEmail}
              mailboxAddress={selectedMailbox.email_address}
              onClose={() => setShowReplyComposer(false)}
              onSent={() => {
                setShowReplyComposer(false);
              }}
            />
          )}
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

  return (
    <div className="space-y-4">
      {/* Desktop Header */}
      {!isMobile && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Mailbox
            </h1>
            <p className="text-muted-foreground">
              {totalUnread > 0 ? `${totalUnread} unread emails` : 'Manage inbound emails'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchMailboxes()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {/* Mobile Header */}
      <MobileHeader />

      <div className={cn(
        "grid grid-cols-12 gap-4",
        !isMobile && "h-[calc(100vh-200px)]"
      )}>
        <MailboxesPanel />
        <EmailListPanel />
        <EmailViewerPanel />
      </div>
    </div>
  );
}
