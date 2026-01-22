-- Add RLS policies for verification-documents bucket
-- Allow authenticated users to upload their own verification documents
CREATE POLICY "Authenticated users can upload verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

-- Allow authenticated users to view their own documents
CREATE POLICY "Users can view verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-documents');

-- Allow authenticated users to update their own documents
CREATE POLICY "Users can update verification documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'verification-documents');

-- Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete verification documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'verification-documents');