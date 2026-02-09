import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTickets, SupportTicket, TicketMessage } from '@/hooks/useTickets';
import { TopNavbar } from '@/components/TopNavbar';
import { MainFooter } from '@/components/MainFooter';
import { TicketChat } from '@/components/TicketChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import SEO from '@/components/SEO';
import { format } from 'date-fns';
import { ArrowLeft, Clock, Tag, User } from 'lucide-react';

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

export default function SupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { getTicket, getMessages, sendMessage, uploadAttachment } = useTickets();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);

  usePageTitle(ticket ? `Ticket ${ticket.ticket_number}` : 'Ticket');

  useEffect(() => {
    const fetchTicketData = async () => {
      if (!ticketId) return;

      setLoading(true);
      const ticketResult = await getTicket(ticketId);

      if (ticketResult.data) {
        setTicket(ticketResult.data);
      }
      setLoading(false);

      setMessagesLoading(true);
      const messagesResult = await getMessages(ticketId);
      setMessages(messagesResult.data);
      setMessagesLoading(false);
    };

    fetchTicketData();
  }, [ticketId, getTicket, getMessages]);

  // Poll for new messages
  useEffect(() => {
    if (!ticketId || ticket?.status === 'closed') return;

    const interval = setInterval(async () => {
      const result = await getMessages(ticketId);
      setMessages(result.data);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [ticketId, ticket?.status, getMessages]);

  const handleSendMessage = async (message: string, attachments?: TicketMessage['attachments']) => {
    if (!ticketId) return;

    const { error } = await sendMessage(ticketId, message, attachments);

    if (!error) {
      const result = await getMessages(ticketId);
      setMessages(result.data);
    }
  };

  const handleUpload = async (file: File) => {
    // Pass ticketId for ticket-based folder storage (RLS compliance)
    return await uploadAttachment(file, ticketId);
  };

  if (!ticket) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Ticket Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This ticket doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate('/support')}>Go to Support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <>
      <SEO title={`Ticket ${ticket.ticket_number} - TipKoro Support`} />
      <div className="flex min-h-screen flex-col bg-background">
        <TopNavbar />
        <div className="h-20" />

        <main className="flex-1 py-6">
          <div className="container max-w-[1000px] px-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings?tab=my-tickets')}
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
                    <CardTitle className="text-lg">Conversation</CardTitle>
                  </CardHeader>
                  <div className="flex-1 min-h-0">
                    <TicketChat
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      onUploadFile={handleUpload}
                      disabled={isClosed}
                      loading={messagesLoading}
                    />
                  </div>
                </Card>
              </div>

              {/* Ticket Info */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Ticket Details</CardTitle>
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
                        <p className="text-sm text-muted-foreground">Submitted by</p>
                        <p className="font-medium">{ticket.guest_name}</p>
                        <p className="text-sm text-muted-foreground">{ticket.guest_email}</p>
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
                          Closed on {format(new Date(ticket.closed_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {isClosed && (
                  <Card className="border-success/50 bg-success/5">
                    <CardContent className="pt-4">
                      <p className="text-sm text-center">
                        This ticket has been {ticket.status}. If you need further assistance,
                        please <a href="/support" className="text-primary hover:underline">create a new ticket</a>.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>

        <MainFooter />
      </div>
    </>
  );
}
