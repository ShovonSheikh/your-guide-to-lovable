-- Migration: Fix tips table RLS security - restrict inserts to service role only
-- This prevents attackers from directly inserting fake tip records and bypassing payment verification

-- Drop the permissive "Anyone can insert tips" policy
DROP POLICY IF EXISTS "Anyone can insert tips" ON public.tips;

-- Create a service-role-only policy for tip inserts
-- Only the service role (used by edge functions like create-tip) can insert tips
-- This ensures all tips go through proper payment verification
CREATE POLICY "Only service role can insert tips"
  ON public.tips FOR INSERT TO service_role
  WITH CHECK (true);

-- Note: This change means:
-- 1. Anonymous donations still work - they go through the create-tip edge function which uses service role
-- 2. Direct client-side inserts are blocked, preventing fake tip injection
-- 3. The create-tip edge function validates payments via Rupantor API before inserting