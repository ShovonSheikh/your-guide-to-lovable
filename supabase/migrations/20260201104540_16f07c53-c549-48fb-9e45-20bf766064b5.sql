-- Support Ticket System: Tables, Indexes, RLS Policies, Storage Bucket

-- 1. Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id)
);

-- 2. Create ticket_messages table
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id UUID REFERENCES public.profiles(id),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX idx_tickets_profile ON public.support_tickets(profile_id);
CREATE INDEX idx_tickets_email ON public.support_tickets(guest_email);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_tickets_number ON public.support_tickets(ticket_number);
CREATE INDEX idx_messages_ticket ON public.ticket_messages(ticket_id);

-- 4. Add admin permission for support
ALTER TABLE public.admin_roles ADD COLUMN can_manage_support BOOLEAN NOT NULL DEFAULT false;

-- 5. Enable RLS on tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for support_tickets

-- Users can view their own tickets (by profile_id)
CREATE POLICY "Users can view own tickets by profile"
ON public.support_tickets FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = (current_setting('request.headers', true)::json ->> 'x-clerk-user-id')
  )
);

-- Users can view their own tickets (by email for guests who later signed up)
CREATE POLICY "Users can view own tickets by email"
ON public.support_tickets FOR SELECT
USING (
  guest_email IN (
    SELECT email FROM public.profiles 
    WHERE user_id = (current_setting('request.headers', true)::json ->> 'x-clerk-user-id')
  )
);

-- Admins can manage all tickets
CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (is_admin());

-- Service role can insert tickets (for edge function)
CREATE POLICY "Service role can insert tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (true);

-- Users can update their own tickets (for adding messages)
CREATE POLICY "Users can update own tickets"
ON public.support_tickets FOR UPDATE
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = (current_setting('request.headers', true)::json ->> 'x-clerk-user-id')
  )
);

-- 7. RLS Policies for ticket_messages

-- Users can view non-internal messages of their tickets
CREATE POLICY "Users can view messages of their tickets"
ON public.ticket_messages FOR SELECT
USING (
  is_internal = false AND
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE profile_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = (current_setting('request.headers', true)::json ->> 'x-clerk-user-id')
    )
    OR guest_email IN (
      SELECT email FROM public.profiles 
      WHERE user_id = (current_setting('request.headers', true)::json ->> 'x-clerk-user-id')
    )
  )
);

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
ON public.ticket_messages FOR ALL
USING (is_admin());

-- Service role can insert messages (for edge function)
CREATE POLICY "Service role can insert messages"
ON public.ticket_messages FOR INSERT
WITH CHECK (true);

-- Users can insert messages to their own tickets
CREATE POLICY "Users can insert messages to own tickets"
ON public.ticket_messages FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE profile_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = (current_setting('request.headers', true)::json ->> 'x-clerk-user-id')
    )
  )
);

-- 8. Add updated_at trigger for support_tickets
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', false);

-- 10. Storage policies for support-attachments bucket

-- Users can upload files to support-attachments (anon since we use Clerk)
CREATE POLICY "Users can upload support attachments"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'support-attachments');

-- Users can view their own attachments
CREATE POLICY "Users can view support attachments"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'support-attachments');

-- Admins can manage all support attachments
CREATE POLICY "Admins can manage support attachments"
ON storage.objects FOR ALL TO anon
USING (bucket_id = 'support-attachments' AND is_admin());