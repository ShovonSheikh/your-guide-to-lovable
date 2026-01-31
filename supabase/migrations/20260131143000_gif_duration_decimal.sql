-- Allow fractional seconds for GIF durations

ALTER TABLE public.streamer_settings
ALTER COLUMN custom_gif_duration_seconds TYPE double precision
USING custom_gif_duration_seconds::double precision;

ALTER TABLE public.tip_sounds
ALTER COLUMN gif_duration_seconds TYPE double precision
USING gif_duration_seconds::double precision;

