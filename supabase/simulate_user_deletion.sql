-- =====================================================================
-- SIMULATE USER DELETION (Clerk Webhook Logic)
-- =====================================================================
-- Instructions:
-- 1. Replace 'user_2s...' below with the actual Clerk User ID you want to delete.
-- 2. Run this script in your Supabase SQL Editor.
-- =====================================================================

WITH deleted_files AS (
  SELECT * FROM delete_user_data('user_2s...') -- <--- PUT USER ID HERE
)
SELECT 
  'User Data Deleted' as status,
  id_front_url as file_to_remove_1,
  id_back_url as file_to_remove_2,
  selfie_url as file_to_remove_3
FROM deleted_files;
