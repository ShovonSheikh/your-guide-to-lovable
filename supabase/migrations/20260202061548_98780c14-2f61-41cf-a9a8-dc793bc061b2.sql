-- Add is_public column to notices table for public page visibility
ALTER TABLE public.notices 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Drop existing public policy
DROP POLICY IF EXISTS "Public can view active notices" ON public.notices;

-- Create policy for public notices page (is_public = true)
CREATE POLICY "Public can view active public notices" ON public.notices
FOR SELECT
USING (
  is_active = true 
  AND is_public = true 
  AND starts_at <= now() 
  AND (ends_at IS NULL OR ends_at > now())
);

-- Create policy for home/dashboard notices (existing behavior)
CREATE POLICY "Show notices on home and dashboard" ON public.notices
FOR SELECT
USING (
  is_active = true 
  AND (show_on_home = true OR show_on_dashboard = true)
  AND starts_at <= now() 
  AND (ends_at IS NULL OR ends_at > now())
);