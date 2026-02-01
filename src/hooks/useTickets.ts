import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useToast } from './use-toast';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  profile_id: string | null;
  guest_name: string | null;
  guest_email: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: string | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin' | 'system';
  sender_id: string | null;
  sender_name: string;
  message: string;
  attachments: Array<{
    url: string;
    type: string;
    name: string;
    size: number;
  }>;
  is_internal: boolean;
  created_at: string;
}

export interface CreateTicketData {
  guest_name: string;
  guest_email: string;
  subject: string;
  category: string;
  message: string;
}

function generateTicketNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TK-${dateStr}-${random}`;
}

export function useTickets() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [profile, fetchTickets]);

  const createTicket = async (data: CreateTicketData) => {
    const ticketNumber = generateTicketNumber();

    try {
      // Insert ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          profile_id: profile?.id || null,
          guest_name: data.guest_name,
          guest_email: data.guest_email,
          subject: data.subject,
          category: data.category,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Insert initial message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_type: 'user',
          sender_id: profile?.id || null,
          sender_name: data.guest_name,
          message: data.message,
        });

      if (messageError) throw messageError;

      // Trigger email notification
      await supabase.functions.invoke('send-support-email', {
        body: {
          type: 'ticket_created',
          ticket_id: ticket.id,
          ticket_number: ticketNumber,
          email: data.guest_email,
          subject: data.subject,
          name: data.guest_name,
        },
      });

      toast({
        title: 'Ticket Created',
        description: `Your ticket ${ticketNumber} has been submitted.`,
      });

      await fetchTickets();
      return { data: ticket as SupportTicket, error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const getTicket = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return { data: data as SupportTicket, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getTicketByNumber = async (ticketNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single();

      if (error) throw error;
      return { data: data as SupportTicket, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: (data || []) as TicketMessage[], error: null };
    } catch (error) {
      return { data: [], error };
    }
  };

  const sendMessage = async (
    ticketId: string,
    message: string,
    attachments: TicketMessage['attachments'] = []
  ) => {
    if (!profile) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send messages',
        variant: 'destructive',
      });
      return { error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'user',
          sender_id: profile.id,
          sender_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          message,
          attachments,
        });

      if (error) throw error;

      // Update ticket status and updated_at
      await supabase
        .from('support_tickets')
        .update({ status: 'waiting_reply', updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const uploadAttachment = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${profile?.id || 'guest'}/${fileName}`;

    try {
      const { error } = await supabase.storage
        .from('support-attachments')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        type: file.type,
        name: file.name,
        size: file.size,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  return {
    tickets,
    loading,
    createTicket,
    getTicket,
    getTicketByNumber,
    getMessages,
    sendMessage,
    uploadAttachment,
    refetch: fetchTickets,
  };
}

// Admin hook for managing all tickets
export function useAdminTickets() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updates: Partial<SupportTicket> = { status, updated_at: new Date().toISOString() };
      
      if (status === 'closed' || status === 'resolved') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${status}`,
      });

      await fetchTickets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const sendAdminMessage = async (
    ticketId: string,
    message: string,
    senderName: string,
    isInternal: boolean = false,
    attachments: TicketMessage['attachments'] = []
  ) => {
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: isInternal ? 'system' : 'admin',
          sender_name: senderName,
          message,
          attachments,
          is_internal: isInternal,
        });

      if (error) throw error;

      // Update ticket status
      await supabase
        .from('support_tickets')
        .update({ 
          status: isInternal ? undefined : 'in_progress',
          updated_at: new Date().toISOString() 
        })
        .eq('id', ticketId);

      // Trigger email notification for non-internal messages
      if (!isInternal) {
        const { data: ticket } = await supabase
          .from('support_tickets')
          .select('guest_email, ticket_number, subject')
          .eq('id', ticketId)
          .single();

        if (ticket) {
          await supabase.functions.invoke('send-support-email', {
            body: {
              type: 'new_reply',
              ticket_id: ticketId,
              ticket_number: ticket.ticket_number,
              email: ticket.guest_email,
              subject: ticket.subject,
              message_preview: message.substring(0, 200),
            },
          });
        }
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const closeTicket = async (ticketId: string, profileId: string) => {
    try {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('guest_email, ticket_number, subject')
        .eq('id', ticketId)
        .single();

      await supabase
        .from('support_tickets')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: profileId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      // Trigger email notification
      if (ticket) {
        await supabase.functions.invoke('send-support-email', {
          body: {
            type: 'ticket_closed',
            ticket_id: ticketId,
            ticket_number: ticket.ticket_number,
            email: ticket.guest_email,
            subject: ticket.subject,
          },
        });
      }

      toast({
        title: 'Ticket Closed',
        description: 'The ticket has been closed and the user notified.',
      });

      await fetchTickets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close ticket',
        variant: 'destructive',
      });
    }
  };

  return {
    tickets,
    loading,
    fetchTickets,
    updateTicketStatus,
    sendAdminMessage,
    closeTicket,
  };
}
