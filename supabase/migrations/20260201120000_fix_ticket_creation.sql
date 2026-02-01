-- 1. Add initial_message column to support_tickets
ALTER TABLE public.support_tickets ADD COLUMN initial_message TEXT;

-- 2. Allow public insert on support_tickets
-- We need to drop existing policy if it conflicts, but there was no "everyone" policy.
-- The default is deny.
CREATE POLICY "Everyone can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (true);

-- 3. Trigger function to create first message
CREATE OR REPLACE FUNCTION public.create_initial_ticket_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.initial_message IS NOT NULL THEN
    INSERT INTO public.ticket_messages (
      ticket_id,
      sender_type,
      sender_id,
      sender_name,
      message,
      is_internal
    ) VALUES (
      NEW.id,
      'user',
      NEW.profile_id,
      COALESCE(NEW.guest_name, 'Guest'),
      NEW.initial_message,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Trigger
DROP TRIGGER IF EXISTS trigger_create_initial_message ON public.support_tickets;
CREATE TRIGGER trigger_create_initial_message
AFTER INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_ticket_message();
