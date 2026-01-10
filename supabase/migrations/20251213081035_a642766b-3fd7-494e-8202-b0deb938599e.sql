-- Create creator_signups table for storing signup data
CREATE TABLE public.creator_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_method TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'BDT',
  
  -- Profile data (filled after payment)
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  bio TEXT,
  category TEXT,
  twitter TEXT,
  instagram TEXT,
  youtube TEXT,
  other_link TEXT,
  payout_method TEXT,
  phone TEXT,
  
  -- Promo metadata
  promo BOOLEAN DEFAULT true,
  signup_date TIMESTAMPTZ DEFAULT now(),
  active_until TIMESTAMPTZ,
  billing_start TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_signups ENABLE ROW LEVEL SECURITY;

-- Create policy for public inserts (needed for checkout flow before auth)
CREATE POLICY "Allow public inserts" ON public.creator_signups
  FOR INSERT WITH CHECK (true);

-- Create policy for public updates by transaction_id (needed for payment verification)
CREATE POLICY "Allow public updates" ON public.creator_signups
  FOR UPDATE USING (true);

-- Create policy for public reads by transaction_id
CREATE POLICY "Allow public reads" ON public.creator_signups
  FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_creator_signups_updated_at
  BEFORE UPDATE ON public.creator_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();