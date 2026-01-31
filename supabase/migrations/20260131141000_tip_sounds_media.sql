-- Tip sound rules: optional GIF media per amount

ALTER TABLE public.tip_sounds
ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS gif_id UUID REFERENCES public.approved_gifs(id),
ADD COLUMN IF NOT EXISTS gif_url TEXT,
ADD COLUMN IF NOT EXISTS gif_duration_seconds INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tip_sounds_media_type_check'
  ) THEN
    ALTER TABLE public.tip_sounds
    ADD CONSTRAINT tip_sounds_media_type_check
    CHECK (media_type IN ('none', 'library', 'url', 'upload'));
  END IF;
END
$$;

