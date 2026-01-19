-- Fix broken RLS policies for mailboxes and withdrawal_requests
-- These currently use auth.uid() or auth.jwt() which don't work with Clerk

-- Fix mailboxes table RLS policies
DROP POLICY IF EXISTS "Admins can view mailboxes" ON mailboxes;
DROP POLICY IF EXISTS "Admins can insert mailboxes" ON mailboxes;
DROP POLICY IF EXISTS "Admins can manage mailboxes" ON mailboxes;
DROP POLICY IF EXISTS "Admins can insert emails" ON inbound_emails;
DROP POLICY IF EXISTS "Admins can view emails" ON inbound_emails;
DROP POLICY IF EXISTS "Admins can update emails" ON inbound_emails;
DROP POLICY IF EXISTS "Admins can manage inbound emails" ON inbound_emails;

-- Create fixed policies for mailboxes using is_admin() function
CREATE POLICY "Admins can view mailboxes" ON mailboxes
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert mailboxes" ON mailboxes
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update mailboxes" ON mailboxes
  FOR UPDATE USING (is_admin());

-- Create fixed policies for inbound_emails using is_admin() function
CREATE POLICY "Admins can view emails" ON inbound_emails
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert emails" ON inbound_emails
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update emails" ON inbound_emails
  FOR UPDATE USING (is_admin());

-- Fix withdrawal_requests RLS policies
-- First drop the broken policies that use auth.uid()
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update all withdrawal requests" ON withdrawal_requests;

-- Create fixed policies using is_admin() function
CREATE POLICY "Admins can view all withdrawals" ON withdrawal_requests
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all withdrawals" ON withdrawal_requests
  FOR UPDATE USING (is_admin());