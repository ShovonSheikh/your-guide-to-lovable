-- Delete existing tips for this creator
DELETE FROM tips WHERE creator_id = 'a7486c24-a70f-4217-bcf7-50ea18d0dcf5';

-- Insert a new donation record of 1400 BDT
INSERT INTO tips (
  creator_id,
  supporter_name,
  supporter_email,
  amount,
  currency,
  message,
  is_anonymous,
  payment_status,
  payment_method,
  created_at
) VALUES (
  'a7486c24-a70f-4217-bcf7-50ea18d0dcf5',
  'Rahul Ahmed',
  'rahul@example.com',
  1400,
  'BDT',
  'Great content! Keep up the amazing work! 🎉',
  false,
  'completed',
  'bkash',
  NOW()
);

-- Update the creator's total_received and total_supporters
UPDATE profiles 
SET 
  total_received = 1400,
  total_supporters = 1
WHERE id = 'a7486c24-a70f-4217-bcf7-50ea18d0dcf5';