
-- Create email_alert_rules table
CREATE TABLE public.email_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('from_address', 'subject', 'body', 'any')),
  match_value TEXT NOT NULL,
  match_mode TEXT NOT NULL DEFAULT 'contains' CHECK (match_mode IN ('exact', 'contains')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_alert_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage their own alert rules
CREATE POLICY "Admins can view own alert rules"
ON public.email_alert_rules
FOR SELECT
USING (
  profile_id = public.get_current_profile_id()
  AND public.is_admin()
);

CREATE POLICY "Admins can insert own alert rules"
ON public.email_alert_rules
FOR INSERT
WITH CHECK (
  profile_id = public.get_current_profile_id()
  AND public.is_admin()
);

CREATE POLICY "Admins can update own alert rules"
ON public.email_alert_rules
FOR UPDATE
USING (
  profile_id = public.get_current_profile_id()
  AND public.is_admin()
);

CREATE POLICY "Admins can delete own alert rules"
ON public.email_alert_rules
FOR DELETE
USING (
  profile_id = public.get_current_profile_id()
  AND public.is_admin()
);

-- Index for webhook lookups (active rules only)
CREATE INDEX idx_email_alert_rules_active ON public.email_alert_rules (is_active) WHERE is_active = true;
