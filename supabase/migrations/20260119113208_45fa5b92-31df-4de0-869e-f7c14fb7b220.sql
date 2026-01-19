-- Add withdrawal PIN columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS withdrawal_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS withdrawal_pin_set_at TIMESTAMP WITH TIME ZONE;

-- Create withdrawal OTPs table for temporary OTP storage
CREATE TABLE public.withdrawal_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on withdrawal_otps
ALTER TABLE public.withdrawal_otps ENABLE ROW LEVEL SECURITY;

-- Users can view their own OTPs (for checking status)
CREATE POLICY "Users can view their own OTPs"
  ON public.withdrawal_otps FOR SELECT
  USING (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

-- Index for cleanup of expired OTPs
CREATE INDEX idx_withdrawal_otps_expires_at ON public.withdrawal_otps(expires_at);
CREATE INDEX idx_withdrawal_otps_profile_id ON public.withdrawal_otps(profile_id);

-- Create a function to clean up expired OTPs (can be called by cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.withdrawal_otps WHERE expires_at < NOW() OR used = TRUE;
END;
$$;