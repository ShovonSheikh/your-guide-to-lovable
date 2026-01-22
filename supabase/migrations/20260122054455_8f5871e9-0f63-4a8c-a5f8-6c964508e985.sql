-- Drop existing policies that require 'authenticated' role
DROP POLICY IF EXISTS "Authenticated users can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete verification documents" ON storage.objects;

-- Recreate policies for anon role (since project uses Clerk, not Supabase Auth)
CREATE POLICY "Allow verification document uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "Allow verification document reads"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'verification-documents');

CREATE POLICY "Allow verification document updates"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'verification-documents');

CREATE POLICY "Allow verification document deletes"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'verification-documents');