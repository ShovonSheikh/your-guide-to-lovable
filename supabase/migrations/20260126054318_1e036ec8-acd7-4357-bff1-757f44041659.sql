-- Migration: Fix verification-documents storage policies
-- Issue: Overly permissive policies allow any anonymous user to access/modify all verification documents
-- Solution: Drop permissive policies and restore proper folder-based ownership validation

-- Step 1: Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow verification document uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow verification document reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow verification document updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow verification document deletes" ON storage.objects;

-- Step 2: Drop any existing proper policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own verification documents" ON storage.objects;

-- Step 3: Create proper folder-based ownership policies
-- Note: Using 'anon' role because Clerk users are seen as anon by Supabase, but with proper folder ownership validation

-- Users can only upload to their own folder (identified by profile ID)
CREATE POLICY "Users can upload their own verification documents"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    )
  );

-- Users can only view their own documents
CREATE POLICY "Users can view their own verification documents"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    )
  );

-- Users can update their own documents
CREATE POLICY "Users can update their own verification documents"
  ON storage.objects FOR UPDATE TO anon
  USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    )
  );

-- Users can delete their own documents
CREATE POLICY "Users can delete their own verification documents"
  ON storage.objects FOR DELETE TO anon
  USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    )
  );

-- Admins can view all documents for verification review
CREATE POLICY "Admins can view all verification documents"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'verification-documents' AND
    is_admin()
  );