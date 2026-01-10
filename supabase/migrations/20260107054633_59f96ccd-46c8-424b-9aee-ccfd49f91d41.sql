-- =========================================
-- 1. AUTO-UPDATE CREATOR STATS TRIGGER
-- =========================================

-- Create function to update creator stats when a tip is inserted
CREATE OR REPLACE FUNCTION public.update_creator_stats_on_tip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_supporter_count INTEGER;
BEGIN
  -- Check if this supporter (by email) has tipped this creator before
  SELECT COUNT(DISTINCT supporter_email) INTO existing_supporter_count
  FROM public.tips
  WHERE creator_id = NEW.creator_id
    AND supporter_email = NEW.supporter_email
    AND id != NEW.id
    AND payment_status = 'completed';

  -- Update creator's total_received and total_supporters
  UPDATE public.profiles
  SET 
    total_received = COALESCE(total_received, 0) + NEW.amount,
    total_supporters = CASE 
      WHEN existing_supporter_count = 0 THEN COALESCE(total_supporters, 0) + 1
      ELSE total_supporters
    END,
    updated_at = now()
  WHERE id = NEW.creator_id;

  RETURN NEW;
END;
$$;

-- Create trigger for tip insertion
DROP TRIGGER IF EXISTS on_tip_created ON public.tips;
CREATE TRIGGER on_tip_created
  AFTER INSERT ON public.tips
  FOR EACH ROW
  WHEN (NEW.payment_status = 'completed')
  EXECUTE FUNCTION public.update_creator_stats_on_tip();

-- =========================================
-- 2. DATABASE RATE LIMITING TABLE
-- =========================================

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on key for efficient lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);

-- Create index for cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- Enable RLS on rate_limits (service role only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Only service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- =========================================
-- 3. SUBSCRIPTION BILLING TABLE
-- =========================================

-- Create billing_records table for subscription tracking
CREATE TABLE IF NOT EXISTS public.billing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.creator_subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 150,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  deducted_from_earnings BOOLEAN DEFAULT false,
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing records
CREATE POLICY "Users can view their own billing records"
ON public.billing_records
FOR SELECT
USING (profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
));

-- Only service role can insert/update billing records
CREATE POLICY "Service role can manage billing records"
ON public.billing_records
FOR ALL
USING (true)
WITH CHECK (true);

-- =========================================
-- 4. DATABASE INTEGRITY - ADD FOREIGN KEYS & CASCADES
-- =========================================

-- Add cascade delete for tips when creator profile is deleted
-- First drop existing constraint if any
ALTER TABLE public.tips 
  DROP CONSTRAINT IF EXISTS tips_creator_id_fkey;

ALTER TABLE public.tips
  ADD CONSTRAINT tips_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Add cascade delete for creator_subscriptions when profile is deleted
ALTER TABLE public.creator_subscriptions
  DROP CONSTRAINT IF EXISTS creator_subscriptions_profile_id_fkey;

ALTER TABLE public.creator_subscriptions
  ADD CONSTRAINT creator_subscriptions_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Add cascade delete for withdrawal_requests when profile is deleted
ALTER TABLE public.withdrawal_requests
  DROP CONSTRAINT IF EXISTS withdrawal_requests_profile_id_fkey;

ALTER TABLE public.withdrawal_requests
  ADD CONSTRAINT withdrawal_requests_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- =========================================
-- 5. ENABLE REALTIME FOR TIPS TABLE
-- =========================================

-- Enable full replica identity for tips (needed for realtime)
ALTER TABLE public.tips REPLICA IDENTITY FULL;

-- Add tips to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tips;

-- =========================================
-- 6. HELPER FUNCTION FOR MONTHLY EARNINGS
-- =========================================

CREATE OR REPLACE FUNCTION public.get_creator_monthly_earnings(
  p_creator_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE(
  month_start DATE,
  month_label TEXT,
  total_amount NUMERIC,
  tip_count INTEGER,
  unique_supporters INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', t.created_at)::DATE as month_start,
    TO_CHAR(t.created_at, 'Mon YYYY') as month_label,
    COALESCE(SUM(t.amount), 0)::NUMERIC as total_amount,
    COUNT(t.id)::INTEGER as tip_count,
    COUNT(DISTINCT t.supporter_email)::INTEGER as unique_supporters
  FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE - (p_months || ' months')::INTERVAL),
    DATE_TRUNC('month', CURRENT_DATE),
    '1 month'::INTERVAL
  ) as months(month_date)
  LEFT JOIN public.tips t ON 
    DATE_TRUNC('month', t.created_at) = months.month_date
    AND t.creator_id = p_creator_id
    AND t.payment_status = 'completed'
  GROUP BY DATE_TRUNC('month', t.created_at), TO_CHAR(t.created_at, 'Mon YYYY'), months.month_date
  ORDER BY months.month_date DESC;
END;
$$;

-- =========================================
-- 7. HELPER FUNCTION FOR THIS MONTH'S STATS
-- =========================================

CREATE OR REPLACE FUNCTION public.get_creator_current_month_stats(p_creator_id UUID)
RETURNS TABLE(
  this_month_total NUMERIC,
  last_month_total NUMERIC,
  growth_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_this_month NUMERIC;
  v_last_month NUMERIC;
  v_growth NUMERIC;
BEGIN
  -- This month's earnings
  SELECT COALESCE(SUM(amount), 0) INTO v_this_month
  FROM public.tips
  WHERE creator_id = p_creator_id
    AND payment_status = 'completed'
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);

  -- Last month's earnings
  SELECT COALESCE(SUM(amount), 0) INTO v_last_month
  FROM public.tips
  WHERE creator_id = p_creator_id
    AND payment_status = 'completed'
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND created_at < DATE_TRUNC('month', CURRENT_DATE);

  -- Calculate growth percentage
  IF v_last_month = 0 THEN
    v_growth := CASE WHEN v_this_month > 0 THEN 100 ELSE 0 END;
  ELSE
    v_growth := ROUND(((v_this_month - v_last_month) / v_last_month) * 100, 1);
  END IF;

  RETURN QUERY SELECT v_this_month, v_last_month, v_growth;
END;
$$;

-- =========================================
-- 8. HELPER FUNCTION FOR SUPPORTER DONATION HISTORY
-- =========================================

CREATE OR REPLACE FUNCTION public.get_supporter_donations(p_user_email TEXT)
RETURNS TABLE(
  id UUID,
  creator_username TEXT,
  creator_name TEXT,
  creator_avatar TEXT,
  amount NUMERIC,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    p.username,
    COALESCE(p.first_name || ' ' || p.last_name, p.username)::TEXT as creator_name,
    p.avatar_url,
    t.amount,
    t.message,
    t.created_at
  FROM public.tips t
  JOIN public.profiles p ON t.creator_id = p.id
  WHERE t.supporter_email = p_user_email
    AND t.payment_status = 'completed'
  ORDER BY t.created_at DESC
  LIMIT 50;
END;
$$;