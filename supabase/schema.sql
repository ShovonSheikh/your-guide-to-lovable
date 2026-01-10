-- TipKoro Database Schema
-- Generated: 2026-01-03
-- This file recreates the entire database schema

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE public.account_type AS ENUM ('supporter', 'creator');
CREATE TYPE public.onboarding_status AS ENUM ('pending', 'completed');

-- ============================================
-- FUNCTIONS
-- ============================================

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

-- Profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  email text,
  first_name text,
  last_name text,
  username text,
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
  creator_id uuid NOT NULL,
  supporter_id uuid,
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
  profile_id uuid NOT NULL,
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

-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
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

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
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
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

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

-- Creator signups policies
CREATE POLICY "Allow public inserts"
  ON public.creator_signups FOR INSERT
  WITH CHECK (true);

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
