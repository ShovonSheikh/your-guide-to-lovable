-- Make shovonali885@gmail.com a creator for 1 month
-- Profile ID: 0a9bdb1a-76e7-4270-b506-9632a99e787e

-- Update profile to creator with completed onboarding
UPDATE profiles 
SET 
  account_type = 'creator',
  onboarding_status = 'completed',
  is_admin = true,
  updated_at = now()
WHERE id = '0a9bdb1a-76e7-4270-b506-9632a99e787e';

-- Create creator subscription for 1 month (promo period)
INSERT INTO creator_subscriptions (
  profile_id,
  phone,
  payout_method,
  amount,
  currency,
  promo,
  signup_date,
  active_until,
  billing_start,
  payment_status,
  payment_method
) VALUES (
  '0a9bdb1a-76e7-4270-b506-9632a99e787e',
  NULL,
  'bkash',
  0,
  'BDT',
  true,
  now(),
  now() + interval '1 month',
  now() + interval '1 month',
  'completed',
  'promo'
);