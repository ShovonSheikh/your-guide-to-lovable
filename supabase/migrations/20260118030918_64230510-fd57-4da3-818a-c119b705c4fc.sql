-- ============================================
-- PHASE 1: Fix is_admin() function to use Clerk headers
-- ============================================

-- Drop and recreate the is_admin function to use Clerk authentication
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = (
      (current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'
    )
    AND is_admin = true
  )
$$;

-- ============================================
-- Fix duplicate/conflicting RLS policies on withdrawal_requests
-- Remove the policies that use auth.uid() (they don't work with Clerk)
-- ============================================

-- Drop the broken policies that use auth.uid()
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update all withdrawal requests" ON public.withdrawal_requests;

-- The working policies "Admins can view all withdrawals" and "Admins can update all withdrawals" 
-- already exist and use is_admin() correctly

-- ============================================
-- PHASE 2: Create platform_config table
-- ============================================

CREATE TABLE IF NOT EXISTS public.platform_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read platform config
CREATE POLICY "Anyone can read platform config"
  ON public.platform_config FOR SELECT
  USING (true);

-- Only admins can update platform config
CREATE POLICY "Admins can update platform config"
  ON public.platform_config FOR UPDATE
  USING (is_admin());

-- Only admins can insert platform config
CREATE POLICY "Admins can insert platform config"
  ON public.platform_config FOR INSERT
  WITH CHECK (is_admin());

-- Insert default configuration (NO tip fee - only creator account fee)
INSERT INTO public.platform_config (key, value, description) VALUES
  ('creator_account_fee', '{"amount": 150, "currency": "BDT"}', 'Monthly creator account fee'),
  ('min_withdrawal', '{"amount": 100, "currency": "BDT"}', 'Minimum withdrawal amount'),
  ('max_withdrawal', '{"amount": 50000, "currency": "BDT"}', 'Maximum withdrawal amount'),
  ('payout_methods', '["bKash", "Nagad", "Rocket"]', 'Available payout methods')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- PHASE 2: Create verification_requests table
-- ============================================

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  id_front_url text NOT NULL,
  id_back_url text NOT NULL,
  selfie_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
CREATE POLICY "Users can view their own verification requests"
  ON public.verification_requests FOR SELECT
  USING (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  ));

-- Users can insert their own verification requests
CREATE POLICY "Users can insert their own verification requests"
  ON public.verification_requests FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  ));

-- Admins can view all verification requests
CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests FOR SELECT
  USING (is_admin());

-- Admins can update verification requests
CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests FOR UPDATE
  USING (is_admin());

-- ============================================
-- PHASE 2: Create mailbox system tables
-- ============================================

CREATE TABLE IF NOT EXISTS public.mailboxes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email_address text UNIQUE NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mailboxes ENABLE ROW LEVEL SECURITY;

-- Only admins can access mailboxes
CREATE POLICY "Admins can view mailboxes"
  ON public.mailboxes FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert mailboxes"
  ON public.mailboxes FOR INSERT
  WITH CHECK (is_admin());

-- Create inbound_emails table
CREATE TABLE IF NOT EXISTS public.inbound_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mailbox_id uuid NOT NULL REFERENCES public.mailboxes(id),
  message_id text UNIQUE NOT NULL,
  from_address text NOT NULL,
  from_name text,
  to_addresses jsonb NOT NULL,
  cc_addresses jsonb,
  bcc_addresses jsonb,
  subject text,
  html_body text,
  text_body text,
  attachments jsonb,
  received_at timestamptz NOT NULL,
  is_read boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inbound_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can access inbound emails
CREATE POLICY "Admins can view inbound emails"
  ON public.inbound_emails FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update inbound emails"
  ON public.inbound_emails FOR UPDATE
  USING (is_admin());

-- Allow service role to insert (for webhook)
CREATE POLICY "Service role can insert inbound emails"
  ON public.inbound_emails FOR INSERT
  WITH CHECK (true);

-- Seed default mailboxes
INSERT INTO public.mailboxes (email_address, display_name) VALUES
  ('support@tipkoro.com', 'Support'),
  ('finance@tipkoro.com', 'Finance'),
  ('info@tipkoro.com', 'Info'),
  ('admin@tipkoro.com', 'Admin'),
  ('notifications@tipkoro.com', 'Notifications'),
  ('hello@tipkoro.com', 'Hello')
ON CONFLICT (email_address) DO NOTHING;

-- ============================================
-- PHASE 2: Create email_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text NOT NULL,
  email_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  resend_id text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs"
  ON public.email_logs FOR SELECT
  USING (is_admin());

-- Allow service role to insert (for edge functions)
CREATE POLICY "Service role can insert email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Create verification-documents storage bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS for verification-documents bucket
CREATE POLICY "Users can upload their own verification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    )
  );

CREATE POLICY "Users can view their own verification documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    )
  );

CREATE POLICY "Admins can view all verification documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-documents' AND
    is_admin()
  );