-- Streamer alerts: optional duration sync with GIF media

ALTER TABLE public.streamer_settings
ADD COLUMN IF NOT EXISTS match_gif_duration BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_gif_duration_seconds INTEGER;

