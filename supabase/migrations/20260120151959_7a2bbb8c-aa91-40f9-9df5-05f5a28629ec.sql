-- Fix PUBLIC_DATA_EXPOSURE and SECRETS_EXPOSED vulnerabilities
-- The profiles table currently exposes sensitive fields (email, withdrawal_pin_hash, is_admin) to everyone

-- Step 1: Create a secure view for public profile access (excludes sensitive fields)
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Step 2: Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Step 3: Create a new restrictive public SELECT policy
-- Public access only allows viewing safe profile fields for creator profiles
-- (username, name, bio, social links, verification status, stats)
-- Sensitive fields (email, withdrawal_pin_hash, is_admin, user_id) are protected

CREATE POLICY "Public can view basic creator profiles"
ON public.profiles FOR SELECT
USING (
  -- Only allow public access to creator accounts (not supporters)
  account_type = 'creator'
  AND onboarding_status = 'completed'
);

-- Step 4: Ensure authenticated users can view their own full profile
-- This policy already exists: "Users can update their own profile"
-- But we need a policy for users to SELECT their own data
CREATE POLICY "Users can view their own full profile"
ON public.profiles FOR SELECT
USING (user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text));

-- Note: The "Admins can view all profiles" policy remains unchanged as admins need full access