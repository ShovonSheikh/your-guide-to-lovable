-- Create admin_roles table for granular permission management
CREATE TABLE public.admin_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  can_view_dashboard BOOLEAN NOT NULL DEFAULT true,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_manage_creators BOOLEAN NOT NULL DEFAULT false,
  can_manage_verifications BOOLEAN NOT NULL DEFAULT false,
  can_manage_withdrawals BOOLEAN NOT NULL DEFAULT false,
  can_view_tips BOOLEAN NOT NULL DEFAULT false,
  can_manage_mailbox BOOLEAN NOT NULL DEFAULT false,
  can_manage_settings BOOLEAN NOT NULL DEFAULT false,
  can_manage_admins BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Admins can read their own permissions
CREATE POLICY "Admins can read their own permissions"
ON public.admin_roles
FOR SELECT
USING (
  user_id = (current_setting('request.headers', true)::json->>'x-clerk-user-id')
);

-- Super admins (with can_manage_admins = true) can read all permissions
CREATE POLICY "Super admins can read all permissions"
ON public.admin_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = (current_setting('request.headers', true)::json->>'x-clerk-user-id')
    AND ar.can_manage_admins = true
  )
);

-- Super admins can insert new admin roles
CREATE POLICY "Super admins can insert admin roles"
ON public.admin_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = (current_setting('request.headers', true)::json->>'x-clerk-user-id')
    AND ar.can_manage_admins = true
  )
);

-- Super admins can update admin roles
CREATE POLICY "Super admins can update admin roles"
ON public.admin_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = (current_setting('request.headers', true)::json->>'x-clerk-user-id')
    AND ar.can_manage_admins = true
  )
);

-- Super admins can delete admin roles
CREATE POLICY "Super admins can delete admin roles"
ON public.admin_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = (current_setting('request.headers', true)::json->>'x-clerk-user-id')
    AND ar.can_manage_admins = true
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_roles_updated_at
BEFORE UPDATE ON public.admin_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the first super admin (your current admin user)
-- This gets the user_id from the profiles table where is_admin = true
INSERT INTO public.admin_roles (
  user_id,
  can_view_dashboard,
  can_manage_users,
  can_manage_creators,
  can_manage_verifications,
  can_manage_withdrawals,
  can_view_tips,
  can_manage_mailbox,
  can_manage_settings,
  can_manage_admins
)
SELECT 
  user_id,
  true, true, true, true, true, true, true, true, true
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id) DO NOTHING;