import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProfile } from '@/hooks/useProfile';
import { useTickets } from '@/hooks/useTickets';
import { TopNavbar } from '@/components/TopNavbar';
import { MainFooter } from '@/components/MainFooter';
import { TicketForm } from '@/components/TicketForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '@/components/SEO';
import { Search, MessageSquare, Clock, CheckCircle, HelpCircle } from 'lucide-react';

export default function Support() {
  usePageTitle('Support');
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { getTicketByNumber } = useTickets();
  const [ticketSearch, setTicketSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleTicketSearch = async () => {
    if (!ticketSearch.trim()) return;

    setSearching(true);
    setSearchError('');

    const result = await getTicketByNumber(ticketSearch.trim().toUpperCase());

    if (result.data) {
      navigate(`/support/ticket/${result.data.id}`);
    } else {
      setSearchError('Ticket not found. Please check the ticket number.');
    }

    setSearching(false);
  };

  return (
    <>
      <SEO
        title="Support - TipKoro"
        description="Get help with TipKoro. Create a support ticket or check the status of an existing ticket."
      />
      <div className="flex min-h-screen flex-col bg-background">
        <TopNavbar />
        <div className="h-20" />

        <main className="flex-1 py-12">
          <div className="container max-w-[1000px] px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold font-display mb-4">How can we help?</h1>
              <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
                Have a question or need assistance? We're here to help you get the most out of TipKoro.
              </p>
            </div>

            <Tabs defaultValue="new" className="space-y-8">
              <TabsList className="grid w-full max-w-[400px] mx-auto grid-cols-2">
                <TabsTrigger value="new" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  New Ticket
                </TabsTrigger>
                <TabsTrigger value="lookup" className="gap-2">
                  <Search className="w-4 h-4" />
                  Find Ticket
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new">
                <TicketForm />
              </TabsContent>

              <TabsContent value="lookup">
                <Card className="max-w-lg mx-auto">
                  <CardHeader>
                    <CardTitle>Find Your Ticket</CardTitle>
                    <CardDescription>
                      Enter your ticket number to view its status and continue the conversation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="TK-20260201-XXXX"
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTicketSearch()}
                        className="font-mono"
                      />
                      <Button onClick={handleTicketSearch} disabled={searching}>
                        {searching ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                    {searchError && (
                      <p className="text-sm text-destructive">{searchError}</p>
                    )}

                    {profile && (
                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate('/support/tickets')}
                        >
                          View All My Tickets
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Help Section */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-center mb-8">Quick Help</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within 24 hours. Urgent issues are prioritized.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-success/10 w-fit mb-2">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                    <CardTitle className="text-lg">Email Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You'll receive email updates when we respond to your ticket.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="p-3 rounded-xl bg-warning/10 w-fit mb-2">
                      <HelpCircle className="w-6 h-6 text-warning" />
                    </div>
                    <CardTitle className="text-lg">FAQ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Check our <a href="/#faq" className="text-primary hover:underline">FAQ section</a> for quick answers to common questions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <MainFooter />
      </div>
    </>
  );
}
