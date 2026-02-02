-- Add fee model configuration for percentage-based fees
INSERT INTO platform_config (key, value, description) VALUES
('fee_model', '{"type": "fixed"}', 'Fee model: fixed or percentage'),
('percentage_fee', '{"rate": 15, "min_amount": 0}', 'Percentage-based fee settings (rate in %)')
ON CONFLICT (key) DO NOTHING;

-- Update withdrawal validation trigger to support both fee models
CREATE OR REPLACE FUNCTION public.check_withdrawal_amount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$
DECLARE
  total_received NUMERIC;
  pending_withdrawals NUMERIC;
  creator_fee NUMERIC;
  available_balance NUMERIC;
  fee_model JSONB;
  fixed_fee JSONB;
  percentage_fee JSONB;
BEGIN
  -- Fetch fee configuration
  SELECT value INTO fee_model FROM platform_config WHERE key = 'fee_model';
  SELECT value INTO fixed_fee FROM platform_config WHERE key = 'creator_account_fee';
  SELECT value INTO percentage_fee FROM platform_config WHERE key = 'percentage_fee';
  
  -- Get total received for this creator
  SELECT COALESCE(p.total_received, 0) INTO total_received
  FROM profiles p WHERE p.id = NEW.profile_id;
  
  -- Calculate fee based on model
  IF fee_model IS NOT NULL AND (fee_model->>'type') = 'percentage' THEN
    creator_fee := GREATEST(
      COALESCE((percentage_fee->>'min_amount')::NUMERIC, 0),
      ROUND(total_received * (COALESCE((percentage_fee->>'rate')::NUMERIC, 15) / 100))
    );
  ELSE
    -- Default to fixed fee
    creator_fee := COALESCE((fixed_fee->>'amount')::NUMERIC, 150);
  END IF;
  
  -- Get sum of pending/processing withdrawals (excluding current if update)
  SELECT COALESCE(SUM(amount), 0) INTO pending_withdrawals
  FROM withdrawal_requests
  WHERE profile_id = NEW.profile_id
  AND status IN ('pending', 'processing')
  AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Calculate available balance
  available_balance := total_received - creator_fee - pending_withdrawals;
  
  -- Validate the new withdrawal doesn't exceed available
  IF NEW.amount > available_balance THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', available_balance, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$function$;