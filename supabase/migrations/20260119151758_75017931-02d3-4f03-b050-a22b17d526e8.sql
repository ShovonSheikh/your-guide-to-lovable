-- Drop the problematic policies
DROP POLICY IF EXISTS "Super admins can read all permissions" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can insert admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can update admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can delete admin roles" ON public.admin_roles;

-- Create a security definer function to check if user is a super admin
-- This avoids the infinite recursion by using SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin(clerk_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = clerk_user_id
    AND can_manage_admins = true
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Super admins can read all permissions"
ON public.admin_roles
FOR SELECT
USING (
  public.is_super_admin(current_setting('request.headers', true)::json->>'x-clerk-user-id')
);

CREATE POLICY "Super admins can insert admin roles"
ON public.admin_roles
FOR INSERT
WITH CHECK (
  public.is_super_admin(current_setting('request.headers', true)::json->>'x-clerk-user-id')
);

CREATE POLICY "Super admins can update admin roles"
ON public.admin_roles
FOR UPDATE
USING (
  public.is_super_admin(current_setting('request.headers', true)::json->>'x-clerk-user-id')
);

CREATE POLICY "Super admins can delete admin roles"
ON public.admin_roles
FOR DELETE
USING (
  public.is_super_admin(current_setting('request.headers', true)::json->>'x-clerk-user-id')
);