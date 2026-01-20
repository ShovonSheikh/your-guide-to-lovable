-- Fix the Security Definer View issue by recreating the view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  first_name,
  last_name,
  bio,
  avatar_url,
  twitter,
  instagram,
  youtube,
  facebook,
  other_link,
  account_type,
  onboarding_status,
  is_verified,
  total_received,
  total_supporters,
  created_at
FROM public.profiles;