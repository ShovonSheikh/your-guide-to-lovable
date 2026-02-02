

# Database Issues Fix Plan

## Overview

This plan addresses all 9 database linter issues found in the Supabase project while ensuring existing functionality remains intact. The issues fall into three categories:

1. **Security Definer View (1 ERROR)** - Views that may bypass RLS policies
2. **Function Search Path Mutable (2 WARNINGs)** - Functions without explicit search_path
3. **RLS Policy Always True (6 WARNINGs)** - Overly permissive INSERT/UPDATE/DELETE policies

---

## Current Issues Analysis

### Issue 1: Security Definer View (ERROR)

**Finding:** The `public_tips` view has `security_barrier=true` but is still flagged. The `public_profiles` view correctly uses `security_invoker=true`.

**Problem:** The `public_tips` view uses `security_barrier` instead of `security_invoker`, which can still pose security risks.

**Fix:** Recreate `public_tips` view with `security_invoker=true` to enforce RLS of the querying user.

### Issue 2-3: Function Search Path Mutable (WARN)

**Finding:** Two functions lack explicit `search_path`:
- `create_initial_ticket_message()` 
- `delete_user_data()`

**Problem:** Without an explicit search_path, these functions are vulnerable to search_path injection attacks.

**Fix:** Add `SET search_path TO 'public'` to both functions.

### Issues 4-9: RLS Policy Always True (WARN)

These policies use `WITH CHECK (true)` for INSERT operations:

| Table | Policy | Analysis | Action |
|-------|--------|----------|--------|
| `approved_gifs` | SELECT `USING (true)` | OK - intentionally public read | Keep as-is |
| `creator_signups` | ALL `true/true` (service_role only) | OK - restricted to service_role | Keep as-is |
| `email_logs` | INSERT `WITH CHECK (true)` | Needs fix - should be service_role only | Restrict |
| `inbound_emails` | INSERT `WITH CHECK (true)` | Needs fix - should be service_role only | Restrict |
| `platform_config` | SELECT `USING (true)` | OK - intentionally public read | Keep as-is |
| `rate_limits` | ALL `true` | OK - used by edge functions via service_role | Keep as-is |
| `support_tickets` | INSERT `WITH CHECK (true)` | OK - guests can create tickets | Keep as-is |
| `ticket_messages` | INSERT `WITH CHECK (true)` | Needs fix - should restrict | Restrict |
| `tips` | INSERT `WITH CHECK (true)` (service_role) | OK - restricted to service_role | Keep as-is |

---

## Detailed Fixes

### Fix 1: Update public_tips View

Replace `security_barrier` with `security_invoker`:

```sql
-- Drop and recreate public_tips view with security_invoker
DROP VIEW IF EXISTS public.public_tips;

CREATE VIEW public.public_tips
WITH (security_invoker=on) AS
SELECT 
    id,
    creator_id,
    amount,
    currency,
    message,
    is_anonymous,
    created_at,
    CASE
        WHEN is_anonymous THEN 'Anonymous'::text
        ELSE supporter_name
    END AS supporter_display_name
FROM tips
WHERE payment_status = 'completed';
```

**Impact:** View will now respect the RLS policies of the calling user, matching how `public_profiles` works.

### Fix 2: Harden create_initial_ticket_message Function

Add `SET search_path TO 'public'`:

```sql
CREATE OR REPLACE FUNCTION public.create_initial_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.initial_message IS NOT NULL THEN
    INSERT INTO public.ticket_messages (
      ticket_id,
      sender_type,
      sender_id,
      sender_name,
      message,
      is_internal
    ) VALUES (
      NEW.id,
      'user',
      NEW.profile_id,
      COALESCE(NEW.guest_name, 'Guest'),
      NEW.initial_message,
      false
    );
  END IF;
  RETURN NEW;
END;
$function$;
```

### Fix 3: Harden delete_user_data Function

Add `SET search_path TO 'public'`:

```sql
CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id text)
RETURNS TABLE(id_front_url text, id_back_url text, selfie_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
-- ... existing function body unchanged ...
$function$;
```

### Fix 4: Restrict email_logs INSERT Policy

The current policy allows anyone to insert. It should only allow service_role:

```sql
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;

-- Create restrictive policy (service_role bypasses RLS, but this makes intent clear)
-- Actually, since service_role bypasses RLS anyway, we just remove the public insert
-- No need for a replacement - service_role will still work
```

**Note:** Service role bypasses RLS automatically, so removing the `WITH CHECK (true)` policy for public role is sufficient.

### Fix 5: Restrict inbound_emails INSERT Policy

Similar to email_logs:

```sql
-- Drop the overly permissive policy  
DROP POLICY IF EXISTS "Service role can insert inbound emails" ON public.inbound_emails;
```

### Fix 6: Restrict ticket_messages INSERT Policy

The "Service role can insert messages" policy allows anyone to insert. We need to keep functionality for:
1. Edge functions inserting messages (via service_role)
2. Users inserting messages to their own tickets

Current policies are correct for users. Just remove the overly permissive service role one:

```sql
-- Remove overly permissive policy
DROP POLICY IF EXISTS "Service role can insert messages" ON public.ticket_messages;
```

**Note:** Edge functions use service_role which bypasses RLS, so this won't break anything.

---

## Policies That Should STAY As-Is

These policies are intentionally permissive and should NOT be changed:

1. **`approved_gifs` SELECT (true)** - GIFs are meant to be publicly viewable for streamer alerts
2. **`creator_signups` ALL (true)** - Restricted to service_role, used by edge functions
3. **`platform_config` SELECT (true)** - Configuration is intentionally public (maintenance mode, etc.)
4. **`rate_limits` ALL (true)** - Used by edge functions for rate limiting via service_role
5. **`support_tickets` INSERT (true)** - Guests need to create tickets without authentication
6. **`tips` INSERT (true)** - Restricted to service_role, used by create-tip edge function

---

## Implementation Steps

### Step 1: Create Migration File

A single migration will handle all fixes:

```sql
-- Fix public_tips view security
DROP VIEW IF EXISTS public.public_tips;
CREATE VIEW public.public_tips
WITH (security_invoker=on) AS
SELECT 
    id, creator_id, amount, currency, message, is_anonymous, created_at,
    CASE WHEN is_anonymous THEN 'Anonymous'::text ELSE supporter_name END AS supporter_display_name
FROM public.tips
WHERE payment_status = 'completed';

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.create_initial_ticket_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.initial_message IS NOT NULL THEN
    INSERT INTO public.ticket_messages (ticket_id, sender_type, sender_id, sender_name, message, is_internal)
    VALUES (NEW.id, 'user', NEW.profile_id, COALESCE(NEW.guest_name, 'Guest'), NEW.initial_message, false);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id text)
RETURNS TABLE(id_front_url text, id_back_url text, selfie_url text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$
-- Full function body preserved
$function$;

-- Remove overly permissive INSERT policies
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can insert inbound emails" ON public.inbound_emails;
DROP POLICY IF EXISTS "Service role can insert messages" ON public.ticket_messages;
```

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|------------|------------|
| public_tips view | Low | Uses same pattern as working public_profiles |
| Function search_path | None | Standard security hardening, no behavior change |
| email_logs policy | None | Service role bypasses RLS anyway |
| inbound_emails policy | None | Service role bypasses RLS anyway |
| ticket_messages policy | None | User policies + service role cover all use cases |

---

## Verification After Migration

1. **Explore page** - Creators should still load from public_profiles view
2. **Creator profile** - Recent tips should display via public_tips view
3. **Support tickets** - Guests can still create tickets
4. **Ticket replies** - Logged-in users can reply to their tickets
5. **Admin functions** - Admins can manage tickets
6. **Email sending** - Edge functions can still log emails (via service_role)
7. **User deletion** - delete_user_data function works correctly

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/XXXXXX_fix_database_security_issues.sql` | Single migration with all fixes |

---

## Technical Notes

- Service role always bypasses RLS, so removing `WITH CHECK (true)` policies doesn't affect edge functions
- The `security_invoker=on` option makes views respect the calling user's RLS permissions
- All functions with SECURITY DEFINER should have explicit search_path to prevent injection attacks
- The remaining "always true" warnings are intentional for public-facing features

