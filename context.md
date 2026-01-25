# Context: Fix PostgreSQL net.http_post Error

## Issue

When a supporter tips a creator, the application throws the following PostgreSQL error:

```json
{
  "code": "42883",
  "message": "function net.http_post(url => text, headers => jsonb, body => text) does not exist",
  "hint": "No function matches the given name and argument types."
}
```

## Root Cause

Two database triggers were created that use `net.http_post` from the `pg_net` extension:

1. **Goal Milestone Email Trigger** (`20260124035607_ece0ce9d-7c51-46b7-b4fe-e3545cdb0b8d.sql`)
   - Function: `send_goal_milestone_email()`
   - Trigger: `send_goal_milestone_email_trigger` on `notifications` table

2. **Weekly Summary Cron Job** (`20260119093401_77459f81-bb8d-41d2-b13a-c86a2361aabb.sql`)
   - Cron job: `weekly-creator-summary`

The `pg_net` extension is **not available on hosted Supabase instances** - it requires a self-hosted setup with specific configuration.

## Solution

Created a migration to remove the pg_net-dependent components:

### Migration File
`supabase/migrations/20260126161000_remove_pgnet_triggers.sql`

This migration:
- Drops the `send_goal_milestone_email_trigger` trigger
- Drops the `send_goal_milestone_email()` function
- Unschedules the `weekly-creator-summary` cron job

### Alternative Approach

Email notifications are already handled correctly through:
1. **Edge Functions** called from the frontend/backend directly
2. **send-email-notification Edge Function** handles all email sending via Resend API

No functionality is lost - the database triggers were redundant.

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260126161000_remove_pgnet_triggers.sql` | **NEW** - Migration to remove pg_net triggers |
| `context.md` | **NEW** - This documentation file |

## Migration Instructions

**IMPORTANT:** Do **NOT** run `supabase db push` or similar commands.

Run the migration SQL manually in the Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Paste the contents of `20260126161000_remove_pgnet_triggers.sql`
3. Execute

## Current State

- Branch: `fix/pg-net-http-post-error`
- Migration file created but NOT applied
- Ready for manual migration execution and merge to main
