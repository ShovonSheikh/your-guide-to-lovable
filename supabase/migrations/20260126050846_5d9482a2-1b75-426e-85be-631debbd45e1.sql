-- Migration: Fix functions with mutable search_path
-- Issue: Functions without search_path can be exploited via search_path injection attacks

-- ============================================
-- 1. FIX: update_funding_goal_on_tip function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_funding_goal_on_tip()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  goal_record RECORD;
  old_percentage NUMERIC;
  new_percentage NUMERIC;
  milestone_crossed INTEGER;
  creator_email TEXT;
  creator_first_name TEXT;
BEGIN
  -- Only trigger when payment status changes to 'completed'
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Get creator info for email notification
    SELECT email, first_name INTO creator_email, creator_first_name
    FROM public.profiles
    WHERE id = NEW.creator_id;
    
    FOR goal_record IN 
      SELECT * FROM public.funding_goals
      WHERE profile_id = NEW.creator_id AND is_active = true
    LOOP
      -- Calculate percentages before and after
      old_percentage := CASE 
        WHEN goal_record.target_amount > 0 
        THEN (goal_record.current_amount / goal_record.target_amount) * 100 
        ELSE 0 
      END;
      new_percentage := CASE 
        WHEN goal_record.target_amount > 0 
        THEN ((goal_record.current_amount + NEW.amount) / goal_record.target_amount) * 100 
        ELSE 0 
      END;
      
      -- Check for milestone crossings (50%, 75%, 100%)
      milestone_crossed := NULL;
      IF old_percentage < 100 AND new_percentage >= 100 THEN
        milestone_crossed := 100;
      ELSIF old_percentage < 75 AND new_percentage >= 75 AND new_percentage < 100 THEN
        milestone_crossed := 75;
      ELSIF old_percentage < 50 AND new_percentage >= 50 AND new_percentage < 75 THEN
        milestone_crossed := 50;
      END IF;
      
      -- Update the goal amount
      UPDATE public.funding_goals
      SET current_amount = current_amount + NEW.amount, updated_at = now()
      WHERE id = goal_record.id;
      
      -- If milestone crossed, insert notification for the creator
      IF milestone_crossed IS NOT NULL THEN
        INSERT INTO public.notifications (profile_id, type, title, message, data)
        VALUES (
          NEW.creator_id,
          CASE 
            WHEN milestone_crossed = 100 THEN 'goal_milestone_100'
            WHEN milestone_crossed = 75 THEN 'goal_milestone_75'
            ELSE 'goal_milestone_50'
          END,
          CASE 
            WHEN milestone_crossed = 100 THEN '🎉 Goal Achieved!'
            ELSE '🎯 Goal Progress: ' || milestone_crossed || '%'
          END,
          goal_record.title || ' reached ' || milestone_crossed || '%',
          jsonb_build_object(
            'goal_id', goal_record.id,
            'goal_title', goal_record.title,
            'milestone', milestone_crossed,
            'current_amount', goal_record.current_amount + NEW.amount,
            'target_amount', goal_record.target_amount,
            'percentage', new_percentage,
            'email', creator_email,
            'first_name', creator_first_name
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================
-- 2. FIX: get_supporter_donations function
-- ============================================
CREATE OR REPLACE FUNCTION public.get_supporter_donations(supporter_profile_id uuid)
 RETURNS TABLE(id uuid, creator_username text, creator_name text, creator_avatar text, amount numeric, currency text, message text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supporter_email_addr TEXT;
BEGIN
  -- Get the email for the supporter profile
  SELECT email INTO supporter_email_addr FROM profiles WHERE profiles.id = supporter_profile_id;
  
  IF supporter_email_addr IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id,
    p.username AS creator_username,
    COALESCE(p.first_name || ' ' || p.last_name, p.username)::TEXT AS creator_name,
    p.avatar_url::TEXT AS creator_avatar,
    t.amount,
    COALESCE(t.currency, 'BDT')::TEXT AS currency,
    t.message::TEXT,
    t.created_at
  FROM tips t
  JOIN profiles p ON t.creator_id = p.id
  WHERE t.supporter_email = supporter_email_addr
    AND t.payment_status = 'completed'
  ORDER BY t.created_at DESC;
END;
$function$;