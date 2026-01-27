-- Create streamer_settings table for Streamer Mode feature
CREATE TABLE public.streamer_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  alert_token text UNIQUE,
  alert_duration integer NOT NULL DEFAULT 5,
  alert_sound text,
  alert_animation text NOT NULL DEFAULT 'slide',
  min_amount_for_alert numeric NOT NULL DEFAULT 0,
  show_message boolean NOT NULL DEFAULT true,
  sound_enabled boolean NOT NULL DEFAULT true,
  custom_css text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_animation CHECK (alert_animation IN ('slide', 'bounce', 'fade', 'pop')),
  CONSTRAINT valid_duration CHECK (alert_duration >= 1 AND alert_duration <= 30),
  CONSTRAINT one_settings_per_profile UNIQUE (profile_id)
);

-- Enable RLS
ALTER TABLE public.streamer_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own streamer settings"
  ON public.streamer_settings FOR SELECT
  USING (profile_id IN (
    SELECT id FROM public.profiles
    WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  ));

-- Users can insert their own settings
CREATE POLICY "Users can insert their own streamer settings"
  ON public.streamer_settings FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM public.profiles
    WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  ));

-- Users can update their own settings
CREATE POLICY "Users can update their own streamer settings"
  ON public.streamer_settings FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM public.profiles
    WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  ));

-- Public can view settings by alert_token (for OBS overlay page)
CREATE POLICY "Public can view streamer settings by token"
  ON public.streamer_settings FOR SELECT
  USING (alert_token IS NOT NULL AND is_enabled = true);

-- Create trigger for updated_at
CREATE TRIGGER update_streamer_settings_updated_at
  BEFORE UPDATE ON public.streamer_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get profile_id from alert_token
CREATE OR REPLACE FUNCTION public.get_profile_id_from_alert_token(token text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT profile_id
  FROM public.streamer_settings
  WHERE alert_token = token AND is_enabled = true
  LIMIT 1
$$;