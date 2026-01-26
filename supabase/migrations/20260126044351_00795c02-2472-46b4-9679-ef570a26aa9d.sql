-- Fix 1: Restrict creator_signups to service role only (edge functions)
-- Drop overly permissive public policies
DROP POLICY IF EXISTS "Allow public inserts" ON public.creator_signups;
DROP POLICY IF EXISTS "Allow public updates" ON public.creator_signups;
DROP POLICY IF EXISTS "Allow public reads" ON public.creator_signups;
DROP POLICY IF EXISTS "Allow service role full access" ON public.creator_signups;

-- Only allow access via service role (edge functions)
-- Anon users cannot directly access this table
CREATE POLICY "Service role can manage creator_signups"
  ON public.creator_signups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view signups for monitoring
CREATE POLICY "Admins can view creator_signups"
  ON public.creator_signups
  FOR SELECT
  USING (is_admin());