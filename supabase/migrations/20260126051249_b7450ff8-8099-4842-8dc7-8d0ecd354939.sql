-- Migration: Move pg_net extension from public to extensions schema
-- Issue: Extensions in public schema can be accessed by all roles, posing security risk
-- Solution: Move to dedicated 'extensions' schema per Supabase best practices

-- First, ensure the extensions schema exists (it should on Supabase projects)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate pg_net in the extensions schema
-- Note: pg_net is used by pg_cron for HTTP requests
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;