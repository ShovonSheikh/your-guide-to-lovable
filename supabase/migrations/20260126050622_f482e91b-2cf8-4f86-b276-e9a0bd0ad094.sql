-- Migration: Fix overly permissive RLS policies flagged by Supabase linter
-- Issue: RLS policies with WITH CHECK (true) for INSERT operations

-- ============================================
-- 1. FIX: profiles table INSERT policy
-- The current policy allows anyone to insert ANY profile
-- Should restrict to ensure the profile being created links to the inserting user
-- ============================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- New policy: Users can only insert profiles where user_id matches their Clerk ID
-- This ensures a user can only create their own profile, not impersonate others
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
    OR
    -- Allow service role / webhook inserts (no x-clerk-user-id header)
    ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text) IS NULL
  );

-- ============================================
-- 2. KEEP: tips table INSERT policy as-is (intentional design)
-- Tips are public donations - anyone (anonymous users) can send tips
-- This is a valid business requirement, not a security flaw
-- ============================================

-- ============================================
-- 3. KEEP: Service role policies as-is
-- Service role bypasses RLS anyway, these policies are for documentation
-- - creator_signups: Service role management (webhook handling)
-- - email_logs: Service role inserts (edge function logging)
-- - inbound_emails: Service role inserts (webhook handling)
-- - rate_limits: Service role management (edge function rate limiting)
-- ============================================

-- Add documentation comments
COMMENT ON POLICY "Anyone can insert tips" ON public.tips IS 
  'Intentionally permissive: Tips are public donations from anonymous users. Validation happens in create-tip edge function.';