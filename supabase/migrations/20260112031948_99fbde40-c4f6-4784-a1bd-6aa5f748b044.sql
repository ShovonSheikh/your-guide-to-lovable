-- Phase 1: Database Schema Updates for Admin Panel and Push Notifications

-- 1.1 Add is_admin field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 1.2 Create push_subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, endpoint)
);

-- 1.3 Create notification_settings table for user preferences
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tips_enabled boolean DEFAULT true,
  withdrawals_enabled boolean DEFAULT true,
  promotions_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.4 Create admin_activity_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) NOT NULL,
  action text NOT NULL,
  target_type text, -- 'user', 'withdrawal', 'tip', 'creator', etc.
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.5 Create notifications table for in-app notification center
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'tip_received', 'withdrawal_update', etc.
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions (user_id is text from Clerk)
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

-- RLS Policies for notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

-- RLS Policies for admin_activity_logs (admin only)
CREATE POLICY "Admins can view all activity logs"
  ON admin_activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND is_admin = true));

CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND is_admin = true));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()::text));

-- Admin policies for withdrawal_requests
CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND is_admin = true));

CREATE POLICY "Admins can update all withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND is_admin = true));

-- Admin policies for profiles (to manage users)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND is_admin = true));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND is_admin = true));

-- Admin policies for tips (to view all)
CREATE POLICY "Admins can view all tips"
  ON tips FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()::text AND is_admin = true));

-- Triggers for updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Set the first creator (shovon) as admin for testing
UPDATE profiles SET is_admin = true WHERE username = 'shovon';