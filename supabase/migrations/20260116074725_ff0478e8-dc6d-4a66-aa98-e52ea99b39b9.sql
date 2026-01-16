-- Fix the get_supporter_donations function to properly match tips by supporter email
CREATE OR REPLACE FUNCTION get_supporter_donations(supporter_profile_id UUID)
RETURNS TABLE (
  id UUID,
  creator_username TEXT,
  creator_name TEXT,
  creator_avatar TEXT,
  amount NUMERIC,
  currency TEXT,
  message TEXT,
  created_at TIMESTAMPTZ
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;