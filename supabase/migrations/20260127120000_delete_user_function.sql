CREATE OR REPLACE FUNCTION delete_user_data(target_user_id text)
RETURNS TABLE (
  id_front_url text,
  id_back_url text,
  selfie_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_profile_id uuid;
  target_email text;
BEGIN
  -- Get profile_id and email
  SELECT id, email INTO target_profile_id, target_email FROM public.profiles WHERE user_id = target_user_id;
  
  IF target_profile_id IS NULL THEN
    -- Delete orphaned user_id references
    DELETE FROM public.admin_roles WHERE user_id = target_user_id;
    DELETE FROM public.maintenance_whitelist WHERE user_id = target_user_id;
    RETURN;
  END IF;

  -- 1. Set NULL for references where record should be kept
  UPDATE public.tips SET supporter_id = NULL WHERE supporter_id = target_profile_id;
  UPDATE public.verification_requests SET reviewed_by = NULL WHERE reviewed_by = target_profile_id;
  UPDATE public.platform_config SET updated_by = NULL WHERE updated_by = target_profile_id;
  
  -- 2. Capture URLs and Delete own verification requests
  -- We do this early to capture the URLs for file deletion
  RETURN QUERY 
  DELETE FROM public.verification_requests 
  WHERE profile_id = target_profile_id 
  RETURNING id_front_url, id_back_url, selfie_url;

  -- 3. Delete dependent data
  DELETE FROM public.admin_activity_logs WHERE admin_id = target_profile_id;
  DELETE FROM public.billing_records WHERE profile_id = target_profile_id;
  DELETE FROM public.creator_subscriptions WHERE profile_id = target_profile_id;
  DELETE FROM public.funding_goals WHERE profile_id = target_profile_id;
  DELETE FROM public.notification_settings WHERE profile_id = target_profile_id;
  DELETE FROM public.notifications WHERE profile_id = target_profile_id;
  DELETE FROM public.push_subscriptions WHERE profile_id = target_profile_id;
  DELETE FROM public.tips WHERE creator_id = target_profile_id;
  DELETE FROM public.withdrawal_otps WHERE profile_id = target_profile_id;
  DELETE FROM public.withdrawal_requests WHERE profile_id = target_profile_id;

  -- 4. Delete from creator_signups if email matches
  IF target_email IS NOT NULL THEN
    DELETE FROM public.creator_signups WHERE email = target_email;
  END IF;

  -- 5. Delete profile and user_id text references
  DELETE FROM public.admin_roles WHERE user_id = target_user_id;
  DELETE FROM public.maintenance_whitelist WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_profile_id;
END;
$$;
