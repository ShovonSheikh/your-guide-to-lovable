-- Update the funding goal trigger to detect milestone achievements and send notifications
CREATE OR REPLACE FUNCTION public.update_funding_goal_on_tip()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to use the updated function
DROP TRIGGER IF EXISTS trigger_update_funding_goal_on_tip ON public.tips;
CREATE TRIGGER trigger_update_funding_goal_on_tip
  AFTER UPDATE ON public.tips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_funding_goal_on_tip();