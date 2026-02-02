-- ============================================
-- Fix Database Security Issues
-- ============================================

-- Fix 1: Update public_tips view to use security_invoker
DROP VIEW IF EXISTS public.public_tips;

CREATE VIEW public.public_tips
WITH (security_invoker=on) AS
SELECT 
    id,
    creator_id,
    amount,
    currency,
    message,
    is_anonymous,
    created_at,
    CASE
        WHEN is_anonymous THEN 'Anonymous'::text
        ELSE supporter_name
    END AS supporter_display_name
FROM public.tips
WHERE payment_status = 'completed';

-- Fix 2: Harden create_initial_ticket_message function with search_path
CREATE OR REPLACE FUNCTION public.create_initial_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.initial_message IS NOT NULL THEN
    INSERT INTO public.ticket_messages (
      ticket_id,
      sender_type,
      sender_id,
      sender_name,
      message,
      is_internal
    ) VALUES (
      NEW.id,
      'user',
      NEW.profile_id,
      COALESCE(NEW.guest_name, 'Guest'),
      NEW.initial_message,
      false
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 3: Harden delete_user_data function with search_path
CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id text)
RETURNS TABLE(id_front_url text, id_back_url text, selfie_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  RETURN QUERY 
  DELETE FROM public.verification_requests 
  WHERE profile_id = target_profile_id 
  RETURNING 
    verification_requests.id_front_url, 
    verification_requests.id_back_url, 
    verification_requests.selfie_url;

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
$function$;

-- Fix 4-6: Remove overly permissive INSERT policies
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can insert inbound emails" ON public.inbound_emails;
DROP POLICY IF EXISTS "Service role can insert messages" ON public.ticket_messages;