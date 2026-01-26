-- =====================================================
-- FIX: verification-documents storage policy for flat file names
-- 
-- PROBLEM: The storage policies expect files to be in folders like 
-- {profile_id}/filename.ext, but the app uploads files with flat 
-- names like username_timestamp_type.ext
--
-- SOLUTION: Update policies to check that the filename starts with
-- the user's username (from profiles table), not folder-based checks
-- =====================================================

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;

-- Also drop older policy names that might still exist
DROP POLICY IF EXISTS "Allow verification document uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow verification document reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow verification document updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow verification document deletes" ON storage.objects;

-- Step 2: Create new policies that match the flat filename pattern
-- File names follow pattern: {username}_{timestamp}_{type}.{ext}

-- Users can upload documents with their username prefix
CREATE POLICY "Users can upload their own verification documents"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    name ~ ('^' || (
      SELECT COALESCE(username, id::text) FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    ) || '_')
  );

-- Users can view documents with their username prefix
CREATE POLICY "Users can view their own verification documents"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'verification-documents' AND
    name ~ ('^' || (
      SELECT COALESCE(username, id::text) FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    ) || '_')
  );

-- Users can update documents with their username prefix
CREATE POLICY "Users can update their own verification documents"
  ON storage.objects FOR UPDATE TO anon
  USING (
    bucket_id = 'verification-documents' AND
    name ~ ('^' || (
      SELECT COALESCE(username, id::text) FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    ) || '_')
  );

-- Users can delete documents with their username prefix
CREATE POLICY "Users can delete their own verification documents"
  ON storage.objects FOR DELETE TO anon
  USING (
    bucket_id = 'verification-documents' AND
    name ~ ('^' || (
      SELECT COALESCE(username, id::text) FROM public.profiles
      WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
    ) || '_')
  );

-- Admins can view all documents for verification review
CREATE POLICY "Admins can view all verification documents"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'verification-documents' AND
    is_admin()
  );
