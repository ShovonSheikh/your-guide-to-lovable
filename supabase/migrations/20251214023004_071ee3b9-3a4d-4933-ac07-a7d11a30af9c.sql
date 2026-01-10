-- Create enum for account types
CREATE TYPE public.account_type AS ENUM ('supporter', 'creator');

-- Create enum for onboarding status
CREATE TYPE public.onboarding_status AS ENUM ('pending', 'account_type', 'payment', 'profile', 'completed');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  account_type account_type DEFAULT 'supporter',
  onboarding_status onboarding_status DEFAULT 'pending',
  twitter TEXT,
  instagram TEXT,
  youtube TEXT,
  facebook TEXT,
  other_link TEXT,
  is_verified BOOLEAN DEFAULT false,
  total_received NUMERIC DEFAULT 0,
  total_supporters INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create creator subscriptions table (for paid creators)
CREATE TABLE public.creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BDT',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  signup_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  active_until TIMESTAMP WITH TIME ZONE,
  billing_start TIMESTAMP WITH TIME ZONE,
  promo BOOLEAN DEFAULT true,
  payout_method TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tips/donations table
CREATE TABLE public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  supporter_name TEXT NOT NULL,
  supporter_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BDT',
  message TEXT,
  transaction_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BDT',
  payout_method TEXT NOT NULL,
  payout_details JSONB,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id');

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Creator subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
ON public.creator_subscriptions FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id'));

CREATE POLICY "Users can insert their own subscriptions"
ON public.creator_subscriptions FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id'));

-- Tips policies
CREATE POLICY "Creators can view tips they received"
ON public.tips FOR SELECT
USING (creator_id IN (SELECT id FROM public.profiles WHERE user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id'));

CREATE POLICY "Anyone can insert tips"
ON public.tips FOR INSERT
WITH CHECK (true);

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id'));

CREATE POLICY "Users can insert their own withdrawal requests"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id'));

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
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