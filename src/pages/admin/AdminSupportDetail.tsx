import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProfile } from '@/hooks/useProfile';
import { useSupabase } from '@/hooks/useSupabase';
import { useAdminTickets, SupportTicket, TicketMessage } from '@/hooks/useTickets';
import { useTickets } from '@/hooks/useTickets';
import { TicketChat } from '@/components/TicketChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ArrowLeft, Clock, Tag, User, Mail, CheckCircle, XCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  waiting_reply: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
  closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_reply: 'Awaiting Reply',
  resolved: 'Resolved',
  closed: 'Closed',
};

const categoryLabels: Record<string, string> = {
  general: 'General Inquiry',
  payment: 'Payment Issues',
  withdrawal: 'Withdrawal Help',
  account: 'Account Issues',
  technical: 'Technical Support',
  other: 'Other',
};

export default function AdminSupportDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const { profile } = useProfile();
  const { getTicket, uploadAttachment } = useTickets();
  const { updateTicketStatus, sendAdminMessage, closeTicket } = useAdminTickets();
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [isInternal, setIsInternal] = useState(false);

  usePageTitle(ticket ? `Ticket ${ticket.ticket_number}` : 'Ticket');

  const fetchData = async () => {
    if (!ticketId) return;

    setLoading(true);
    const ticketResult = await getTicket(ticketId);
    
    if (ticketResult.data) {
      setTicket(ticketResult.data);
    }
    setLoading(false);

    setMessagesLoading(true);
    // Fetch all messages including internal for admin
    const { data: allMessages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error('Error fetching ticket messages:', messagesError);
    }
    setMessages((allMessages || []) as TicketMessage[]);
    setMessagesLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  // Poll for new messages
  useEffect(() => {
    if (!ticketId || ticket?.status === 'closed') return;

    const interval = setInterval(async () => {
      const { data: allMessages, error: messagesError } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('Error fetching ticket messages:', messagesError);
        return;
      }
      setMessages((allMessages || []) as TicketMessage[]);
    }, 5000);

    return () => clearInterval(interval);
  }, [supabase, ticketId, ticket?.status]);

  const handleSendMessage = async (message: string, attachments?: TicketMessage['attachments']) => {
    if (!ticketId || !profile) return;
    
    const senderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin';
    const { error } = await sendAdminMessage(
      ticketId,
      message,
      senderName,
      isInternal,
      attachments
    );
    
    if (!error) {
      await fetchData();
    }
  };

  const handleUpload = async (file: File) => {
    return await uploadAttachment(file);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return;
    await updateTicketStatus(ticketId, newStatus);
    await fetchData();
  };

  const handleClose = async () => {
    if (!ticketId || !profile) return;
    await closeTicket(ticketId, profile.id);
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Ticket Not Found</h2>
            <Button onClick={() => navigate('/admin/support')}>Back to Tickets</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/support')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-muted-foreground">
              {ticket.ticket_number}
            </span>
            <Badge
              variant="outline"
              className={statusColors[ticket.status] || statusColors.open}
            >
              {statusLabels[ticket.status] || ticket.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversation</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="internal"
                    checked={isInternal}
                    onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                  />
                  <Label htmlFor="internal" className="text-sm cursor-pointer">
                    Internal note
                  </Label>
                </div>
              </div>
            </CardHeader>
            <div className="flex-1 min-h-0">
              <TicketChat
                messages={messages}
                onSendMessage={handleSendMessage}
                onUploadFile={handleUpload}
                isAdmin
                disabled={isClosed}
                loading={messagesLoading}
              />
            </div>
          </Card>
        </div>

        {/* Ticket Info & Actions */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={handleStatusChange}
                  disabled={isClosed}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_reply">Awaiting Reply</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      disabled={ticket.status === 'resolved'}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Resolve Ticket?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the ticket as resolved. The customer will be notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleStatusChange('resolved')}>
                        Resolve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      disabled={isClosed}
                    >
                      <XCircle className="w-4 h-4" />
                      Close
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Close Ticket?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will close the ticket. The customer will be notified via email.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClose}>
                        Close Ticket
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">
                    {categoryLabels[ticket.category] || ticket.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{ticket.guest_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${ticket.guest_email}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {ticket.guest_email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              {ticket.closed_at && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Closed on {format(new Date(ticket.closed_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
