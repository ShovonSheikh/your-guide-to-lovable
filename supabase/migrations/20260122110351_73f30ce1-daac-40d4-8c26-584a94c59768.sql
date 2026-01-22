-- Create funding_goals table
CREATE TABLE public.funding_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funding_goals ENABLE ROW LEVEL SECURITY;

-- Public can view active goals for creators
CREATE POLICY "Anyone can view active funding goals"
ON public.funding_goals FOR SELECT
USING (is_active = true);

-- Creators can view all their goals
CREATE POLICY "Users can view their own funding goals"
ON public.funding_goals FOR SELECT
USING (profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
));

-- Creators can create goals
CREATE POLICY "Users can create their own funding goals"
ON public.funding_goals FOR INSERT
WITH CHECK (profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
));

-- Creators can update their goals
CREATE POLICY "Users can update their own funding goals"
ON public.funding_goals FOR UPDATE
USING (profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
));

-- Creators can delete their goals
CREATE POLICY "Users can delete their own funding goals"
ON public.funding_goals FOR DELETE
USING (profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-clerk-user-id')
));

-- Trigger for updated_at
CREATE TRIGGER update_funding_goals_updated_at
BEFORE UPDATE ON public.funding_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_funding_goals_profile_id ON public.funding_goals(profile_id);
CREATE INDEX idx_funding_goals_active ON public.funding_goals(is_active) WHERE is_active = true;