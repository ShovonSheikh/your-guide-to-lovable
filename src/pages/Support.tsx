import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProfile } from '@/hooks/useProfile';
import { TopNavbar } from '@/components/TopNavbar';
import { MainFooter } from '@/components/MainFooter';
import { TicketForm } from '@/components/TicketForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';
import { Clock, CheckCircle, HelpCircle, TicketIcon } from 'lucide-react';

export default function Support() {
  usePageTitle('Support');
  const navigate = useNavigate();
  const { profile } = useProfile();

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

            {/* Ticket Form */}
            <TicketForm />

            {/* Link to view existing tickets for logged-in users */}
            {profile && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('/settings?tab=my-tickets')}
                >
                  <TicketIcon className="w-4 h-4" />
                  View Your Existing Tickets
                </Button>
              </div>
            )}

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
