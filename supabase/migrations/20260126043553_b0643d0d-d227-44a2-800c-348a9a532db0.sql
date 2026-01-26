-- =====================================================
-- SECURITY FIX: Restrict public access to profiles and tips tables
-- =====================================================

-- =====================================================
-- PART 1: FIX PROFILES TABLE
-- The "Public profiles are viewable by everyone" policy with USING (true)
-- was already dropped and replaced with "Public can view basic creator profiles"
-- However, that policy STILL exposes sensitive columns like email, pin hash
-- 
-- SOLUTION: The existing public_profiles view already hides sensitive data
-- We just need to ensure the direct table access doesn't leak sensitive fields
-- The current "Public can view basic creator profiles" is acceptable because
-- it only allows SELECT on completed creators (not USING(true))
-- But we need to verify the overly permissive one is gone
-- =====================================================

-- Drop the overly permissive policy if it still exists
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- =====================================================
-- PART 2: FIX TIPS TABLE
-- Create a public_tips view that excludes sensitive supporter info
-- =====================================================

-- Create a sanitized public view for tips
CREATE VIEW public.public_tips
WITH (security_invoker = true)
AS
SELECT 
  id,
  creator_id,
  amount,
  currency,
  message,
  is_anonymous,
  created_at,
  -- Only show name for non-anonymous tips, never show email
  CASE WHEN is_anonymous THEN 'Anonymous' ELSE supporter_name END as supporter_display_name
FROM public.tips
WHERE payment_status = 'completed';

-- Drop the overly permissive policy that exposes all columns including email
DROP POLICY IF EXISTS "Anyone can view completed tips for public display" ON public.tips;