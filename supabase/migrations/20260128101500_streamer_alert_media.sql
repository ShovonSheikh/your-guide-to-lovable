-- Add alert media fields to streamer_settings for emoji/GIF support

ALTER TABLE public.streamer_settings
ADD COLUMN IF NOT EXISTS alert_media_type text NOT NULL DEFAULT 'emoji',
ADD COLUMN IF NOT EXISTS alert_emoji text DEFAULT '🎉',
ADD COLUMN IF NOT EXISTS alert_gif_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'streamer_settings_alert_media_type_check'
  ) THEN
    ALTER TABLE public.streamer_settings
    ADD CONSTRAINT streamer_settings_alert_media_type_check
    CHECK (alert_media_type IN ('emoji', 'gif', 'none'));
  END IF;
END
$$;

