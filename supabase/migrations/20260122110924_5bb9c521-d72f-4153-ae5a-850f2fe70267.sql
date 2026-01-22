-- Create a function to update funding goal progress when a tip is completed
CREATE OR REPLACE FUNCTION public.update_funding_goal_on_tip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process when payment_status changes to 'completed'
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Update all active funding goals for this creator by adding the tip amount
    UPDATE public.funding_goals
    SET 
      current_amount = current_amount + NEW.amount,
      updated_at = now()
    WHERE 
      profile_id = NEW.creator_id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tips table for updates (payment status changes)
CREATE TRIGGER update_funding_goals_on_tip_completion
AFTER INSERT OR UPDATE OF payment_status ON public.tips
FOR EACH ROW
EXECUTE FUNCTION public.update_funding_goal_on_tip();