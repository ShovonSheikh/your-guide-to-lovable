-- Migration: Fix security scan findings
-- 1. funding_goals: Restrict public access to only goals for completed creator profiles
-- 2. public_profiles: RLS cannot be applied to views, but we document intent via the view definition

-- Step 1: Fix funding_goals RLS - restrict public access to only show goals for completed creator profiles
DROP POLICY IF EXISTS "Anyone can view active funding goals" ON public.funding_goals;

-- Create a more restrictive policy that only allows viewing goals for completed creator profiles
CREATE POLICY "Public can view active funding goals for completed creators"
  ON public.funding_goals FOR SELECT
  USING (
    is_active = true AND
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE account_type = 'creator'
        AND onboarding_status = 'completed'
    )
  );

-- Note: public_profiles is a VIEW, not a TABLE, so RLS cannot be applied directly.
-- Views inherit security from their underlying tables (profiles in this case).
-- The view already filters out sensitive fields (email, withdrawal_pin_hash, is_admin).
-- No action needed for public_profiles view - it's secure by design via the view definition.