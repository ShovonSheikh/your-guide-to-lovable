-- Advanced Alert System: Amount-based sounds, GIFs, and safety controls

-- 1. Create tip_sounds table for amount-based alert sounds
CREATE TABLE public.tip_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_amount NUMERIC NOT NULL,
  sound_url TEXT NOT NULL,
  display_name TEXT NOT NULL,
  cooldown_seconds INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_tip_sounds_profile_amount ON tip_sounds(profile_id, trigger_amount);

-- RLS for tip_sounds
ALTER TABLE public.tip_sounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tip sounds"
  ON public.tip_sounds FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers')::json->>'x-clerk-user-id')
  ));

CREATE POLICY "Users can insert their own tip sounds"
  ON public.tip_sounds FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers')::json->>'x-clerk-user-id')
  ));

CREATE POLICY "Users can update their own tip sounds"
  ON public.tip_sounds FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers')::json->>'x-clerk-user-id')
  ));

CREATE POLICY "Users can delete their own tip sounds"
  ON public.tip_sounds FOR DELETE
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers')::json->>'x-clerk-user-id')
  ));

-- Public read access for overlay pages via profile lookup
CREATE POLICY "Public can view tip sounds for enabled creators"
  ON public.tip_sounds FOR SELECT
  USING (
    profile_id IN (
      SELECT profile_id FROM streamer_settings WHERE is_enabled = true
    )
  );

-- 2. Create approved_gifs table (admin-curated)
CREATE TABLE public.approved_gifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT,
  duration_seconds INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for approved_gifs - everyone can read, only admins can modify
ALTER TABLE public.approved_gifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved GIFs"
  ON public.approved_gifs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage approved GIFs"
  ON public.approved_gifs FOR ALL
  USING (is_admin());

-- Seed with approved GIFs
INSERT INTO public.approved_gifs (name, url, category, duration_seconds) VALUES
  ('Party Popper', 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif', 'celebration', 3),
  ('Confetti', 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', 'celebration', 4),
  ('Money Rain', 'https://media.giphy.com/media/LdOyjZ7io5Msw/giphy.gif', 'hype', 4),
  ('Applause', 'https://media.giphy.com/media/l0HlMJNxKwq4yIkZq/giphy.gif', 'hype', 3),
  ('Celebration Dance', 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', 'celebration', 5),
  ('Thank You', 'https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif', 'funny', 3),
  ('Cool Cat', 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif', 'funny', 3),
  ('Fire', 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif', 'hype', 4);

-- 3. Add new columns to streamer_settings for GIF and safety controls
ALTER TABLE public.streamer_settings 
  ADD COLUMN IF NOT EXISTS gif_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gif_id UUID REFERENCES approved_gifs(id),
  ADD COLUMN IF NOT EXISTS gif_position TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS emergency_mute BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sounds_paused BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gifs_paused BOOLEAN DEFAULT false;