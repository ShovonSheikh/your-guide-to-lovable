-- Fix total_supporters to count unique supporters only (by email)
UPDATE profiles p
SET total_supporters = (
  SELECT COUNT(DISTINCT supporter_email)
  FROM tips t
  WHERE t.creator_id = p.id
  AND t.payment_status = 'completed'
)
WHERE p.account_type = 'creator';