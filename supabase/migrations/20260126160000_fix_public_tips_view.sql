-- =====================================================
-- FIX: public_tips view returning empty results
-- 
-- PROBLEM: The view was created with security_invoker = true,
-- which means anonymous users can't read from it because there's
-- no RLS policy allowing public SELECT on the tips table.
--
-- SOLUTION: Recreate the view with security_definer = true
-- so the view runs with owner privileges and can read tips,
-- but only exposes the safe columns defined in the view.
-- =====================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.public_tips;

-- Recreate with security_definer = true
CREATE VIEW public.public_tips
WITH (security_barrier = true)
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

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_tips TO anon;
GRANT SELECT ON public.public_tips TO authenticated;
