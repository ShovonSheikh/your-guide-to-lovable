-- Add UPDATE policy for creator_subscriptions so users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" 
ON creator_subscriptions
FOR UPDATE 
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers', true)::json ->> 'x-clerk-user-id')
  )
);
