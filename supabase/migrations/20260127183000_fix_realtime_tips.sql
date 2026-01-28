-- Enable FULL replica identity on tips table to ensure all columns are available in Realtime events
ALTER TABLE public.tips REPLICA IDENTITY FULL;

-- Re-verify and ensure the public RLS policy exists and is correct
DROP POLICY IF EXISTS "Anyone can view completed tips for public display" ON public.tips;

CREATE POLICY "Anyone can view completed tips for public display"
  ON public.tips FOR SELECT
  USING (payment_status = 'completed');

-- Ensure Realtime is enabled (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'tips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tips;
  END IF;
END
$$;
