-- Create trigger function to update creator stats when tips are completed
CREATE OR REPLACE FUNCTION public.update_creator_stats_on_tip()
RETURNS TRIGGER AS $$
DECLARE
  supporter_exists BOOLEAN;
BEGIN
  -- Only trigger when payment status changes to 'completed'
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    
    -- Check if this supporter has previously tipped this creator
    SELECT EXISTS(
      SELECT 1 FROM public.tips 
      WHERE creator_id = NEW.creator_id 
        AND supporter_email = NEW.supporter_email 
        AND payment_status = 'completed'
        AND id != NEW.id
    ) INTO supporter_exists;
    
    -- Update creator's total_received and total_supporters
    UPDATE public.profiles
    SET 
      total_received = total_received + NEW.amount,
      total_supporters = CASE 
        WHEN NOT supporter_exists THEN total_supporters + 1 
        ELSE total_supporters 
      END,
      updated_at = now()
    WHERE id = NEW.creator_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on tips table
CREATE TRIGGER update_creator_stats_on_tip_completion
  AFTER INSERT OR UPDATE OF payment_status ON public.tips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_creator_stats_on_tip();

-- Fix the growth calculation function for new creators
CREATE OR REPLACE FUNCTION public.get_creator_current_month_stats(creator_profile_id uuid)
RETURNS TABLE(
  current_month_earnings numeric,
  previous_month_earnings numeric,
  current_month_tips bigint,
  previous_month_tips bigint,
  earnings_change_percent numeric,
  tips_change_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_start timestamp with time zone;
  previous_start timestamp with time zone;
  previous_end timestamp with time zone;
  curr_earnings numeric;
  prev_earnings numeric;
  curr_tips bigint;
  prev_tips bigint;
BEGIN
  current_start := date_trunc('month', now());
  previous_start := date_trunc('month', now() - interval '1 month');
  previous_end := current_start;

  -- Get current month earnings
  SELECT COALESCE(SUM(t.amount), 0) INTO curr_earnings
  FROM tips t 
  WHERE t.creator_id = creator_profile_id 
    AND t.payment_status = 'completed'
    AND t.created_at >= current_start;

  -- Get previous month earnings
  SELECT COALESCE(SUM(t.amount), 0) INTO prev_earnings
  FROM tips t 
  WHERE t.creator_id = creator_profile_id 
    AND t.payment_status = 'completed'
    AND t.created_at >= previous_start 
    AND t.created_at < previous_end;

  -- Get current month tip count
  SELECT COALESCE(COUNT(*), 0) INTO curr_tips
  FROM tips t 
  WHERE t.creator_id = creator_profile_id 
    AND t.payment_status = 'completed'
    AND t.created_at >= current_start;

  -- Get previous month tip count
  SELECT COALESCE(COUNT(*), 0) INTO prev_tips
  FROM tips t 
  WHERE t.creator_id = creator_profile_id 
    AND t.payment_status = 'completed'
    AND t.created_at >= previous_start 
    AND t.created_at < previous_end;

  RETURN QUERY SELECT 
    curr_earnings,
    prev_earnings,
    curr_tips,
    prev_tips,
    -- Fixed earnings change percent: 100% for first month with earnings, 0% if no activity
    CASE 
      WHEN prev_earnings = 0 THEN 
        CASE WHEN curr_earnings > 0 THEN 100::numeric ELSE 0::numeric END
      ELSE ROUND(((curr_earnings - prev_earnings) / prev_earnings) * 100, 2)
    END,
    -- Fixed tips change percent
    CASE 
      WHEN prev_tips = 0 THEN 
        CASE WHEN curr_tips > 0 THEN 100::numeric ELSE 0::numeric END
      ELSE ROUND(((curr_tips - prev_tips)::numeric / prev_tips) * 100, 2)
    END;
END;
$$;

-- Backfill existing creator stats from tips table
UPDATE profiles p
SET 
  total_received = COALESCE((
    SELECT SUM(amount) FROM tips 
    WHERE creator_id = p.id AND payment_status = 'completed'
  ), 0),
  total_supporters = COALESCE((
    SELECT COUNT(DISTINCT supporter_email) FROM tips 
    WHERE creator_id = p.id AND payment_status = 'completed'
  ), 0),
  updated_at = now()
WHERE account_type = 'creator';