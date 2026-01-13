-- Create a security definer function to check if current user is admin
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = (auth.uid())::text
      AND is_admin = true
  )
$$;

-- Create a function to get the current user's profile id (using Clerk header)
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  LIMIT 1
$$;

-- Drop the problematic admin policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Recreate admin policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin());

-- Update admin_activity_logs policies to use the security definer function
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_logs;

CREATE POLICY "Admins can view all activity logs" 
ON public.admin_activity_logs 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can insert activity logs" 
ON public.admin_activity_logs 
FOR INSERT 
WITH CHECK (public.is_admin());

-- Update notification_settings policies to use security definer
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;

CREATE POLICY "Users can view their own notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can update their own notification settings" 
ON public.notification_settings 
FOR UPDATE 
USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can insert their own notification settings" 
ON public.notification_settings 
FOR INSERT 
WITH CHECK (profile_id = public.get_current_profile_id());

-- Update notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (profile_id = public.get_current_profile_id());

-- Drop existing admin policies for withdrawals and tips if they exist
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all tips" ON public.tips;

-- Add admin policies for withdrawal_requests
CREATE POLICY "Admins can view all withdrawals" 
ON public.withdrawal_requests 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update all withdrawals" 
ON public.withdrawal_requests 
FOR UPDATE 
USING (public.is_admin());

-- Add admin policy for tips
CREATE POLICY "Admins can view all tips" 
ON public.tips 
FOR SELECT 
USING (public.is_admin());