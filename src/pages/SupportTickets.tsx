import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTickets } from '@/hooks/useTickets';
import { TopNavbar } from '@/components/TopNavbar';
import { MainFooter } from '@/components/MainFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import SEO from '@/components/SEO';
import { format } from 'date-fns';
import { Plus, MessageSquare, ArrowRight } from 'lucide-react';

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
  general: 'General',
  payment: 'Payment',
  withdrawal: 'Withdrawal',
  account: 'Account',
  technical: 'Technical',
  other: 'Other',
};

export default function SupportTickets() {
  usePageTitle('My Tickets');
  const navigate = useNavigate();
  const { tickets, loading } = useTickets();

  return (
    <>
      <SEO title="My Tickets - TipKoro Support" />
      <div className="flex min-h-screen flex-col bg-background">
        <TopNavbar />
        <div className="h-20" />

        <main className="flex-1 py-12">
          <div className="container max-w-[900px] px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold font-display">My Tickets</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage your support requests
                </p>
              </div>
              <Button onClick={() => navigate('/support')} className="gap-2">
                <Plus className="w-4 h-4" />
                New Ticket
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-muted">
                      <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No tickets yet</h3>
                    <p className="text-muted-foreground max-w-sm">
                      You haven't created any support tickets. Click the button below if you need help.
                    </p>
                    <Button onClick={() => navigate('/support')}>Create Your First Ticket</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/support/ticket/${ticket.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
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
                            <Badge variant="secondary">
                              {categoryLabels[ticket.category] || ticket.category}
                            </Badge>
                          </div>
                          <h3 className="font-semibold truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                            {ticket.updated_at !== ticket.created_at && (
                              <> • Updated {format(new Date(ticket.updated_at), 'MMM d, yyyy')}</>
                            )}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        <MainFooter />
      </div>
    </>
  );
}
