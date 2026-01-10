-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE public.account_type AS ENUM ('supporter', 'creator');
CREATE TYPE public.onboarding_status AS ENUM ('pending', 'account_type', 'payment', 'profile', 'completed');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (synced from Clerk)
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  email text,
  first_name text,
  last_name text,
  username text UNIQUE,
  bio text,
  avatar_url text,
  twitter text,
  instagram text,
  youtube text,
  facebook text,
  other_link text,
  account_type public.account_type DEFAULT 'supporter'::account_type,
  onboarding_status public.onboarding_status DEFAULT 'pending'::onboarding_status,
  is_verified boolean DEFAULT false,
  total_received numeric DEFAULT 0,
  total_supporters integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tips table
CREATE TABLE public.tips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  supporter_name text NOT NULL,
  supporter_email text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'BDT'::text,
  message text,
  is_anonymous boolean DEFAULT false,
  payment_status text DEFAULT 'pending'::text,
  payment_method text,
  transaction_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- Creator signups table (pre-payment signup data)
CREATE TABLE public.creator_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text,
  first_name text,
  last_name text,
  email text,
  bio text,
  category text,
  twitter text,
  instagram text,
  youtube text,
  other_link text,
  phone text,
  payout_method text,
  amount numeric,
  currency text DEFAULT 'BDT'::text,
  promo boolean DEFAULT true,
  signup_date timestamp with time zone DEFAULT now(),
  active_until timestamp with time zone,
  billing_start timestamp with time zone,
  transaction_id text,
  payment_status text DEFAULT 'pending'::text,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Creator subscriptions table
CREATE TABLE public.creator_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text,
  payout_method text,
  amount numeric DEFAULT 0,
  currency text DEFAULT 'BDT'::text,
  promo boolean DEFAULT true,
  signup_date timestamp with time zone DEFAULT now(),
  active_until timestamp with time zone,
  billing_start timestamp with time zone,
  transaction_id text,
  payment_status text DEFAULT 'pending'::text,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Billing records table
CREATE TABLE public.billing_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.creator_subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'BDT'::text,
  status text DEFAULT 'pending'::text,
  transaction_id text,
  payment_method text,
  billing_period_start timestamp with time zone,
  billing_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'BDT'::text,
  payout_method text NOT NULL,
  payout_details jsonb,
  status text DEFAULT 'pending'::text,
  notes text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Rate limits table
CREATE TABLE public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  action text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(identifier, action)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_tips_creator_id ON public.tips(creator_id);
CREATE INDEX idx_tips_supporter_id ON public.tips(supporter_id);
CREATE INDEX idx_tips_created_at ON public.tips(created_at);
CREATE INDEX idx_tips_payment_status ON public.tips(payment_status);
CREATE INDEX idx_creator_subscriptions_profile_id ON public.creator_subscriptions(profile_id);
CREATE INDEX idx_billing_records_profile_id ON public.billing_records(profile_id);
CREATE INDEX idx_withdrawal_requests_profile_id ON public.withdrawal_requests(profile_id);
CREATE INDEX idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_signups_updated_at
  BEFORE UPDATE ON public.creator_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_subscriptions_updated_at
  BEFORE UPDATE ON public.creator_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_records_updated_at
  BEFORE UPDATE ON public.billing_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text));

-- Tips policies
CREATE POLICY "Anyone can insert tips"
  ON public.tips FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can view tips they received"
  ON public.tips FOR SELECT
  USING (creator_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

CREATE POLICY "Anyone can view completed tips for public display"
  ON public.tips FOR SELECT
  USING (payment_status = 'completed');

-- Creator signups policies (public insert for onboarding)
CREATE POLICY "Allow public inserts"
  ON public.creator_signups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role full access"
  ON public.creator_signups FOR ALL
  USING (true);

-- Creator subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.creator_subscriptions FOR SELECT
  USING (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

CREATE POLICY "Users can insert their own subscriptions"
  ON public.creator_subscriptions FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

CREATE POLICY "Users can update their own subscriptions"
  ON public.creator_subscriptions FOR UPDATE
  USING (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

-- Billing records policies
CREATE POLICY "Users can view their own billing records"
  ON public.billing_records FOR SELECT
  USING (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

CREATE POLICY "Users can insert their own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT profiles.id FROM profiles
    WHERE profiles.user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id'::text)
  ));

-- Rate limits policies (service role only)
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (true);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to get creator monthly earnings
CREATE OR REPLACE FUNCTION public.get_creator_monthly_earnings(creator_profile_id uuid)
RETURNS TABLE(month text, amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(tips.created_at, 'YYYY-MM') as month,
    COALESCE(SUM(tips.amount), 0) as amount
  FROM tips
  WHERE tips.creator_id = creator_profile_id
    AND tips.payment_status = 'completed'
    AND tips.created_at >= (now() - interval '12 months')
  GROUP BY to_char(tips.created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$;

-- Function to get creator current month stats with comparison
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
BEGIN
  current_start := date_trunc('month', now());
  previous_start := date_trunc('month', now() - interval '1 month');
  previous_end := current_start;

  RETURN QUERY
  SELECT 
    COALESCE((
      SELECT SUM(t.amount) FROM tips t 
      WHERE t.creator_id = creator_profile_id 
        AND t.payment_status = 'completed'
        AND t.created_at >= current_start
    ), 0) as current_month_earnings,
    COALESCE((
      SELECT SUM(t.amount) FROM tips t 
      WHERE t.creator_id = creator_profile_id 
        AND t.payment_status = 'completed'
        AND t.created_at >= previous_start 
        AND t.created_at < previous_end
    ), 0) as previous_month_earnings,
    COALESCE((
      SELECT COUNT(*) FROM tips t 
      WHERE t.creator_id = creator_profile_id 
        AND t.payment_status = 'completed'
        AND t.created_at >= current_start
    ), 0) as current_month_tips,
    COALESCE((
      SELECT COUNT(*) FROM tips t 
      WHERE t.creator_id = creator_profile_id 
        AND t.payment_status = 'completed'
        AND t.created_at >= previous_start 
        AND t.created_at < previous_end
    ), 0) as previous_month_tips,
    CASE 
      WHEN COALESCE((
        SELECT SUM(t.amount) FROM tips t 
        WHERE t.creator_id = creator_profile_id 
          AND t.payment_status = 'completed'
          AND t.created_at >= previous_start 
          AND t.created_at < previous_end
      ), 0) = 0 THEN 0
      ELSE ROUND(
        ((COALESCE((
          SELECT SUM(t.amount) FROM tips t 
          WHERE t.creator_id = creator_profile_id 
            AND t.payment_status = 'completed'
            AND t.created_at >= current_start
        ), 0) - COALESCE((
          SELECT SUM(t.amount) FROM tips t 
          WHERE t.creator_id = creator_profile_id 
            AND t.payment_status = 'completed'
            AND t.created_at >= previous_start 
            AND t.created_at < previous_end
        ), 0)) / COALESCE((
          SELECT SUM(t.amount) FROM tips t 
          WHERE t.creator_id = creator_profile_id 
            AND t.payment_status = 'completed'
            AND t.created_at >= previous_start 
            AND t.created_at < previous_end
        ), 1)) * 100, 2
      )
    END as earnings_change_percent,
    CASE 
      WHEN COALESCE((
        SELECT COUNT(*) FROM tips t 
        WHERE t.creator_id = creator_profile_id 
          AND t.payment_status = 'completed'
          AND t.created_at >= previous_start 
          AND t.created_at < previous_end
      ), 0) = 0 THEN 0
      ELSE ROUND(
        ((COALESCE((
          SELECT COUNT(*) FROM tips t 
          WHERE t.creator_id = creator_profile_id 
            AND t.payment_status = 'completed'
            AND t.created_at >= current_start
        ), 0)::numeric - COALESCE((
          SELECT COUNT(*) FROM tips t 
          WHERE t.creator_id = creator_profile_id 
            AND t.payment_status = 'completed'
            AND t.created_at >= previous_start 
            AND t.created_at < previous_end
        ), 0)::numeric) / COALESCE((
          SELECT COUNT(*) FROM tips t 
          WHERE t.creator_id = creator_profile_id 
            AND t.payment_status = 'completed'
            AND t.created_at >= previous_start 
            AND t.created_at < previous_end
        ), 1)::numeric) * 100, 2
      )
    END as tips_change_percent;
END;
$$;

-- Function to get supporter donations
CREATE OR REPLACE FUNCTION public.get_supporter_donations(supporter_profile_id uuid)
RETURNS TABLE(
  id uuid,
  creator_username text,
  creator_name text,
  creator_avatar text,
  amount numeric,
  currency text,
  message text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    p.username as creator_username,
    CONCAT(p.first_name, ' ', p.last_name) as creator_name,
    p.avatar_url as creator_avatar,
    t.amount,
    t.currency,
    t.message,
    t.created_at
  FROM tips t
  JOIN profiles p ON t.creator_id = p.id
  WHERE t.supporter_id = supporter_profile_id
    AND t.payment_status = 'completed'
  ORDER BY t.created_at DESC;
END;
$$;

-- Function to increment creator stats after tip
CREATE OR REPLACE FUNCTION public.increment_creator_stats(
  creator_profile_id uuid,
  tip_amount numeric,
  is_new_supporter boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET 
    total_received = total_received + tip_amount,
    total_supporters = CASE WHEN is_new_supporter THEN total_supporters + 1 ELSE total_supporters END,
    updated_at = now()
  WHERE id = creator_profile_id;
END;
$$;