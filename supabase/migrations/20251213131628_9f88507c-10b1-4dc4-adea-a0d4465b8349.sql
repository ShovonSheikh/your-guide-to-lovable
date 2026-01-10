-- Remove overly permissive RLS policies that expose PII and allow unauthorized updates
DROP POLICY IF EXISTS "Allow public reads" ON public.creator_signups;
DROP POLICY IF EXISTS "Allow public updates" ON public.creator_signups;

-- Keep only the insert policy for initial signups
-- All reads and updates happen through edge functions with service role key