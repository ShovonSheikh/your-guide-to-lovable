-- Task 1: Fix Explore Page - Add RLS policy for public profiles access
-- This allows anonymous users to view completed creator profiles via the public_profiles view

CREATE POLICY "Public can view completed creator profiles via view"
  ON public.profiles FOR SELECT
  USING (
    account_type = 'creator' 
    AND onboarding_status = 'completed'
    AND username IS NOT NULL
  );

-- Task 2: Create alert-sounds storage bucket for custom alert sounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('alert-sounds', 'alert-sounds', true, 5242880, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg']);

-- RLS: Users can upload to their own folder (profile_id based)
CREATE POLICY "Users can upload their own alert sounds"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'alert-sounds' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM public.profiles 
    WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  )
);

-- RLS: Public can read all alert sounds (needed for OBS browser source)
CREATE POLICY "Anyone can read alert sounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'alert-sounds');

-- RLS: Users can delete their own sounds
CREATE POLICY "Users can delete their own alert sounds"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'alert-sounds' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM public.profiles 
    WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  )
);

-- Task 3: Add TTS columns to streamer_settings
ALTER TABLE public.streamer_settings
ADD COLUMN tts_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN tts_voice TEXT DEFAULT 'default',
ADD COLUMN tts_rate NUMERIC DEFAULT 1.0,
ADD COLUMN tts_pitch NUMERIC DEFAULT 1.0;