-- Add maintenance mode config entries if they don't exist
INSERT INTO public.platform_config (key, value, description)
VALUES 
  ('maintenance_mode', '{"enabled": false}'::jsonb, 'Enable/disable maintenance mode for the site'),
  ('maintenance_message', '{"message": "We are currently performing scheduled maintenance. Please check back soon!"}'::jsonb, 'Custom message to display during maintenance')
ON CONFLICT (key) DO NOTHING;

-- Create maintenance whitelist table
CREATE TABLE public.maintenance_whitelist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  reason text,
  added_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_whitelist ENABLE ROW LEVEL SECURITY;

-- Only admins can manage whitelist
CREATE POLICY "Admins can view whitelist"
  ON public.maintenance_whitelist FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert whitelist"
  ON public.maintenance_whitelist FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update whitelist"
  ON public.maintenance_whitelist FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete whitelist"
  ON public.maintenance_whitelist FOR DELETE
  USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_maintenance_whitelist_updated_at
  BEFORE UPDATE ON public.maintenance_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user can bypass maintenance (admin or whitelisted)
CREATE OR REPLACE FUNCTION public.can_bypass_maintenance(clerk_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Check if user is admin
    SELECT 1 FROM public.profiles
    WHERE user_id = clerk_user_id AND is_admin = true
  ) OR EXISTS (
    -- Check if user is whitelisted
    SELECT 1 FROM public.maintenance_whitelist
    WHERE user_id = clerk_user_id
  )
$$;