-- Remove the overly permissive public insert policy on tips
DROP POLICY IF EXISTS "Anyone can insert tips" ON public.tips;

-- Add a restrictive policy that only allows service role (Edge Functions) to insert
-- This ensures tips can only be created through the create-tip Edge Function
CREATE POLICY "Only service role can insert tips"
ON public.tips
FOR INSERT
TO service_role
WITH CHECK (true);