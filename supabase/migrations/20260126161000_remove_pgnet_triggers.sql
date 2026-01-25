-- Migration: Remove pg_net Dependent Triggers
-- 
-- Issue: Function net.http_post(url => text, headers => jsonb, body => text) does not exist
-- 
-- The pg_net extension is not available on hosted Supabase (requires self-hosted instance).
-- This migration removes the triggers and functions that depend on pg_net.
-- 
-- Affected components:
-- 1. Goal milestone email trigger (send_goal_milestone_email)
-- 2. Weekly summary cron job (weekly-creator-summary)
-- 
-- NOTE: Email notifications are already handled by:
-- - Edge Functions called from the frontend/backend directly
-- - The send-email-notification Edge Function handles all email sending

-- ============================================
-- PART 1: Remove Goal Milestone Email Trigger
-- ============================================

-- Drop the trigger first
DROP TRIGGER IF EXISTS send_goal_milestone_email_trigger ON public.notifications;

-- Drop the function
DROP FUNCTION IF EXISTS public.send_goal_milestone_email();

-- ============================================
-- PART 2: Remove Weekly Summary Cron Job
-- ============================================

-- Unschedule the cron job (if pg_cron is available)
-- This is wrapped in a DO block to prevent errors if cron extension doesn't exist
DO $$
BEGIN
  -- Try to unschedule the weekly summary job
  PERFORM cron.unschedule('weekly-creator-summary');
EXCEPTION
  WHEN undefined_function THEN
    -- pg_cron not available, that's fine
    NULL;
  WHEN others THEN
    -- Job might not exist, that's also fine
    NULL;
END $$;

-- ============================================
-- Notes for future implementation:
-- ============================================
-- Weekly summaries should be triggered by:
-- 1. An external cron service (e.g., Vercel Cron, GitHub Actions)
-- 2. Calling the weekly-summary Edge Function directly
-- 
-- Goal milestone emails are triggered by:
-- 1. The frontend/backend when a tip is received
-- 2. The send-email-notification Edge Function
