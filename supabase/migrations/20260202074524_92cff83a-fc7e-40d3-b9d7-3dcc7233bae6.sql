-- ============================================
-- Fix Security Issues
-- ============================================

-- Fix 1: Support Attachments Storage RLS
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can upload support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view support attachments" ON storage.objects;

-- Create ticket-based folder structure policies
-- Users can upload to ticket folders they own (ticket_id must be first folder)
CREATE POLICY "Users can upload to their ticket folders"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'support-attachments' AND
  -- Require folder structure: {ticket_id}/{filename}
  array_length(string_to_array(name, '/'), 1) >= 2 AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM public.support_tickets 
    WHERE profile_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = ((current_setting('request.headers', true)::json) ->> 'x-clerk-user-id')
    )
    OR guest_email IN (
      SELECT email FROM public.profiles 
      WHERE user_id = ((current_setting('request.headers', true)::json) ->> 'x-clerk-user-id')
    )
  )
);

-- Users can only view files from their own tickets
CREATE POLICY "Users can view their ticket attachments"
ON storage.objects FOR SELECT TO anon
USING (
  bucket_id = 'support-attachments' AND
  (string_to_array(name, '/'))[1] IN (
    SELECT id::text FROM public.support_tickets 
    WHERE profile_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = ((current_setting('request.headers', true)::json) ->> 'x-clerk-user-id')
    )
    OR guest_email IN (
      SELECT email FROM public.profiles 
      WHERE user_id = ((current_setting('request.headers', true)::json) ->> 'x-clerk-user-id')
    )
  )
);

-- Admins can manage all support attachments (keep existing policy)
-- Policy "Admins can manage support attachments" already exists

-- Fix 2: Server-side admin role management function
CREATE OR REPLACE FUNCTION public.grant_admin_role(
  target_user_id text,
  permissions jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_role_id uuid;
BEGIN
  -- Verify caller is a super admin (can_manage_admins = true)
  IF NOT is_super_admin((current_setting('request.headers', true)::json) ->> 'x-clerk-user-id') THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can grant admin roles';
  END IF;
  
  -- Insert admin_roles record with provided permissions or defaults
  INSERT INTO admin_roles (
    user_id,
    can_view_dashboard,
    can_manage_users,
    can_manage_creators,
    can_manage_verifications,
    can_manage_withdrawals,
    can_view_tips,
    can_manage_mailbox,
    can_manage_settings,
    can_manage_admins,
    can_manage_notices,
    can_manage_pages,
    can_manage_support
  )
  VALUES (
    target_user_id,
    COALESCE((permissions->>'can_view_dashboard')::boolean, true),
    COALESCE((permissions->>'can_manage_users')::boolean, false),
    COALESCE((permissions->>'can_manage_creators')::boolean, false),
    COALESCE((permissions->>'can_manage_verifications')::boolean, false),
    COALESCE((permissions->>'can_manage_withdrawals')::boolean, false),
    COALESCE((permissions->>'can_view_tips')::boolean, false),
    COALESCE((permissions->>'can_manage_mailbox')::boolean, false),
    COALESCE((permissions->>'can_manage_settings')::boolean, false),
    COALESCE((permissions->>'can_manage_admins')::boolean, false),
    COALESCE((permissions->>'can_manage_notices')::boolean, false),
    COALESCE((permissions->>'can_manage_pages')::boolean, false),
    COALESCE((permissions->>'can_manage_support')::boolean, false)
  )
  RETURNING id INTO new_role_id;
  
  -- Set is_admin flag on profile (server-side only)
  UPDATE profiles
  SET is_admin = true, updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN new_role_id;
END;
$$;

-- Function to revoke admin role (also server-side)
CREATE OR REPLACE FUNCTION public.revoke_admin_role(
  target_user_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a super admin
  IF NOT is_super_admin((current_setting('request.headers', true)::json) ->> 'x-clerk-user-id') THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can revoke admin roles';
  END IF;
  
  -- Delete admin_roles record
  DELETE FROM admin_roles WHERE user_id = target_user_id;
  
  -- Remove is_admin flag from profile
  UPDATE profiles
  SET is_admin = false, updated_at = now()
  WHERE user_id = target_user_id;
END;
$$;