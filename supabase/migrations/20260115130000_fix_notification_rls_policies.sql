-- Fix RLS policies for push_subscriptions and notification_settings
-- to use x-clerk-user-id header instead of auth.uid()

-- Drop existing policies for push_subscriptions
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;

-- Create new policies for push_subscriptions using Clerk user ID header
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));

CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));

CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));

-- Drop existing policies for notification_settings
DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;

-- Create new policies for notification_settings using Clerk user ID header
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));

-- Drop existing policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create new policies for notifications using Clerk user ID header
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = (current_setting('request.headers'::text, true)::json ->> 'x-clerk-user-id')
  ));
