-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to send weekly summary emails every Sunday at 3 AM UTC (9 AM BDT)
SELECT cron.schedule(
  'weekly-creator-summary',
  '0 3 * * 0',  -- Every Sunday at 3 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://bwkrtkalxygmvlkuleoc.supabase.co/functions/v1/weekly-summary',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3a3J0a2FseHlnbXZsa3VsZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDE5NjQsImV4cCI6MjA2NDYxNzk2NH0.BNpmKIb0fBPbQr0e2l49f2Lz6fAqCvKsJqWQTTGqlCE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Also add a database-level check to prevent over-withdrawals (defense in depth)
CREATE OR REPLACE FUNCTION check_withdrawal_amount()
RETURNS TRIGGER AS $$
DECLARE
  total_received NUMERIC;
  pending_withdrawals NUMERIC;
  creator_fee NUMERIC := 150;
  available_balance NUMERIC;
BEGIN
  -- Get total received for this creator
  SELECT COALESCE(p.total_received, 0) INTO total_received
  FROM profiles p WHERE p.id = NEW.profile_id;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for withdrawal validation
DROP TRIGGER IF EXISTS validate_withdrawal_amount ON withdrawal_requests;
CREATE TRIGGER validate_withdrawal_amount
BEFORE INSERT ON withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION check_withdrawal_amount();