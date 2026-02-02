-- Add column to store Resend's internal email_id separately
-- This keeps message_id for RFC 2822 Message-ID (used for threading)
-- and resend_email_id for Resend API calls
ALTER TABLE inbound_emails ADD COLUMN IF NOT EXISTS resend_email_id text;