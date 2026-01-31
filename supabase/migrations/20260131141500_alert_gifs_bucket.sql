-- Storage bucket for user-uploaded GIFs used in alerts

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('alert-gifs', 'alert-gifs', true, 10485760, ARRAY['image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own alert GIFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'alert-gifs' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM public.profiles
    WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  )
);

CREATE POLICY "Anyone can read alert GIFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'alert-gifs');

CREATE POLICY "Users can delete their own alert GIFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'alert-gifs' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM public.profiles
    WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
  )
);

