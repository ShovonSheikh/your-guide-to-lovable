import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfile } from '@/hooks/useProfile';
import { useTickets, CreateTicketData } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Send, CheckCircle } from 'lucide-react';

const ticketSchema = z.object({
  guest_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  guest_email: z.string().email('Please enter a valid email'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(20, 'Message must be at least 20 characters').max(5000),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const categories = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'payment', label: 'Payment Issues' },
  { value: 'withdrawal', label: 'Withdrawal Help' },
  { value: 'account', label: 'Account Issues' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'other', label: 'Other' },
];

interface TicketFormProps {
  onSuccess?: (ticketNumber: string) => void;
}

export function TicketForm({ onSuccess }: TicketFormProps) {
  const { profile } = useProfile();
  const { createTicket } = useTickets();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      guest_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '',
      guest_email: profile?.email || '',
      subject: '',
      category: '',
      message: '',
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    setSubmitting(true);
    const result = await createTicket(data as CreateTicketData);
    setSubmitting(false);

    if (result.data) {
      setSubmitted(result.data.ticket_number);
      onSuccess?.(result.data.ticket_number);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-success/10">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h3 className="text-xl font-bold">Ticket Submitted!</h3>
            <p className="text-muted-foreground">
              Your ticket <span className="font-mono font-bold text-foreground">{submitted}</span> has been created.
              We'll get back to you as soon as possible.
            </p>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your email address.
            </p>
            <Button onClick={() => setSubmitted(null)} variant="outline" className="mt-4">
              Submit Another Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
        <CardDescription>
          Fill out the form below and we'll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest_name">Your Name</Label>
              <Input
                id="guest_name"
                placeholder="John Doe"
                {...register('guest_name')}
              />
              {errors.guest_name && (
                <p className="text-sm text-destructive">{errors.guest_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest_email">Email Address</Label>
              <Input
                id="guest_email"
                type="email"
                placeholder="you@example.com"
                {...register('guest_email')}
              />
              {errors.guest_email && (
                <p className="text-sm text-destructive">{errors.guest_email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={watch('category')}
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Please describe your issue in detail..."
              rows={6}
              {...register('message')}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {watch('message')?.length || 0} / 5000 characters
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Ticket
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
