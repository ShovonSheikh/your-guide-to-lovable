-- Migration: Remove public SELECT policy from profiles table
-- Issue: profiles_sensitive_columns - The "Public can view basic creator profiles" policy
-- exposes sensitive columns like withdrawal_pin_hash, is_admin, email, user_id
-- Solution: Drop the public policy and enforce use of public_profiles view

-- Drop the problematic public access policy
DROP POLICY IF EXISTS "Public can view basic creator profiles" ON public.profiles;

-- Add comment to table documenting the correct access pattern
COMMENT ON TABLE public.profiles IS 'PRIVATE: Use public_profiles view for public access. Direct table access is restricted to authenticated users viewing their own profile or admins.';

-- The existing policies remain:
-- - "Users can view their own full profile" (via x-clerk-user-id header)
-- - "Users can update their own profile" (via x-clerk-user-id header)  
-- - "Admins can view all profiles" (via is_admin() function)
-- - "Admins can update all profiles" (via is_admin() function)
-- - "Users can insert their own profile" (WITH CHECK true - for new users)

-- Verify the public_profiles view exists and is correctly configured
-- This view was created in migration 20260126043553 with security_invoker = true
-- It only exposes safe columns: id, username, first_name, last_name, bio, avatar_url,
-- is_verified, onboarding_status, account_type, created_at, total_supporters, total_received,
-- twitter, instagram, youtube, facebook, other_link